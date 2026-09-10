import { z } from "zod";

import { CAMPAIGN_MAX_RECIPIENTS, CAMPAIGN_MESSAGE_MAX } from "@/lib/sms/campaign";
import { optionalText, phoneSchema, uuidSchema } from "@/lib/validations/common";

export const addCustomerSchema = z.object({
  name: optionalText(80).transform((value) => value ?? "Customer"),
  phone: phoneSchema,
});

export const importCustomersSchema = z.object({
  text: z.string().trim().min(1, "Paste or upload at least one mobile number."),
});

export const sendCampaignSchema = z.object({
  message: z
    .string()
    .trim()
    .min(10, "Write a short message customers will understand.")
    .max(CAMPAIGN_MESSAGE_MAX, `Keep the message to ${CAMPAIGN_MESSAGE_MAX} characters or fewer.`),
  customerIds: z
    .array(uuidSchema)
    .min(1, "Select at least one customer.")
    .max(CAMPAIGN_MAX_RECIPIENTS, `Send to at most ${CAMPAIGN_MAX_RECIPIENTS} numbers at a time.`),
});
