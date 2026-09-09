import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { formatMoney, formatNumber } from "@/lib/format";
import { downloadBlob } from "@/lib/reports/download";
import { statusLabel, typeLabel, type ReportDocument } from "@/lib/reports/model";

const BRAND = "#7A1520";
const MUTED = "#6B6560";

function lastTableY(doc: jsPDF): number {
  return (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 0;
}

export async function downloadReportPdf(report: ReportDocument): Promise<void> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = 46;

  doc.setFillColor(122, 21, 32);
  doc.rect(0, 0, pageWidth, 8, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(BRAND);
  doc.text(report.restaurantName, margin, y);

  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(MUTED);
  doc.text(`Sales report · ${report.rangeLabel}`, margin, y);

  y += 16;
  doc.setFontSize(9);
  doc.text(`${report.periodLabel}  ·  Generated ${report.generatedAt}`, margin, y);

  y += 22;
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Overview", "Value"]],
    body: [
      ["Orders", formatNumber(report.summary.total_orders, report.currency.locale)],
      ["Revenue", formatMoney(report.summary.revenue, report.currency)],
      ["Items sold", formatNumber(report.summary.items_sold, report.currency.locale)],
      ["Average order", formatMoney(report.summary.average_order_value, report.currency)],
      ["Pickup / delivery", `${report.summary.pickup_orders} / ${report.summary.delivery_orders}`],
      ["Completed", formatNumber(report.summary.completed_orders, report.currency.locale)],
      ["Cancelled", formatNumber(report.summary.cancelled_orders, report.currency.locale)],
      ["Uncollected payments", formatNumber(report.summary.uncollected_payments, report.currency.locale)],
    ],
    styles: { font: "helvetica", fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: [122, 21, 32], textColor: 255, fontStyle: "bold" },
    columnStyles: { 1: { halign: "right" } },
  });

  const afterOverview = lastTableY(doc) || y + 80;

  autoTable(doc, {
    startY: afterOverview + 22,
    margin: { left: margin, right: margin },
    head: [["#", "Category", "Items", "Revenue", "Share"]],
    body:
      report.categories.length === 0
        ? [["—", "No category sales in this range", "—", "—", "—"]]
        : report.categories.map((row, index) => [
            String(index + 1),
            row.name,
            formatNumber(row.quantity, report.currency.locale),
            formatMoney(row.revenue, report.currency),
            `${row.share}%`,
          ]),
    styles: { font: "helvetica", fontSize: 9, cellPadding: 5 },
    headStyles: { fillColor: [122, 21, 32], textColor: 255, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 28 },
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
    },
  });

  const afterCategories = lastTableY(doc) || afterOverview;

  autoTable(doc, {
    startY: afterCategories + 22,
    margin: { left: margin, right: margin },
    head: [["#", "Item", "Qty", "Revenue", "Avg", "Share"]],
    body:
      report.items.length === 0
        ? [["—", "No item sales in this range", "—", "—", "—", "—"]]
        : report.items.map((row, index) => [
            String(index + 1),
            row.name,
            formatNumber(row.quantity, report.currency.locale),
            formatMoney(row.revenue, report.currency),
            formatMoney(row.average, report.currency),
            `${row.share}%`,
          ]),
    styles: { font: "helvetica", fontSize: 8.5, cellPadding: 5 },
    headStyles: { fillColor: [122, 21, 32], textColor: 255, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 24 },
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
      5: { halign: "right" },
    },
  });

  const afterItems = lastTableY(doc) || afterCategories;

  autoTable(doc, {
    startY: afterItems + 22,
    margin: { left: margin, right: margin },
    head: [["Order type", "Orders", "Revenue"]],
    body:
      report.types.length === 0
        ? [["No orders in this range", "—", "—"]]
        : report.types.map((row) => [
            typeLabel(row.order_type),
            formatNumber(row.orders, report.currency.locale),
            formatMoney(row.revenue, report.currency),
          ]),
    styles: { font: "helvetica", fontSize: 9, cellPadding: 5 },
    headStyles: { fillColor: [196, 163, 90], textColor: [58, 8, 12], fontStyle: "bold" },
    columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } },
  });

  const afterTypes = lastTableY(doc) || afterItems;

  autoTable(doc, {
    startY: afterTypes + 22,
    margin: { left: margin, right: margin },
    head: [["Status", "Orders"]],
    body:
      report.status.length === 0
        ? [["No orders in this range", "—"]]
        : report.status.map((row) => [
            statusLabel(row.status),
            formatNumber(row.orders, report.currency.locale),
          ]),
    styles: { font: "helvetica", fontSize: 9, cellPadding: 5 },
    headStyles: { fillColor: [196, 163, 90], textColor: [58, 8, 12], fontStyle: "bold" },
    columnStyles: { 1: { halign: "right" } },
  });

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFontSize(8);
    doc.setTextColor(MUTED);
    doc.text(
      `${report.restaurantName} · confidential staff report · ${page}/${pageCount}`,
      margin,
      doc.internal.pageSize.getHeight() - 24,
    );
  }

  downloadBlob(doc.output("blob"), `${report.fileBase}.pdf`);
}
