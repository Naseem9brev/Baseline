import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { REPORT_DISCLAIMER } from './clinicalReferences';
import {
  buildDailyRow,
  DAILY_TABLE_HEAD,
  formatDate,
  groupRecordsByMonth,
  monthStatusLabel,
  summarizeMonth,
} from './exportTemplate';
import { buildReportSummary } from './reportMetrics';
import { dateKey, getRecords } from './storage';

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 14;
const FOOTER_Y = PAGE_H - 10;

/** NHS-style greys — minimal colour, form-like appearance */
const INK = [33, 33, 33] as [number, number, number];
const MUTED = [82, 82, 82] as [number, number, number];
const BORDER = [180, 180, 180] as [number, number, number];
const FLAG_FILL = [255, 237, 213] as [number, number, number];
const REVIEW_FILL = [254, 249, 195] as [number, number, number];
const ROW_ALT = [250, 250, 250] as [number, number, number];

export interface ExportPdfOptions {
  patientLabel?: string;
  dateOfBirth?: string;
}

/** NHS-style home monitoring record for GP appointments. */
export async function exportPdf(options: ExportPdfOptions = {}): Promise<void> {
  const records = await getRecords();
  const patientLabel = options.patientLabel?.trim() || '';
  const dateOfBirth = options.dateOfBirth?.trim() || '';
  const summary = buildReportSummary(records, patientLabel || 'Not recorded');
  const months = groupRecordsByMonth(summary.records);
  const monthSummaries = months.map(summarizeMonth);

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  drawFormHeader(doc, summary, patientLabel, dateOfBirth);
  drawLegend(doc);
  drawMonthlySummary(doc, monthSummaries);

  for (const bucket of months) {
    const monthSummary = summarizeMonth(bucket);
    drawMonthDailyTable(doc, bucket, monthSummary);
  }

  if (months.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    doc.text('No check-ins recorded yet.', MARGIN, 120);
  }

  addFooters(doc, patientLabel || 'Patient');

  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  try {
    await chrome.downloads.download({
      url,
      filename: `baseline-monitoring-record-${dateKey()}.pdf`,
      saveAs: true,
    });
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
}

function drawFormHeader(
  doc: jsPDF,
  summary: ReturnType<typeof buildReportSummary>,
  patientName: string,
  dateOfBirth: string,
): void {
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.rect(MARGIN, MARGIN, PAGE_W - MARGIN * 2, 38);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...INK);
  doc.text('BASELINE HOME MONITORING RECORD', MARGIN + 4, MARGIN + 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text('For general practice — please bring to your appointment', MARGIN + 4, MARGIN + 14);

  const row1 = MARGIN + 22;
  const row2 = MARGIN + 30;
  const col2 = PAGE_W / 2 + 2;

  labelValue(doc, 'Patient name:', patientName || '________________________', MARGIN + 4, row1);
  labelValue(doc, 'NHS number:', '________________', col2, row1);
  labelValue(doc, 'Date of birth:', dateOfBirth || '__ / __ / ____', MARGIN + 4, row2);

  const reportDate = new Date(summary.exportedAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  labelValue(doc, 'Report date:', reportDate, col2, row2);

  const period =
    summary.dateRange != null
      ? `${formatDate(summary.dateRange.from)} to ${formatDate(summary.dateRange.to)}`
      : 'No data';
  doc.setFontSize(7.5);
  doc.text(`Monitoring period: ${period}  ·  Check-ins: ${summary.sessionCount}`, MARGIN + 4, MARGIN + 35);
}

function drawLegend(doc: jsPDF): void {
  const y = MARGIN + 44;
  doc.setDrawColor(...BORDER);
  doc.rect(MARGIN, y, PAGE_W - MARGIN * 2, 22);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...INK);
  doc.text('How to read this record', MARGIN + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  const lines = [
    'Code (last column): S = Stable (within expected range)   M = Monitor (slightly outside range)   F = Discuss with GP (outside expected range)',
    'HR = heart rate (bpm) · Blink = blinks/min · Jit/Shm/HNR/MPT = voice · Tap/Ch = reaction time (ms) · Mem = memory sequence · WPM = typing speed',
    'Daily home check-in (eye, voice, reaction). For trend review only — not a diagnostic test.',
  ];
  let ly = y + 11;
  for (const line of lines) {
    doc.text(line, MARGIN + 4, ly);
    ly += 3.8;
  }
}

function drawMonthlySummary(
  doc: jsPDF,
  summaries: ReturnType<typeof summarizeMonth>[],
): void {
  const startY = MARGIN + 70;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...INK);
  doc.text('Monthly summary', MARGIN, startY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  doc.text('Months marked REVIEW or DISCUSS need attention at your appointment.', MARGIN, startY + 4);

  if (summaries.length === 0) return;

  autoTable(doc, {
    startY: startY + 7,
    margin: { left: MARGIN, right: MARGIN },
    theme: 'grid',
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: INK,
      fontSize: 7.5,
      fontStyle: 'bold',
      lineColor: BORDER,
      lineWidth: 0.2,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: INK,
      lineColor: BORDER,
      lineWidth: 0.2,
    },
    alternateRowStyles: { fillColor: ROW_ALT },
    head: [['Month', 'Check-ins', 'Stable (S)', 'Monitor (M)', 'Flag (F)', 'Month review', 'Note']],
    body: summaries.map((m) => [
      m.label,
      m.daysRecorded,
      m.stableDays,
      m.monitorDays,
      m.flagDays,
      monthStatusLabel(m.monthStatus),
      m.note,
    ]),
    didParseCell: (data) => {
      if (data.section !== 'body' || data.column.index !== 5) return;
      const status = summaries[data.row.index]?.monthStatus;
      if (status === 'DISCUSS') {
        data.cell.styles.fillColor = FLAG_FILL;
        data.cell.styles.fontStyle = 'bold';
      } else if (status === 'REVIEW') {
        data.cell.styles.fillColor = REVIEW_FILL;
      }
    },
  });
}

function drawMonthDailyTable(
  doc: jsPDF,
  bucket: ReturnType<typeof groupRecordsByMonth>[number],
  monthSummary: ReturnType<typeof summarizeMonth>,
): void {
  const prevY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY;
  let startY = (prevY ?? MARGIN + 95) + 8;

  if (startY > PAGE_H - 30) {
    doc.addPage();
    startY = MARGIN + 8;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...INK);
  doc.text(bucket.label, MARGIN, startY);

  if (monthSummary.monthStatus !== 'NORMAL') {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(
      monthSummary.monthStatus === 'DISCUSS' ? 180 : 140,
      monthSummary.monthStatus === 'DISCUSS' ? 83 : 100,
      9,
    );
    doc.text(
      `  ·  ${monthStatusLabel(monthSummary.monthStatus)}`,
      MARGIN + doc.getTextWidth(bucket.label) + 1,
      startY,
    );
  }

  autoTable(doc, {
    startY: startY + 4,
    margin: { left: MARGIN, right: MARGIN },
    theme: 'grid',
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: INK,
      fontSize: 6.5,
      fontStyle: 'bold',
      lineColor: BORDER,
      lineWidth: 0.15,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 6.5,
      textColor: INK,
      lineColor: BORDER,
      lineWidth: 0.15,
      halign: 'center',
      cellPadding: 1.2,
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 16 },
      11: { fontStyle: 'bold', cellWidth: 10 },
    },
    alternateRowStyles: { fillColor: ROW_ALT },
    head: [[...DAILY_TABLE_HEAD]],
    body: bucket.records.map((r) => buildDailyRow(r)),
    didParseCell: (data) => {
      if (data.section !== 'body' || data.column.index !== 11) return;
      const code = data.cell.raw;
      if (code === 'F') {
        data.cell.styles.fillColor = FLAG_FILL;
        data.cell.styles.textColor = [154, 52, 18];
      } else if (code === 'M') {
        data.cell.styles.fillColor = REVIEW_FILL;
        data.cell.styles.textColor = [120, 80, 0];
      } else if (code === 'S') {
        data.cell.styles.textColor = [22, 101, 52];
      }
    },
  });
}

function labelValue(
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
): void {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(label, x, y);
  doc.setTextColor(...INK);
  doc.text(` ${value}`, x + doc.getTextWidth(label), y);
}

function addFooters(doc: jsPDF, patientLabel: string): void {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, FOOTER_Y - 4, PAGE_W - MARGIN, FOOTER_Y - 4);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...MUTED);
    doc.text(REPORT_DISCLAIMER, MARGIN, FOOTER_Y);
    doc.text(`Page ${i} of ${pages}`, PAGE_W - MARGIN, FOOTER_Y, { align: 'right' });
    if (patientLabel && patientLabel !== 'Not recorded') {
      doc.text(patientLabel, PAGE_W / 2, FOOTER_Y, { align: 'center' });
    }
  }
}

export { exportJson } from './exportJson';
