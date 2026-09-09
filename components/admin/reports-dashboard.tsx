import { ReportsExportButtons } from "@/components/admin/reports-export-buttons";
import { DataTable, StatCard } from "@/components/admin/ui";
import { ReportsCharts } from "@/components/charts/reports-charts";
import { formatMoney, formatNumber } from "@/lib/format";
import { sharePercent, statusLabel, typeLabel, type RankedRow, type ReportDocument } from "@/lib/reports/model";
import { cn } from "@/lib/utils";

export function ReportsDashboard({ report }: { report: ReportDocument }) {
  const { summary, currency } = report;
  const pickupShare = sharePercent(summary.pickup_orders, summary.total_orders);
  const deliveryShare = sharePercent(summary.delivery_orders, summary.total_orders);
  const typeTotal = report.types.reduce((sum, row) => sum + row.orders, 0);
  const statusTotal = report.status.reduce((sum, row) => sum + row.orders, 0);

  return (
    <div className="space-y-6">
      <div className="admin-toolbar mb-0 justify-between sm:px-4">
        <div className="min-w-0 px-1 py-1">
          <p className="text-sm font-medium text-foreground">{report.rangeLabel}</p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {report.periodLabel} · {report.timezone}
          </p>
        </div>
        <ReportsExportButtons report={report} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Orders"
          value={formatNumber(summary.total_orders, currency.locale)}
          hint={`${formatNumber(summary.completed_orders, currency.locale)} completed · ${formatNumber(summary.cancelled_orders, currency.locale)} cancelled`}
        />
        <StatCard
          label="Revenue"
          value={formatMoney(summary.revenue, currency)}
          hint={
            summary.uncollected_payments > 0
              ? `${formatNumber(summary.uncollected_payments, currency.locale)} still uncollected`
              : "Collected and completed sales"
          }
        />
        <StatCard
          label="Items sold"
          value={formatNumber(summary.items_sold, currency.locale)}
          hint={`${formatNumber(summary.pickup_orders, currency.locale)} pickup · ${formatNumber(summary.delivery_orders, currency.locale)} delivery`}
        />
        <StatCard
          label="Average order"
          value={formatMoney(summary.average_order_value, currency)}
          hint="Revenue divided by orders in this range"
        />
      </div>

      <ReportsCharts report={report} />

      <div className="grid gap-4 xl:grid-cols-5">
        <section className="xl:col-span-3">
          <PerformanceTable
            title="Category performance"
            description="Menu groups ranked by revenue."
            nameHeader="Category"
            rows={report.categories}
            empty="No category sales in this range."
            currency={currency}
          />
        </section>
        <section className="admin-card flex flex-col p-5 xl:col-span-2">
          <h2 className="text-base font-semibold tracking-tight">Order mix</h2>
          <p className="text-muted-foreground mt-0.5 text-sm">How orders were placed and where they stand.</p>
          <div className="mt-5 space-y-5">
            <div>
              <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">Type</p>
              {report.types.length === 0 ? (
                <p className="text-muted-foreground text-sm">No orders in this range.</p>
              ) : (
                <ul className="space-y-3">
                  {report.types.map((row) => {
                    const share = sharePercent(row.orders, typeTotal || summary.total_orders);
                    return (
                      <li key={row.order_type}>
                        <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                          <span className="font-medium">{typeLabel(row.order_type)}</span>
                          <span className="text-muted-foreground">
                            {formatNumber(row.orders, currency.locale)} · {formatMoney(row.revenue, currency)}
                          </span>
                        </div>
                        <ShareBar value={share} />
                      </li>
                    );
                  })}
                </ul>
              )}
              <p className="text-muted-foreground mt-3 text-xs">
                Pickup {pickupShare}% · Delivery {deliveryShare}%
              </p>
            </div>
            <div>
              <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">Status</p>
              {report.status.length === 0 ? (
                <p className="text-muted-foreground text-sm">No status totals in this range.</p>
              ) : (
                <ul className="space-y-2.5">
                  {report.status.map((row) => (
                    <li key={row.status} className="flex items-center justify-between gap-3 text-sm">
                      <span>{statusLabel(row.status)}</span>
                      <span className="text-muted-foreground tabular-nums">
                        {formatNumber(row.orders, currency.locale)}
                        <span className="ml-2 text-xs">
                          {sharePercent(row.orders, statusTotal || summary.total_orders)}%
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      </div>

      <PerformanceTable
        title="Item performance"
        description="Dishes ranked by revenue for the selected period."
        nameHeader="Item"
        rows={report.items}
        empty="No item sales in this range."
        currency={currency}
      />
    </div>
  );
}

function PerformanceTable({
  title,
  description,
  nameHeader,
  rows,
  empty,
  currency,
}: {
  title: string;
  description: string;
  nameHeader: string;
  rows: RankedRow[];
  empty: string;
  currency: ReportDocument["currency"];
}) {
  return (
    <section>
      <div className="mb-3">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        <p className="text-muted-foreground mt-0.5 text-sm">{description}</p>
      </div>
      {rows.length === 0 ? (
        <div className="admin-card px-5 py-10 text-center">
          <p className="text-muted-foreground text-sm">{empty}</p>
        </div>
      ) : (
        <DataTable>
          <table className="admin-table min-w-[36rem]">
            <thead>
              <tr>
                <th className="w-12">#</th>
                <th>{nameHeader}</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Revenue</th>
                <th className="text-right">Avg</th>
                <th className="min-w-[10rem]">Share</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.name}>
                  <td className="text-muted-foreground tabular-nums">{index + 1}</td>
                  <td className="font-medium text-foreground">{row.name}</td>
                  <td className="text-right tabular-nums">{formatNumber(row.quantity, currency.locale)}</td>
                  <td className="text-right font-medium tabular-nums">{formatMoney(row.revenue, currency)}</td>
                  <td className="text-muted-foreground text-right tabular-nums">
                    {formatMoney(row.average, currency)}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <ShareBar value={row.bar} className="flex-1" />
                      <span className="text-muted-foreground w-10 text-right text-xs tabular-nums">{row.share}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTable>
      )}
    </section>
  );
}

function ShareBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-1.5 overflow-hidden rounded-full bg-muted", className)}>
      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }} />
    </div>
  );
}
