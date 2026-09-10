import { normalisePhone, phoneSchema } from "@/lib/validations/common";

export const CAMPAIGN_MESSAGE_MAX = 320;
export const CAMPAIGN_MAX_RECIPIENTS = 80;
export const CAMPAIGN_MAX_IMPORT = 100;

export type CampaignTemplateId = "weekend" | "offer" | "friday" | "custom";

export function campaignTemplate(id: CampaignTemplateId, restaurantName: string, orderUrl: string): string {
  const link = orderUrl.replace(/\/$/, "") + "/";
  switch (id) {
    case "weekend":
      return `Hi! ${restaurantName} weekend specials are ON! Enjoy fresh Kottu, Rice, Biriyani & more. Order for pickup or delivery: ${link}`;
    case "offer":
      return `Hi! A new special offer is waiting for you at ${restaurantName}. Check our menu and order today for pickup or delivery: ${link}`;
    case "friday":
      return `Hi! Don't cook this Friday night! Enjoy our Special Chicken Pizza for only Rs. 1,600 at ${restaurantName}. Order now: ${link}`;
    case "custom":
      return "";
  }
}

export function smsSegmentCount(message: string): number {
  if (message.length === 0) return 0;
  return Math.ceil(message.length / 160);
}

export type ClassifiedPhone = {
  raw: string;
  name: string;
  normalized?: string;
  status: "new" | "duplicate" | "invalid";
};

export function parseCustomerImportLines(raw: string): { phone: string; name: string }[] {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const rows: { phone: string; name: string }[] = [];
  for (const line of lines) {
    const parts = line.split(/[,;\t]/).map((part) => part.trim().replace(/^["']|["']$/g, ""));
    if (parts.length === 0) continue;
    const [first = "", second = ""] = parts;
    if (/^(phone|mobile|number|name)$/i.test(first) && (!second || /^(phone|mobile|number|name)$/i.test(second))) {
      continue;
    }

    const firstIsPhone = /[\d+]/.test(first) && phoneSchema.safeParse(first).success;
    const secondIsPhone = /[\d+]/.test(second) && phoneSchema.safeParse(second).success;

    if (firstIsPhone) {
      rows.push({ phone: first, name: second && !secondIsPhone ? second : "Customer" });
    } else if (secondIsPhone) {
      rows.push({ phone: second, name: first || "Customer" });
    } else {
      rows.push({ phone: first, name: second || "Customer" });
    }
  }
  return rows;
}

export function classifyImportedPhones(
  rows: { phone: string; name: string }[],
  existingNormalized: Iterable<string>,
  countryCode = "94",
): ClassifiedPhone[] {
  const existing = new Set(existingNormalized);
  const seenInBatch = new Set<string>();

  return rows.map((row) => {
    const parsed = phoneSchema.safeParse(row.phone);
    if (!parsed.success) {
      return { raw: row.phone, name: row.name.trim() || "Customer", status: "invalid" };
    }
    const normalized = normalisePhone(parsed.data, countryCode);
    if (existing.has(normalized) || seenInBatch.has(normalized)) {
      return { raw: row.phone, name: row.name.trim() || "Customer", normalized, status: "duplicate" };
    }
    seenInBatch.add(normalized);
    return { raw: row.phone, name: row.name.trim() || "Customer", normalized, status: "new" };
  });
}
