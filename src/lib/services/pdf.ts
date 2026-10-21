import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type PDFImage } from "pdf-lib";
import { db } from "@/lib/db";
import { classPosition } from "@/lib/services/students";
import { attendanceRate } from "@/lib/services/attendance";
import { GRADE_SCALE } from "@/lib/grading";

const NAVY = rgb(2 / 255, 53 / 255, 164 / 255);
const NAVY_DEEP = rgb(2 / 255, 30 / 255, 102 / 255);
const SKY = rgb(126 / 255, 172 / 255, 235 / 255);
const SKY_SOFT = rgb(234 / 255, 242 / 255, 253 / 255);
const INK = rgb(15 / 255, 23 / 255, 42 / 255);
const GOLD = rgb(212 / 255, 161 / 255, 80 / 255);

/** pdf-lib's standard fonts only support WinAnsi; strip anything outside it. */
const safe = (s: string | null | undefined) => (s ?? "").replace(/[^\x20-\x7E]/g, "");

/** Standard PDF fonts cannot render the Naira sign, so use an ASCII prefix. */
const pdfNaira = (kobo: number) => `NGN ${(kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

async function loadLogo(doc: PDFDocument): Promise<PDFImage | null> {
  try {
    const bytes = await readFile(path.join(process.cwd(), "public", "logo.png"));
    return await doc.embedPng(bytes);
  } catch {
    return null;
  }
}

function letterhead(page: PDFPage, font: PDFFont, bold: PDFFont, logo: PDFImage | null, title: string) {
  const { width, height } = page.getSize();
  page.drawRectangle({ x: 0, y: height - 118, width, height: 118, color: NAVY_DEEP });
  page.drawRectangle({ x: 0, y: height - 122, width, height: 4, color: GOLD });
  if (logo) page.drawImage(logo, { x: 36, y: height - 104, width: 74, height: 73 });
  page.drawText("ANSAR RUHUL ISLAM", { x: 124, y: height - 50, size: 20, font: bold, color: rgb(1, 1, 1) });
  page.drawText("NURSERY, PRIMARY AND SECONDARY SCHOOL", { x: 124, y: height - 68, size: 9.5, font, color: SKY });
  page.drawText("Lagos, Nigeria  |  Knowledge is light", { x: 124, y: height - 84, size: 9, font, color: rgb(0.85, 0.9, 1) });
  page.drawText(title, { x: 124, y: height - 104, size: 11, font: bold, color: GOLD });
  return height - 144;
}

function drawTable(page: PDFPage, font: PDFFont, bold: PDFFont, y: number, headers: string[], widths: number[], rows: string[][]): number {
  const x0 = 40;
  let x = x0;
  page.drawRectangle({ x: x0, y: y - 4, width: widths.reduce((a, b) => a + b, 0), height: 18, color: NAVY });
  headers.forEach((h, i) => { page.drawText(h, { x: x + 6, y: y + 1, size: 9, font: bold, color: rgb(1, 1, 1) }); x += widths[i]; });
  y -= 18;
  rows.forEach((r, idx) => {
    if (idx % 2 === 0) page.drawRectangle({ x: x0, y: y - 4, width: widths.reduce((a, b) => a + b, 0), height: 18, color: SKY_SOFT });
    x = x0;
    r.forEach((cell, i) => { page.drawText(safe(cell), { x: x + 6, y: y + 1, size: 9, font, color: INK }); x += widths[i]; });
    y -= 18;
  });
  return y;
}

/** Report card for one student and one term. Only APPROVED or LOCKED scores are included. */
export async function reportCardPdf(studentId: string, termId: string): Promise<Uint8Array> {
  const [student, term] = await Promise.all([
    db.student.findUniqueOrThrow({ where: { id: studentId }, include: { class: true, section: true, guardians: { where: { isPrimary: true }, take: 1 } } }),
    db.term.findUniqueOrThrow({ where: { id: termId }, include: { session: true } }),
  ]);
  const scores = await db.score.findMany({
    where: { studentId, termId, status: { in: ["APPROVED", "LOCKED"] } },
    include: { subject: true },
    orderBy: { subject: { name: "asc" } },
  });
  const pos = await classPosition(studentId, termId);
  const att = await attendanceRate(studentId, termId);
  const avg = scores.length ? scores.reduce((s, x) => s + x.total, 0) / scores.length : 0;

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const logo = await loadLogo(doc);
  const page = doc.addPage([595.28, 841.89]);
  const { width } = page.getSize();

  let y = letterhead(page, font, bold, logo, "STUDENT REPORT CARD");

  const info: [string, string][] = [
    ["Student", `${student.firstName} ${student.lastName}`], ["Admission No.", student.admissionNo],
    ["Class", `${student.class.name} ${student.section.name}`], ["Session / Term", `${term.session.name}, ${term.name}`],
    ["Position", pos.position ? `${pos.position} of ${pos.outOf}` : "—"], ["Attendance", `${att.rate}% (${att.attended}/${att.total} days)`],
  ];
  info.forEach(([k, v], i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 40 + col * 270, yy = y - row * 20;
    page.drawText(`${k}:`, { x, y: yy, size: 9, font: bold, color: NAVY_DEEP });
    page.drawText(safe(v), { x: x + 88, y: yy, size: 9, font, color: INK });
  });
  y -= 3 * 20 + 16;

  y = drawTable(
    page, font, bold, y,
    ["Subject", "CA (40)", "Exam (60)", "Total (100)", "Grade", "Remark"],
    [185, 65, 70, 80, 60, 75],
    scores.map((s) => [s.subject.name, String(s.caScore), String(s.examScore), String(s.total), s.grade ?? "", s.remark ?? ""]),
  );
  if (scores.length === 0) page.drawText("No approved results for this term yet.", { x: 40, y: y - 16, size: 10, font, color: INK });

  y -= 26;
  page.drawText(`Overall average: ${avg.toFixed(1)}%`, { x: 40, y, size: 10, font: bold, color: NAVY_DEEP });
  // Grade key
  const keyY = y - 6;
  page.drawText("Grade key", { x: 40, y: keyY - 18, size: 9, font: bold, color: NAVY_DEEP });
  GRADE_SCALE.forEach((g, i) => {
    const x = 40 + i * 58;
    page.drawText(`${g.grade}: ${g.min}-${g.max}`, { x, y: keyY - 32, size: 7.5, font, color: INK });
  });

  // Remarks and signatures
  const remY = keyY - 90;
  page.drawRectangle({ x: 40, y: remY - 52, width: width - 80, height: 58, color: SKY_SOFT });
  page.drawText("Class teacher's remark", { x: 50, y: remY - 8, size: 9, font: bold, color: NAVY_DEEP });
  page.drawText(avg >= 70 ? "Excellent performance. Keep it up." : avg >= 50 ? "Good effort. Work harder on weaker subjects." : "Needs more consistency. Please see your teachers for support.", { x: 50, y: remY - 24, size: 9, font, color: INK });
  page.drawText("Principal's remark", { x: 50, y: remY - 40, size: 9, font: bold, color: NAVY_DEEP });

  const sigY = 120;
  ["Class Teacher", "Principal", "Parent / Guardian"].forEach((label, i) => {
    const x = 50 + i * 180;
    page.drawLine({ start: { x, y: sigY }, end: { x: x + 150, y: sigY }, thickness: 0.8, color: NAVY });
    page.drawText(label, { x, y: sigY - 14, size: 9, font: bold, color: NAVY_DEEP });
  });
  page.drawText(`Generated ${new Date().toLocaleDateString("en-NG")} · Official report card of Ansar Ruhul Islam School`, { x: 40, y: 40, size: 7.5, font, color: rgb(0.4, 0.45, 0.55) });
  return doc.save();
}

/** Branded payment receipt. */
export async function receiptPdf(paymentId: string): Promise<Uint8Array> {
  const p = await db.payment.findUniqueOrThrow({
    where: { id: paymentId },
    include: { invoice: { include: { term: { include: { session: true } }, student: true, lines: true } } },
  });
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const logo = await loadLogo(doc);
  const page = doc.addPage([595.28, 841.89]);
  const { width } = page.getSize();
  let y = letterhead(page, font, bold, logo, "PAYMENT RECEIPT");

  const rows: [string, string][] = [
    ["Receipt No.", p.receiptNo ?? "—"], ["Reference", p.gatewayRef], ["Date", (p.paidAt ?? p.createdAt).toLocaleDateString("en-NG")],
    ["Student", `${p.invoice.student.firstName} ${p.invoice.student.lastName} (${p.invoice.student.admissionNo})`],
    ["Term", `${p.invoice.term.session.name}, ${p.invoice.term.name}`], ["Invoice", p.invoice.invoiceNo], ["Method", p.method],
    ["Status", p.status],
  ];
  rows.forEach(([k, v], i) => {
    page.drawText(`${k}:`, { x: 40, y: y - i * 20, size: 10, font: bold, color: NAVY_DEEP });
    page.drawText(safe(v), { x: 150, y: y - i * 20, size: 10, font, color: INK });
  });
  y -= rows.length * 20 + 20;
  y = drawTable(page, font, bold, y, ["Invoice item", "Amount"], [400, 115], p.invoice.lines.map((l) => [l.description, pdfNaira(l.amountKobo)]));
  y -= 24;
  page.drawRectangle({ x: 40, y: y - 10, width: width - 80, height: 36, color: GOLD });
  page.drawText(`Amount paid: ${pdfNaira(p.amountKobo)}`, { x: 52, y: y + 1, size: 13, font: bold, color: NAVY_DEEP });
  page.drawText(`Invoice balance: ${pdfNaira(p.invoice.totalKobo - p.invoice.paidKobo)}`, { x: 300, y: y + 1, size: 10, font, color: NAVY_DEEP });
  page.drawText("Thank you. This receipt is computer generated.", { x: 40, y: 40, size: 8, font, color: rgb(0.4, 0.45, 0.55) });
  return doc.save();
}
