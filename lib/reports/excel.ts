import { formatMoney, formatNumber } from "@/lib/format";
import { statusLabel, typeLabel, type RankedRow, type ReportDocument } from "@/lib/reports/model";

function xmlEscape(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function sheetName(value: string): string {
  return value.replace(/[:\\/?*[\]]/g, " ").slice(0, 31);
}

function stringCell(value: string, style?: string): string {
  const styleAttr = style ? ` ss:StyleID="${style}"` : "";
  return `<Cell${styleAttr}><Data ss:Type="String">${xmlEscape(value)}</Data></Cell>`;
}

function numberCell(value: number, style?: string): string {
  const styleAttr = style ? ` ss:StyleID="${style}"` : "";
  const safe = Number.isFinite(value) ? value : 0;
  return `<Cell${styleAttr}><Data ss:Type="Number">${safe}</Data></Cell>`;
}

function row(cells: string[]): string {
  return `<Row>${cells.join("")}</Row>`;
}

function worksheet(name: string, rows: string[]): string {
  return `<Worksheet ss:Name="${xmlEscape(sheetName(name))}"><Table>${rows.join("")}</Table></Worksheet>`;
}

function rankedRows(rows: RankedRow[]): string[] {
  return [
    row([
      stringCell("#", "header"),
      stringCell("Name", "header"),
      stringCell("Quantity", "header"),
      stringCell("Revenue", "header"),
      stringCell("Average", "header"),
      stringCell("Share %", "header"),
    ]),
    ...rows.map((item, index) =>
      row([
        numberCell(index + 1),
        stringCell(item.name),
        numberCell(item.quantity),
        numberCell(item.revenue, "money"),
        numberCell(item.average, "money"),
        numberCell(item.share),
      ]),
    ),
  ];
}

export function buildExcelWorkbook(report: ReportDocument): string {
  const { summary, currency } = report;

  const summarySheet = worksheet("Summary", [
    row([stringCell("Restaurant", "header"), stringCell(report.restaurantName)]),
    row([stringCell("Period", "header"), stringCell(report.rangeLabel)]),
    row([stringCell("Dates", "header"), stringCell(report.periodLabel)]),
    row([stringCell("Generated", "header"), stringCell(report.generatedAt)]),
    row([stringCell("Timezone", "header"), stringCell(report.timezone)]),
    row([]),
    row([stringCell("Metric", "header"), stringCell("Value", "header")]),
    row([stringCell("Orders"), numberCell(summary.total_orders)]),
    row([stringCell("Revenue"), numberCell(summary.revenue, "money")]),
    row([stringCell("Items sold"), numberCell(summary.items_sold)]),
    row([stringCell("Average order"), numberCell(summary.average_order_value, "money")]),
    row([stringCell("Pickup orders"), numberCell(summary.pickup_orders)]),
    row([stringCell("Delivery orders"), numberCell(summary.delivery_orders)]),
    row([stringCell("Completed"), numberCell(summary.completed_orders)]),
    row([stringCell("Cancelled"), numberCell(summary.cancelled_orders)]),
    row([stringCell("Pending"), numberCell(summary.pending_orders)]),
    row([stringCell("Uncollected payments"), numberCell(summary.uncollected_payments)]),
    row([]),
    row([
      stringCell("Currency note", "header"),
      stringCell(`${currency.currency_symbol} amounts are numeric so Excel can total them.`),
    ]),
    row([
      stringCell("Revenue (formatted)"),
      stringCell(formatMoney(summary.revenue, currency)),
    ]),
    row([
      stringCell("Orders (formatted)"),
      stringCell(formatNumber(summary.total_orders, currency.locale)),
    ]),
  ]);

  const trendSheet = worksheet("Daily trend", [
    row([
      stringCell("Date", "header"),
      stringCell("Orders", "header"),
      stringCell("Revenue", "header"),
    ]),
    ...report.trend.map((point) =>
      row([stringCell(point.day), numberCell(point.orders), numberCell(point.revenue, "money")]),
    ),
  ]);

  const typeSheet = worksheet("Order types", [
    row([
      stringCell("Type", "header"),
      stringCell("Orders", "header"),
      stringCell("Revenue", "header"),
    ]),
    ...report.types.map((item) =>
      row([
        stringCell(typeLabel(item.order_type)),
        numberCell(item.orders),
        numberCell(item.revenue, "money"),
      ]),
    ),
  ]);

  const statusSheet = worksheet("Status", [
    row([stringCell("Status", "header"), stringCell("Orders", "header")]),
    ...report.status.map((item) =>
      row([stringCell(statusLabel(item.status)), numberCell(item.orders)]),
    ),
  ]);

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Styles>
 <Style ss:ID="header"><Font ss:Bold="1"/></Style>
 <Style ss:ID="money"><NumberFormat ss:Format="#,##0.00"/></Style>
</Styles>
${summarySheet}
${trendSheet}
${worksheet("Categories", rankedRows(report.categories))}
${worksheet("Items", rankedRows(report.items))}
${typeSheet}
${statusSheet}
</Workbook>`;
}
