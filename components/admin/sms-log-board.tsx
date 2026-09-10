import { SmsRetryButton } from "@/components/admin/sms-retry-button";
import { DataTable, StatusBadge } from "@/components/admin/ui";
import { formatDateTime } from "@/lib/format";
import type { SmsLogListItem } from "@/lib/sms/sms.service";
import type { SmsEventType, SmsStatus } from "@/types/database";

export const SMS_EVENT_LABELS: Record<SmsEventType, string> = {
  ORDER_PLACED: "Order placed",
  ORDER_CONFIRMED: "Confirmed",
  ORDER_READY_PICKUP: "Ready for pickup",
  ORDER_OUT_FOR_DELIVERY: "Out for delivery",
  ORDER_DELIVERED: "Delivered",
  ORDER_CANCELLED: "Cancelled",
  CAMPAIGN: "Offer / special",
};

const STATUS_VARIANT: Record<SmsStatus, "success" | "warning" | "danger" | "neutral"> = {
  SENT: "success",
  PENDING: "warning",
  FAILED: "danger",
  SKIPPED: "neutral",
};

function StatusCell({ log }: { log: SmsLogListItem }) {
  return (
    <td>
      <StatusBadge variant={STATUS_VARIANT[log.status]}>{log.status}</StatusBadge>
      {log.error_message ? (
        <p className="text-muted-foreground mt-1 max-w-xs text-xs">{log.error_message}</p>
      ) : null}
    </td>
  );
}

function RetryCell({ log }: { log: SmsLogListItem }) {
  return (
    <td className="text-right">
      {log.status === "FAILED" || log.status === "SKIPPED" ? <SmsRetryButton id={log.id} /> : null}
    </td>
  );
}

export function isOfferSms(log: SmsLogListItem) {
  return log.event_type === "CAMPAIGN";
}

export function needsSmsRetry(log: SmsLogListItem) {
  return log.status === "FAILED" || log.status === "SKIPPED";
}

export function groupOfferBroadcasts(logs: SmsLogListItem[]) {
  const groups = new Map<string, SmsLogListItem[]>();
  for (const log of logs) {
    const bucket = log.created_at.slice(0, 16);
    const key = `${bucket}|${log.message}`;
    const current = groups.get(key) ?? [];
    current.push(log);
    groups.set(key, current);
  }
  return [...groups.values()].map((items) => {
    const sorted = [...items].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    const sent = sorted.filter((item) => item.status === "SENT").length;
    const failed = sorted.filter((item) => needsSmsRetry(item)).length;
    return {
      id: sorted[0]!.id,
      message: sorted[0]!.message,
      createdAt: sorted[0]!.created_at,
      items: sorted,
      sent,
      failed,
    };
  });
}

export function OrderSmsTable({
  logs,
  timezone,
}: {
  logs: SmsLogListItem[];
  timezone: string;
}) {
  return (
    <DataTable>
      <table className="admin-table">
        <thead>
          <tr>
            <th>When</th>
            <th>Order</th>
            <th>Event</th>
            <th>Phone</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td className="whitespace-nowrap text-muted-foreground">
                {formatDateTime(log.created_at, timezone)}
              </td>
              <td className="font-medium">{log.orders?.order_number ?? "—"}</td>
              <td>{SMS_EVENT_LABELS[log.event_type]}</td>
              <td>{log.phone_number}</td>
              <StatusCell log={log} />
              <RetryCell log={log} />
            </tr>
          ))}
        </tbody>
      </table>
    </DataTable>
  );
}

export function OfferSmsList({
  logs,
  timezone,
}: {
  logs: SmsLogListItem[];
  timezone: string;
}) {
  const groups = groupOfferBroadcasts(logs);

  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <article key={group.id} className="admin-card overflow-hidden">
          <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border/70 px-4 py-3">
            <div className="min-w-0 max-w-2xl">
              <p className="text-muted-foreground text-xs">
                {formatDateTime(group.createdAt, timezone)} · {group.items.length}{" "}
                {group.items.length === 1 ? "recipient" : "recipients"}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-foreground">{group.message}</p>
            </div>
            <p className="text-muted-foreground shrink-0 text-xs">
              {group.sent} sent
              {group.failed > 0 ? ` · ${group.failed} need retry` : ""}
            </p>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[28rem] text-sm">
              <thead>
                <tr>
                  <th className="text-muted-foreground px-4 py-2 text-left text-xs font-medium">Phone</th>
                  <th className="text-muted-foreground px-4 py-2 text-left text-xs font-medium">Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {group.items.map((log) => (
                  <tr key={log.id} className="border-t border-border/60">
                    <td className="px-4 py-2.5 font-medium">{log.phone_number}</td>
                    <StatusCell log={log} />
                    <RetryCell log={log} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      ))}
    </div>
  );
}
