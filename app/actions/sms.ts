"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import { actionFailure, actionSuccess, toUserMessage, type ActionResult } from "@/lib/errors";
import { checkRateLimit } from "@/lib/services/rate-limit";
import { retrySmsLog } from "@/lib/sms/sms.service";
import { uuidSchema } from "@/lib/validations/common";

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
