import { EmptyState } from "@/components/empty-state";
import { AdminPageHeader } from "@/components/admin/page-header";
import { SmsRetryButton } from "@/components/admin/sms-retry-button";
import { DataTable, StatusBadge } from "@/components/admin/ui";
import { formatDateTime } from "@/lib/format";
import { getRestaurantSettings } from "@/lib/services/settings.service";
import { listRecentSmsLogs } from "@/lib/sms/sms.service";
import type { SmsEventType, SmsStatus } from "@/types/database";

const EVENT_LABELS: Record<SmsEventType, string> = {
  ORDER_PLACED: "Order placed",
  ORDER_CONFIRMED: "Confirmed",
  ORDER_READY_PICKUP: "Ready for pickup",
  ORDER_OUT_FOR_DELIVERY: "Out for delivery",
  ORDER_DELIVERED: "Delivered",
  ORDER_CANCELLED: "Cancelled",
};

const STATUS_VARIANT: Record<SmsStatus, "success" | "warning" | "danger" | "neutral"> = {
  SENT: "success",
  PENDING: "warning",
  FAILED: "danger",
  SKIPPED: "neutral",
};

export default async function AdminSmsPage() {
  const [settings, logs] = await Promise.all([getRestaurantSettings(), listRecentSmsLogs()]);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Notifications"
        title="SMS log"
        description="Every customer text is recorded here. Failed messages can be sent again without placing a new order."
      />
      {logs.length === 0 ? (
        <EmptyState
          title="No SMS yet"
          description="Place a test order after Text.lk is configured. Messages appear here even if the gateway rejects them."
        />
      ) : (
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
                    {formatDateTime(log.created_at, settings.timezone)}
                  </td>
                  <td className="font-medium">{log.orders?.order_number ?? "—"}</td>
                  <td>{EVENT_LABELS[log.event_type]}</td>
                  <td>{log.phone_number}</td>
                  <td>
                    <StatusBadge variant={STATUS_VARIANT[log.status]}>{log.status}</StatusBadge>
                    {log.error_message ? (
                      <p className="text-muted-foreground mt-1 max-w-xs text-xs">{log.error_message}</p>
                    ) : null}
                  </td>
                  <td className="text-right">
                    {log.status === "FAILED" || log.status === "SKIPPED" ? <SmsRetryButton id={log.id} /> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTable>
      )}
    </div>
  );
}
