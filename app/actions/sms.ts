"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import { actionFailure, actionSuccess, toUserMessage, type ActionResult, AppError } from "@/lib/errors";
import { recordAudit } from "@/lib/services/audit.service";
import { getCustomersByIds, insertCustomers, listCustomersForAdmin } from "@/lib/services/customer.service";
import { checkRateLimit } from "@/lib/services/rate-limit";
import {
  CAMPAIGN_MAX_IMPORT,
  classifyImportedPhones,
  parseCustomerImportLines,
} from "@/lib/sms/campaign";
import { retrySmsLog, sendCampaignMessage, smsNotificationsEnabled } from "@/lib/sms/sms.service";
import { serverEnv } from "@/lib/env";
import { fieldErrorsFrom, uuidSchema } from "@/lib/validations/common";
import { addCustomerSchema, importCustomersSchema, sendCampaignSchema } from "@/lib/validations/sms";
import type { SmsStatus } from "@/types/database";

function revalidateSms() {
  revalidatePath("/admin/sms");
  revalidatePath("/admin/sms/campaign");
}

export async function retrySmsLogAction(id: string): Promise<ActionResult<{ sent: true }>> {
  const parsed = uuidSchema.safeParse(id);
  if (!parsed.success) return actionFailure("That SMS log could not be found.");

  try {
    const profile = await requireRole(["ADMIN"]);
    const limit = await checkRateLimit("sms:retry", profile.id, 20, 3600);
    if (!limit.allowed) {
      return actionFailure("Too many SMS retries. Please wait before trying again.");
    }
    const sent = await retrySmsLog(parsed.data);
    revalidatePath("/admin/sms");
    if (!sent) return actionFailure("The SMS gateway did not accept the message.");
    return actionSuccess({ sent: true });
  } catch (error) {
    return actionFailure(toUserMessage(error, "Could not resend this SMS."));
  }
}

export async function addCustomerAction(
  input: unknown,
): Promise<ActionResult<{ id: string; phone: string }>> {
  const parsed = addCustomerSchema.safeParse(input);
  if (!parsed.success) return actionFailure("Check the highlighted fields.", fieldErrorsFrom(parsed.error));

  try {
    const profile = await requireRole(["ADMIN"]);
    const limit = await checkRateLimit("sms:import", profile.id, 40, 3600);
    if (!limit.allowed) return actionFailure("Too many number uploads. Please wait a minute.");

    const { added, duplicatePhones } = await insertCustomers([parsed.data]);
    if (duplicatePhones.length > 0 || added.length === 0) {
      return actionFailure("That mobile number is already saved.", {
        phone: ["This number is already in the customer list."],
      });
    }

    await recordAudit({
      profileId: profile.id,
      action: "customer.imported",
      entity: "customers",
      entityId: added[0]!.id,
      metadata: { added: 1 },
    });
    revalidateSms();
    return actionSuccess({ id: added[0]!.id, phone: added[0]!.phone });
  } catch (error) {
    return actionFailure(toUserMessage(error, "Could not save this number."));
  }
}

export async function importCustomersAction(
  input: unknown,
): Promise<ActionResult<{ added: number; duplicates: number; invalid: number }>> {
  const parsed = importCustomersSchema.safeParse(input);
  if (!parsed.success) return actionFailure("Paste or upload at least one mobile number.", fieldErrorsFrom(parsed.error));

  try {
    const profile = await requireRole(["ADMIN"]);
    const limit = await checkRateLimit("sms:import", profile.id, 40, 3600);
    if (!limit.allowed) return actionFailure("Too many number uploads. Please wait a minute.");

    const rows = parseCustomerImportLines(parsed.data.text);
    if (rows.length === 0) return actionFailure("No mobile numbers were found in that list.");
    if (rows.length > CAMPAIGN_MAX_IMPORT) {
      return actionFailure(`Import at most ${CAMPAIGN_MAX_IMPORT} numbers at a time.`);
    }

    const existing = await listCustomersForAdmin();
    const classified = classifyImportedPhones(
      rows,
      existing.map((customer) => customer.phone),
      serverEnv().SMS_DEFAULT_COUNTRY_CODE,
    );
    const fresh = classified.filter((row) => row.status === "new" && row.normalized);
    const result = await insertCustomers(
      fresh.map((row) => ({ name: row.name, phone: row.normalized! })),
    );

    await recordAudit({
      profileId: profile.id,
      action: "customer.imported",
      entity: "customers",
      metadata: {
        added: result.added.length,
        duplicates: classified.filter((row) => row.status === "duplicate").length,
        invalid: classified.filter((row) => row.status === "invalid").length,
      },
    });
    revalidateSms();
    return actionSuccess({
      added: result.added.length,
      duplicates: classified.filter((row) => row.status === "duplicate").length,
      invalid: classified.filter((row) => row.status === "invalid").length,
    });
  } catch (error) {
    return actionFailure(toUserMessage(error, "Could not import these numbers."));
  }
}

export async function sendCampaignAction(
  input: unknown,
): Promise<ActionResult<{ sent: number; failed: number; skipped: number }>> {
  const parsed = sendCampaignSchema.safeParse(input);
  if (!parsed.success) return actionFailure("Check the message and selected numbers.", fieldErrorsFrom(parsed.error));

  try {
    const profile = await requireRole(["ADMIN"]);
    const limit = await checkRateLimit("sms:campaign", profile.id, 8, 3600);
    if (!limit.allowed) {
      return actionFailure("Too many broadcasts in a short time. Please wait before sending again.");
    }

    const customers = await getCustomersByIds(parsed.data.customerIds);
    if (customers.length === 0) return actionFailure("None of those customers could be found.");

    const unique = new Map(customers.map((customer) => [customer.phone, customer]));
    const recipients = [...unique.values()];

    if (!smsNotificationsEnabled()) {
      throw new AppError("SMS is turned off. Set SMS_PROVIDER in the environment before sending offers.");
    }

    const tallies = { sent: 0, failed: 0, skipped: 0 };
    const queue = [...recipients];
    const workers = Array.from({ length: Math.min(5, queue.length) }, async () => {
      while (queue.length > 0) {
        const customer = queue.shift();
        if (!customer) break;
        const status: SmsStatus = await sendCampaignMessage({
          phoneNumber: customer.phone,
          message: parsed.data.message,
        });
        if (status === "SENT") tallies.sent += 1;
        else if (status === "SKIPPED") tallies.skipped += 1;
        else tallies.failed += 1;
      }
    });
    await Promise.all(workers);

    await recordAudit({
      profileId: profile.id,
      action: "sms.campaign_sent",
      entity: "sms_logs",
      metadata: {
        recipients: recipients.length,
        sent: tallies.sent,
        failed: tallies.failed,
        skipped: tallies.skipped,
      },
    });
    revalidateSms();
    return actionSuccess(tallies);
  } catch (error) {
    return actionFailure(toUserMessage(error, "Could not send this SMS."));
  }
}
