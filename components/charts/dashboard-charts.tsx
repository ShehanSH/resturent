"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type {
  CategoryPerformance,
  HourlyPoint,
  ItemPerformance,
  StatusSlice,
  TrendPoint,
  TypeSlice,
} from "@/lib/services/analytics.service";

const COLORS = ["#7a1520", "#c4a35a", "#3a080c", "#a16207", "#b45309", "#9a1c2a"];

export function DashboardCharts({
  hourly,
  trend,
  categories,
  types,
  status,
  top,
}: {
  hourly: HourlyPoint[];
  trend: TrendPoint[];
  categories: CategoryPerformance[];
  types: TypeSlice[];
  status: StatusSlice[];
  top: ItemPerformance[];
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ChartCard title="Orders by hour" isEmpty={hourly.length === 0}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={hourly}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="orders" fill="#7a1520" radius={4} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Revenue trend" isEmpty={trend.length === 0}>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={trend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="revenue" stroke="#c4a35a" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Orders by category" isEmpty={categories.length === 0}>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={categories} dataKey="revenue" nameKey="category_name" innerRadius={50} outerRadius={80}>
              {categories.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Pickup vs delivery" isEmpty={types.length === 0}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={types}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="order_type" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="orders" fill="#7a1520" radius={4} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Status distribution" isEmpty={status.length === 0}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={status}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="status" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="orders" fill="#c4a35a" radius={4} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Top selling items" isEmpty={top.length === 0}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={top} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis type="category" dataKey="item_name" width={120} />
            <Tooltip />
            <Bar dataKey="quantity" fill="#7a1520" radius={4} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function ChartCard({
  title,
  children,
  isEmpty,
}: {
  title: string;
  children: React.ReactNode;
  isEmpty?: boolean;
}) {
  return (
    <section className="admin-card p-5">
      <h2 className="mb-4 text-base font-semibold tracking-tight">{title}</h2>
      {isEmpty ? <p className="text-muted-foreground py-10 text-center text-sm">No data in this range.</p> : children}
    </section>
  );
}
