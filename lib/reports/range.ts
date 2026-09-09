export type ReportRangePreset = "today" | "yesterday" | "7d" | "30d" | "90d";

export const REPORT_RANGE_PRESETS: readonly ReportRangePreset[] = [
  "today",
  "yesterday",
  "7d",
  "30d",
  "90d",
];

export const RANGE_PRESET_LABELS: Record<ReportRangePreset, string> = {
  today: "Today",
  yesterday: "Yesterday",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
};

export function parseRangePreset(
  value: string | undefined,
  fallback: ReportRangePreset = "7d",
): ReportRangePreset {
  return REPORT_RANGE_PRESETS.includes(value as ReportRangePreset)
    ? (value as ReportRangePreset)
    : fallback;
}
