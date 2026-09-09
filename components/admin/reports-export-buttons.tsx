"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";

import { notify } from "@/lib/notify";
import { downloadBlob } from "@/lib/reports/download";
import { buildExcelWorkbook } from "@/lib/reports/excel";
import type { ReportDocument } from "@/lib/reports/model";

export function ReportsExportButtons({ report }: { report: ReportDocument }) {
  const [busy, setBusy] = useState<"pdf" | "excel" | null>(null);

  async function downloadPdf() {
    setBusy("pdf");
    try {
      const { downloadReportPdf } = await import("@/lib/reports/pdf");
      await downloadReportPdf(report);
    } catch {
      notify.error("Could not prepare the PDF report.");
    } finally {
      setBusy(null);
    }
  }

  function downloadExcel() {
    setBusy("excel");
    try {
      const xml = buildExcelWorkbook(report);
      const blob = new Blob([`\uFEFF${xml}`], { type: "application/vnd.ms-excel;charset=utf-8" });
      downloadBlob(blob, `${report.fileBase}.xls`);
    } catch {
      notify.error("Could not prepare the Excel report.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-muted-foreground mr-1 hidden items-center gap-1 text-xs font-medium sm:inline-flex">
        <Download className="size-3.5" aria-hidden />
        Export
      </span>
      <button
        type="button"
        className="btn-admin-outline h-9 px-3 text-sm"
        disabled={busy !== null}
        onClick={() => void downloadPdf()}
      >
        <FileText className="size-4" aria-hidden />
        {busy === "pdf" ? "Preparing…" : "PDF"}
      </button>
      <button
        type="button"
        className="btn-admin h-9 px-3 text-sm"
        disabled={busy !== null}
        onClick={downloadExcel}
      >
        <FileSpreadsheet className="size-4" aria-hidden />
        {busy === "excel" ? "Preparing…" : "Excel"}
      </button>
    </div>
  );
}
