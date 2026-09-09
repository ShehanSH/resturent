"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatMoney, formatNumber } from "@/lib/format";
import type { ReportDocument } from "@/lib/reports/model";

function chartDay(day: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(day);
  if (!match) return day;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${Number(match[3])} ${months[Number(match[2]) - 1]!}`;
}

export function ReportsCharts({ report }: { report: ReportDocument }) {
  const trend = report.trend.map((point) => ({
    ...point,
    label: chartDay(point.day),
  }));
  const categories = report.categories.slice(0, 8).map((row) => ({
    name: row.name,
    revenue: row.revenue,
    share: row.share,
  }));

  return (
    <div className="grid gap-4 xl:grid-cols-5">
      <section className="admin-card p-5 xl:col-span-3">
        <div className="mb-4">
          <h2 className="text-base font-semibold tracking-tight">Revenue trend</h2>
          <p className="text-muted-foreground mt-0.5 text-sm">Daily paid sales in this period.</p>
        </div>
        {trend.length === 0 ? (
          <p className="text-muted-foreground py-16 text-center text-sm">No daily sales in this range.</p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8e2dc" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6b6560" }} tickLine={false} axisLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: "#6b6560" }}
                  tickLine={false}
                  axisLine={false}
                  width={56}
                  tickFormatter={(value: number) => formatNumber(value, report.currency.locale)}
                />
                <Tooltip
                  formatter={(value) => formatMoney(Number(value ?? 0), report.currency)}
                  labelFormatter={(label) => String(label)}
                />
                <Line type="monotone" dataKey="revenue" stroke="#7a1520" strokeWidth={2.25} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
      <section className="admin-card p-5 xl:col-span-2">
        <div className="mb-4">
          <h2 className="text-base font-semibold tracking-tight">Category share</h2>
          <p className="text-muted-foreground mt-0.5 text-sm">Revenue contribution by menu group.</p>
        </div>
        {categories.length === 0 ? (
          <p className="text-muted-foreground py-16 text-center text-sm">No category sales in this range.</p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categories} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8e2dc" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={92}
                  tick={{ fontSize: 11, fill: "#3a080c" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value) => formatMoney(Number(value ?? 0), report.currency)}
                  labelFormatter={(label) => String(label)}
                />
                <Bar dataKey="revenue" fill="#7a1520" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </div>
  );
}
