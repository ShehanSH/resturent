"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatMoney, formatNumber, type CurrencyConfig } from "@/lib/format";
import {
  MENU_CHART_COLORS,
  ORDER_STATUS_CHART_COLORS,
  ORDER_STATUS_LABELS,
  ORDER_TYPE_CHART_COLORS,
  ORDER_TYPE_LABELS,
} from "@/lib/constants";
import type {
  CategoryPerformance,
  HourlyPoint,
  ItemPerformance,
  StatusSlice,
  TrendPoint,
  TypeSlice,
} from "@/lib/services/analytics.types";
import { cn } from "@/lib/utils";

const GRID = "#e8e2dc";
const TICK = "#6b6560";

function chartDay(day: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(day);
  if (!match) return day;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${Number(match[3])} ${months[Number(match[2]) - 1]!}`;
}

function tooltipBox(label: string, rows: { name: string; value: string; color?: string }[]) {
  return (
    <div className="rounded-lg border border-border/80 bg-white px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium text-foreground">{label}</p>
      {rows.map((row) => (
        <p key={row.name} className="flex items-center gap-2 text-muted-foreground">
          {row.color ? (
            <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: row.color }} />
          ) : null}
          <span>
            {row.name}: <span className="font-medium text-foreground">{row.value}</span>
          </span>
        </p>
      ))}
    </div>
  );
}

export function DashboardCharts({
  hourly,
  trend,
  categories,
  types,
  status,
  top,
  currency,
}: {
  hourly: HourlyPoint[];
  trend: TrendPoint[];
  categories: CategoryPerformance[];
  types: TypeSlice[];
  status: StatusSlice[];
  top: ItemPerformance[];
  currency: CurrencyConfig;
}) {
  const hourlyData = hourly.map((row) => ({ ...row, label: `${row.hour}:00` }));
  const trendData = trend.map((row) => ({ ...row, label: chartDay(row.day) }));
  const typeData = types.map((row) => ({
    ...row,
    label: ORDER_TYPE_LABELS[row.order_type],
    fill: ORDER_TYPE_CHART_COLORS[row.order_type],
  }));
  const statusData = status.map((row) => ({
    ...row,
    label: ORDER_STATUS_LABELS[row.status],
    fill: ORDER_STATUS_CHART_COLORS[row.status],
  }));
  const categoryData = categories.map((row, index) => ({
    ...row,
    fill: MENU_CHART_COLORS[index % MENU_CHART_COLORS.length],
  }));
  const maxItemQty = top.reduce((max, row) => Math.max(max, row.quantity), 0);

  return (
    <div className="space-y-8">
      <ChartSection title="Sales" description="When orders came in and how revenue moved.">
        <div className="grid gap-4 xl:grid-cols-5">
          <ChartCard
            className="xl:col-span-3"
            title="Orders by hour"
            description="Kitchen load across the day."
            isEmpty={hourlyData.length === 0}
          >
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: TICK }} tickLine={false} axisLine={false} />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: TICK }}
                    tickLine={false}
                    axisLine={false}
                    width={32}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(122, 21, 32, 0.06)" }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return tooltipBox(String(label), [
                        { name: "Orders", value: formatNumber(Number(payload[0]?.value ?? 0), currency.locale) },
                      ]);
                    }}
                  />
                  <Bar dataKey="orders" fill="#7a1520" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
          <ChartCard
            className="xl:col-span-2"
            title="Pickup vs delivery"
            description="How customers received orders."
            isEmpty={typeData.length === 0}
          >
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: TICK }} tickLine={false} axisLine={false} />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: TICK }}
                    tickLine={false}
                    axisLine={false}
                    width={32}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(122, 21, 32, 0.06)" }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.[0]) return null;
                      const row = payload[0].payload as (typeof typeData)[number];
                      return tooltipBox(String(label), [
                        { name: "Orders", value: formatNumber(row.orders, currency.locale), color: row.fill },
                        { name: "Revenue", value: formatMoney(row.revenue, currency) },
                      ]);
                    }}
                  />
                  <Bar dataKey="orders" radius={[6, 6, 0, 0]} maxBarSize={64}>
                    {typeData.map((row) => (
                      <Cell key={row.order_type} fill={row.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {typeData.length > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-3 text-xs">
                {typeData.map((row) => (
                  <li key={row.order_type} className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: row.fill }} />
                    {row.label}
                  </li>
                ))}
              </ul>
            ) : null}
          </ChartCard>
        </div>
        <ChartCard title="Revenue trend" description="Daily sales in this period." isEmpty={trendData.length === 0}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: TICK }} tickLine={false} axisLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: TICK }}
                  tickLine={false}
                  axisLine={false}
                  width={56}
                  tickFormatter={(value: number) => formatNumber(value, currency.locale)}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.[0]) return null;
                    const row = payload[0].payload as (typeof trendData)[number];
                    return tooltipBox(String(label), [
                      { name: "Revenue", value: formatMoney(row.revenue, currency) },
                      { name: "Orders", value: formatNumber(row.orders, currency.locale) },
                    ]);
                  }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#c4a35a" strokeWidth={2.25} dot={{ r: 3, fill: "#7a1520" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </ChartSection>

      <ChartSection title="Fulfilment" description="Where each order stands right now.">
        <div className="grid gap-4 xl:grid-cols-5">
          <ChartCard
            className="xl:col-span-3"
            title="Status distribution"
            description="Each status has its own colour."
            isEmpty={statusData.length === 0}
          >
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={statusData}
                  layout="vertical"
                  margin={{ top: 8, right: 16, left: 4, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: TICK }} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={118}
                    tick={{ fontSize: 12, fill: "#3a080c" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(122, 21, 32, 0.06)" }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.[0]) return null;
                      const row = payload[0].payload as (typeof statusData)[number];
                      return tooltipBox(String(label), [
                        { name: "Orders", value: formatNumber(row.orders, currency.locale), color: row.fill },
                      ]);
                    }}
                  />
                  <Bar dataKey="orders" radius={[0, 6, 6, 0]} barSize={18} maxBarSize={22}>
                    {statusData.map((row) => (
                      <Cell key={row.status} fill={row.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {statusData.length > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs">
                {statusData.map((row) => (
                  <li key={row.status} className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: row.fill }} />
                    {row.label}
                    <span className="tabular-nums text-foreground">{row.orders}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </ChartCard>
          <ChartCard
            className="xl:col-span-2"
            title="Orders by category"
            description="Share of revenue by menu group."
            isEmpty={categoryData.length === 0}
          >
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="revenue"
                    nameKey="category_name"
                    innerRadius={48}
                    outerRadius={78}
                    paddingAngle={2}
                    stroke="#fff"
                    strokeWidth={2}
                  >
                    {categoryData.map((row) => (
                      <Cell key={row.category_name} fill={row.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.[0]) return null;
                      const row = payload[0].payload as (typeof categoryData)[number];
                      return tooltipBox(row.category_name, [
                        { name: "Revenue", value: formatMoney(row.revenue, currency), color: row.fill },
                        { name: "Items", value: formatNumber(row.quantity, currency.locale) },
                      ]);
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-1 space-y-1.5">
              {categoryData.map((row) => (
                <li key={row.category_name} className="flex items-center justify-between gap-3 text-sm">
                  <span className="inline-flex min-w-0 items-center gap-2">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: row.fill }} />
                    <span className="truncate">{row.category_name}</span>
                  </span>
                  <span className="text-muted-foreground shrink-0 tabular-nums">{formatMoney(row.revenue, currency)}</span>
                </li>
              ))}
            </ul>
          </ChartCard>
        </div>
      </ChartSection>

      <ChartSection title="Menu" description="What customers ordered most.">
        <ChartCard title="Top selling items" description="Ranked by quantity sold. Full names stay visible." isEmpty={top.length === 0}>
          <ol className="space-y-3">
            {top.map((row, index) => {
              const color = MENU_CHART_COLORS[index % MENU_CHART_COLORS.length];
              const width = maxItemQty > 0 ? Math.round((row.quantity / maxItemQty) * 100) : 0;
              return (
                <li key={row.item_name} className="grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-3">
                  <span className="text-muted-foreground text-xs tabular-nums">{index + 1}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium break-words text-foreground">{row.item_name}</p>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${width}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium tabular-nums">{formatNumber(row.quantity, currency.locale)}</p>
                    <p className="text-muted-foreground text-xs tabular-nums">{formatMoney(row.revenue, currency)}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </ChartCard>
      </ChartSection>
    </div>
  );
}

function ChartSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold tracking-wide text-foreground uppercase">{title}</h2>
        <p className="text-muted-foreground mt-0.5 text-sm">{description}</p>
      </div>
      {children}
    </section>
  );
}

function ChartCard({
  title,
  description,
  children,
  isEmpty,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  isEmpty?: boolean;
  className?: string;
}) {
  return (
    <section className={cn("admin-card p-5", className)}>
      <div className="mb-4">
        <h3 className="text-base font-semibold tracking-tight">{title}</h3>
        {description ? <p className="text-muted-foreground mt-0.5 text-sm">{description}</p> : null}
      </div>
      {isEmpty ? <p className="text-muted-foreground py-12 text-center text-sm">No data in this range.</p> : children}
    </section>
  );
}
