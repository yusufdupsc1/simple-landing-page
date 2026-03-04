import sharp from "sharp";
import type { RecordPeriodType, StudentRecordType } from "@prisma/client";

interface SubjectRow {
  name: string;
  score: number;
  maxScore: number;
}

interface SignatoryFields {
  signatoryName?: string | null;
  signatoryTitle?: string | null;
  coSignatoryName?: string | null;
  coSignatoryTitle?: string | null;
  certificateFooter?: string | null;
}

interface LogoImage {
  bytes: Buffer;
  width: number;
  height: number;
}

export interface StudentRecordPdfContext {
  template: StudentRecordType;
  periodType: RecordPeriodType;
  periodLabel: string;
  institutionName: string;
  institutionAddress?: string | null;
  institutionLogoUrl?: string | null;
  student: {
    id: string;
    studentId: string;
    firstName: string;
    lastName: string;
    className?: string | null;
  };
  subjects: SubjectRow[];
  attendance: {
    present: number;
    absent: number;
    late: number;
  };
  generatedAt: Date;
  signatory: SignatoryFields;
}

interface DocumentSpec {
  pageWidth: number;
  pageHeight: number;
  ops: string[];
}

const CERTIFICATE_TEMPLATES = new Set<StudentRecordType>([
  "FINAL_EXAM_CERTIFICATE",
  "CHARACTER_CERTIFICATE",
  "EXTRA_SKILLS_CERTIFICATE",
  "TRANSFER_CERTIFICATE",
]);

const REPORT_TEMPLATES = new Set<StudentRecordType>([
  "RESULT_SHEET",
  "ATTENDANCE_RECORD",
  "BEHAVIOR_TRACKING",
  "WEEKLY_PROGRESS",
  "MONTHLY_PROGRESS",
  "QUARTERLY_PROGRESS",
  "ANNUAL_FINAL_REPORT",
]);

function escapePdfText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function hexToRgb(hex: string): [number, number, number] {
  const cleaned = hex.replace("#", "");
  const full =
    cleaned.length === 3
      ? `${cleaned[0]}${cleaned[0]}${cleaned[1]}${cleaned[1]}${cleaned[2]}${cleaned[2]}`
      : cleaned;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  return [r, g, b];
}

function fmt(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function fillRect(
  ops: string[],
  x: number,
  y: number,
  w: number,
  h: number,
  hex: string,
) {
  const [r, g, b] = hexToRgb(hex);
  ops.push(`${fmt(r)} ${fmt(g)} ${fmt(b)} rg`);
  ops.push(`${fmt(x)} ${fmt(y)} ${fmt(w)} ${fmt(h)} re f`);
}

function strokeRect(
  ops: string[],
  x: number,
  y: number,
  w: number,
  h: number,
  hex: string,
  lineWidth = 1,
) {
  const [r, g, b] = hexToRgb(hex);
  ops.push(`${fmt(r)} ${fmt(g)} ${fmt(b)} RG`);
  ops.push(`${fmt(lineWidth)} w`);
  ops.push(`${fmt(x)} ${fmt(y)} ${fmt(w)} ${fmt(h)} re S`);
}

function drawLine(
  ops: string[],
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  hex: string,
  lineWidth = 1,
) {
  const [r, g, b] = hexToRgb(hex);
  ops.push(`${fmt(r)} ${fmt(g)} ${fmt(b)} RG`);
  ops.push(`${fmt(lineWidth)} w`);
  ops.push(`${fmt(x1)} ${fmt(y1)} m ${fmt(x2)} ${fmt(y2)} l S`);
}

function drawText(
  ops: string[],
  text: string,
  x: number,
  y: number,
  size = 12,
  font: "F1" | "F2" = "F1",
  hex = "#0f172a",
) {
  const [r, g, b] = hexToRgb(hex);
  ops.push("BT");
  ops.push(`/${font} ${fmt(size)} Tf`);
  ops.push(`${fmt(r)} ${fmt(g)} ${fmt(b)} rg`);
  ops.push(`${fmt(x)} ${fmt(y)} Td`);
  ops.push(`(${escapePdfText(text)}) Tj`);
  ops.push("ET");
}

function textWidthApprox(text: string, size: number) {
  return text.length * size * 0.52;
}

function drawCenteredText(
  ops: string[],
  text: string,
  pageWidth: number,
  y: number,
  size = 12,
  font: "F1" | "F2" = "F1",
  hex = "#0f172a",
) {
  const width = textWidthApprox(text, size);
  const x = Math.max(20, (pageWidth - width) / 2);
  drawText(ops, text, x, y, size, font, hex);
}

function safeToken(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function titleForTemplate(template: StudentRecordType) {
  const labels: Record<StudentRecordType, string> = {
    ID_CARD: "ID Card",
    RESULT_SHEET: "Result Sheet Report",
    ATTENDANCE_RECORD: "Attendance Record",
    BEHAVIOR_TRACKING: "Behavior Tracking Report",
    FINAL_EXAM_CERTIFICATE: "Final Exam Certificate",
    CHARACTER_CERTIFICATE: "Character Certificate",
    EXTRA_SKILLS_CERTIFICATE: "Extra Skills Certificate",
    TRANSFER_CERTIFICATE: "Transfer Certificate",
    WEEKLY_PROGRESS: "Weekly Progress Record",
    MONTHLY_PROGRESS: "Monthly Progress Record",
    QUARTERLY_PROGRESS: "Quarterly Progress Record",
    ANNUAL_FINAL_REPORT: "Annual Final Progress Report",
  };
  return labels[template];
}

function periodLabelValue(periodType: RecordPeriodType, provided: string) {
  if (provided.trim()) return provided.trim();

  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");

  if (periodType === "WEEKLY") return `Week ${yyyy}-${mm}-${dd}`;
  if (periodType === "MONTHLY") return `Month ${yyyy}-${mm}`;
  if (periodType === "QUARTERLY")
    return `Quarter ${yyyy} Q${Math.ceil((now.getUTCMonth() + 1) / 3)}`;
  if (periodType === "ANNUAL") return `Annual ${yyyy}`;
  return `Custom ${yyyy}-${mm}-${dd}`;
}

function fitInside(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number,
) {
  const scale = Math.min(maxWidth / width, maxHeight / height, 1);
  return {
    width: width * scale,
    height: height * scale,
  };
}

function drawImage(
  ops: string[],
  x: number,
  y: number,
  width: number,
  height: number,
) {
  ops.push("q");
  ops.push(`${fmt(width)} 0 0 ${fmt(height)} ${fmt(x)} ${fmt(y)} cm`);
  ops.push("/Im1 Do");
  ops.push("Q");
}

function renderSignatureBlock(
  ops: string[],
  x: number,
  y: number,
  name: string,
  title: string,
) {
  drawLine(ops, x, y, x + 180, y, "#334155", 0.8);
  drawText(ops, name, x, y - 14, 11, "F2", "#0f172a");
  drawText(ops, title, x, y - 28, 9, "F1", "#475569");
}

function buildIdCardSpec(
  context: StudentRecordPdfContext,
  title: string,
  periodLabel: string,
  logo: LogoImage | null,
): DocumentSpec {
  const pageWidth = 242.65; // CR80 width in points
  const pageHeight = 153.07; // CR80 height in points
  const ops: string[] = [];
  const studentName = `${context.student.firstName} ${context.student.lastName}`;

  fillRect(ops, 0, 0, pageWidth, pageHeight, "#f8fafc");
  fillRect(ops, 0, pageHeight - 42, pageWidth, 42, "#1d4ed8");
  fillRect(ops, 0, 0, pageWidth, 26, "#0f172a");
  strokeRect(ops, 3, 3, pageWidth - 6, pageHeight - 6, "#1d4ed8", 1.2);

  if (logo) {
    const fit = fitInside(logo.width, logo.height, 28, 28);
    drawImage(ops, 10, pageHeight - 36, fit.width, fit.height);
  } else {
    strokeRect(ops, 10, pageHeight - 36, 28, 28, "#bfdbfe", 1);
    drawText(ops, "LOGO", 12, pageHeight - 24, 7, "F2", "#1e3a8a");
  }

  drawText(
    ops,
    context.institutionName.slice(0, 26),
    44,
    pageHeight - 18,
    9,
    "F2",
    "#ffffff",
  );
  drawText(ops, "STUDENT ID CARD", 44, pageHeight - 31, 8, "F1", "#dbeafe");

  drawText(
    ops,
    studentName.slice(0, 26),
    12,
    pageHeight - 58,
    11,
    "F2",
    "#0f172a",
  );
  drawText(
    ops,
    `ID: ${context.student.studentId}`,
    12,
    pageHeight - 73,
    9,
    "F1",
    "#1e293b",
  );
  drawText(
    ops,
    `Class: ${context.student.className ?? "N/A"}`,
    12,
    pageHeight - 86,
    9,
    "F1",
    "#1e293b",
  );
  drawText(
    ops,
    `Valid: ${periodLabel}`,
    12,
    pageHeight - 99,
    8,
    "F1",
    "#475569",
  );

  drawLine(ops, pageWidth - 95, 34, pageWidth - 14, 34, "#334155", 0.8);
  drawText(
    ops,
    context.signatory.signatoryName ?? "Principal",
    pageWidth - 95,
    22,
    7.5,
    "F2",
    "#f8fafc",
  );
  drawText(
    ops,
    context.signatory.signatoryTitle ?? "Principal",
    pageWidth - 95,
    14,
    6.5,
    "F1",
    "#cbd5e1",
  );

  drawText(ops, title, 10, 8, 7, "F1", "#cbd5e1");

  return { pageWidth, pageHeight, ops };
}

function buildCertificateSpec(
  context: StudentRecordPdfContext,
  title: string,
  periodLabel: string,
  logo: LogoImage | null,
): DocumentSpec {
  const pageWidth = 841.89; // A4 landscape
  const pageHeight = 595.28;
  const ops: string[] = [];
  const studentName = `${context.student.firstName} ${context.student.lastName}`;

  fillRect(ops, 0, 0, pageWidth, pageHeight, "#fffbeb");
  strokeRect(ops, 24, 24, pageWidth - 48, pageHeight - 48, "#1d4ed8", 2);
  strokeRect(ops, 36, 36, pageWidth - 72, pageHeight - 72, "#93c5fd", 0.8);

  if (logo) {
    const fit = fitInside(logo.width, logo.height, 74, 74);
    drawImage(ops, 56, pageHeight - 118, fit.width, fit.height);
  } else {
    strokeRect(ops, 56, pageHeight - 118, 74, 74, "#cbd5e1", 1);
    drawText(ops, "LOGO", 78, pageHeight - 81, 12, "F2", "#64748b");
  }

  drawCenteredText(
    ops,
    context.institutionName.toUpperCase(),
    pageWidth,
    pageHeight - 78,
    25,
    "F2",
    "#0f172a",
  );
  drawCenteredText(
    ops,
    context.institutionAddress ?? "",
    pageWidth,
    pageHeight - 102,
    11,
    "F1",
    "#475569",
  );
  drawCenteredText(
    ops,
    title.toUpperCase(),
    pageWidth,
    pageHeight - 164,
    30,
    "F2",
    "#1d4ed8",
  );

  const lines = [
    "This is to certify that",
    studentName,
    `Student ID: ${context.student.studentId} • Class: ${context.student.className ?? "N/A"}`,
    `has successfully completed the requirements for ${periodLabel}.`,
  ];

  drawCenteredText(
    ops,
    lines[0],
    pageWidth,
    pageHeight - 230,
    15,
    "F1",
    "#334155",
  );
  drawCenteredText(
    ops,
    lines[1],
    pageWidth,
    pageHeight - 268,
    32,
    "F2",
    "#0f172a",
  );
  drawCenteredText(
    ops,
    lines[2],
    pageWidth,
    pageHeight - 302,
    13,
    "F1",
    "#334155",
  );
  drawCenteredText(
    ops,
    lines[3],
    pageWidth,
    pageHeight - 332,
    13,
    "F1",
    "#334155",
  );

  drawText(
    ops,
    `Issued on ${context.generatedAt.toISOString().slice(0, 10)}`,
    56,
    130,
    11,
    "F1",
    "#334155",
  );

  renderSignatureBlock(
    ops,
    56,
    98,
    context.signatory.signatoryName ?? "Principal",
    context.signatory.signatoryTitle ?? "Principal",
  );

  if (context.signatory.coSignatoryName) {
    renderSignatureBlock(
      ops,
      pageWidth - 236,
      98,
      context.signatory.coSignatoryName,
      context.signatory.coSignatoryTitle ?? "Authority",
    );
  }

  drawCenteredText(
    ops,
    context.signatory.certificateFooter ?? "Generated by Dhadash",
    pageWidth,
    56,
    10,
    "F1",
    "#64748b",
  );

  return { pageWidth, pageHeight, ops };
}

function buildReportSpec(
  context: StudentRecordPdfContext,
  title: string,
  periodLabel: string,
  logo: LogoImage | null,
): DocumentSpec {
  const pageWidth = 595.28; // A4 portrait
  const pageHeight = 841.89;
  const ops: string[] = [];
  const studentName = `${context.student.firstName} ${context.student.lastName}`;

  fillRect(ops, 0, 0, pageWidth, pageHeight, "#ffffff");
  fillRect(ops, 0, pageHeight - 96, pageWidth, 96, "#1d4ed8");

  if (logo) {
    const fit = fitInside(logo.width, logo.height, 56, 56);
    drawImage(ops, 30, pageHeight - 82, fit.width, fit.height);
  } else {
    strokeRect(ops, 30, pageHeight - 82, 56, 56, "#bfdbfe", 1);
    drawText(ops, "LOGO", 47, pageHeight - 53, 9, "F2", "#dbeafe");
  }

  drawText(
    ops,
    context.institutionName,
    96,
    pageHeight - 44,
    18,
    "F2",
    "#ffffff",
  );
  drawText(
    ops,
    context.institutionAddress ?? "",
    96,
    pageHeight - 64,
    10,
    "F1",
    "#dbeafe",
  );

  drawText(ops, title, 30, pageHeight - 128, 22, "F2", "#0f172a");
  drawText(
    ops,
    `Period: ${periodLabel}`,
    30,
    pageHeight - 148,
    11,
    "F1",
    "#334155",
  );

  fillRect(ops, 30, pageHeight - 234, pageWidth - 60, 72, "#f8fafc");
  strokeRect(ops, 30, pageHeight - 234, pageWidth - 60, 72, "#e2e8f0", 1);

  drawText(
    ops,
    `Student: ${studentName}`,
    42,
    pageHeight - 186,
    12,
    "F2",
    "#0f172a",
  );
  drawText(
    ops,
    `Student ID: ${context.student.studentId}`,
    42,
    pageHeight - 206,
    11,
    "F1",
    "#334155",
  );
  drawText(
    ops,
    `Class: ${context.student.className ?? "N/A"}`,
    290,
    pageHeight - 186,
    11,
    "F1",
    "#334155",
  );
  drawText(
    ops,
    `Generated: ${context.generatedAt.toISOString().slice(0, 10)}`,
    290,
    pageHeight - 206,
    11,
    "F1",
    "#334155",
  );

  drawText(ops, "Subject", 42, pageHeight - 262, 11, "F2", "#0f172a");
  drawText(ops, "Score", 372, pageHeight - 262, 11, "F2", "#0f172a");
  drawText(ops, "Max", 460, pageHeight - 262, 11, "F2", "#0f172a");
  drawLine(
    ops,
    30,
    pageHeight - 268,
    pageWidth - 30,
    pageHeight - 268,
    "#cbd5e1",
    1,
  );

  let y = pageHeight - 288;
  const visibleSubjects = context.subjects.slice(0, 10);
  for (const row of visibleSubjects) {
    drawText(ops, row.name, 42, y, 10.5, "F1", "#1e293b");
    drawText(ops, String(row.score), 372, y, 10.5, "F1", "#1e293b");
    drawText(ops, String(row.maxScore), 460, y, 10.5, "F1", "#1e293b");
    y -= 22;
    drawLine(ops, 30, y + 6, pageWidth - 30, y + 6, "#f1f5f9", 0.7);
  }

  fillRect(ops, 30, 166, pageWidth - 60, 60, "#eff6ff");
  strokeRect(ops, 30, 166, pageWidth - 60, 60, "#bfdbfe", 1);
  drawText(
    ops,
    `Attendance Summary: Present ${context.attendance.present}, Absent ${context.attendance.absent}, Late ${context.attendance.late}`,
    42,
    203,
    11,
    "F1",
    "#1e3a8a",
  );

  const totalScore = context.subjects.reduce((sum, row) => sum + row.score, 0);
  const maxScore = context.subjects.reduce((sum, row) => sum + row.maxScore, 0);
  const percentage =
    maxScore > 0 ? ((totalScore / maxScore) * 100).toFixed(2) : "0.00";
  drawText(
    ops,
    `Overall: ${totalScore}/${maxScore} (${percentage}%)`,
    42,
    184,
    11,
    "F2",
    "#1e3a8a",
  );

  renderSignatureBlock(
    ops,
    42,
    126,
    context.signatory.signatoryName ?? "Principal",
    context.signatory.signatoryTitle ?? "Principal",
  );

  if (context.signatory.coSignatoryName) {
    renderSignatureBlock(
      ops,
      pageWidth - 222,
      126,
      context.signatory.coSignatoryName,
      context.signatory.coSignatoryTitle ?? "Class Teacher",
    );
  }

  drawText(
    ops,
    context.signatory.certificateFooter ?? "Generated by Dhadash",
    42,
    78,
    10,
    "F1",
    "#64748b",
  );

  return { pageWidth, pageHeight, ops };
}

function buildPdfBuffer(
  pageWidth: number,
  pageHeight: number,
  ops: string[],
  logo: LogoImage | null,
) {
  const resources = logo
    ? "<< /Font << /F1 5 0 R /F2 6 0 R >> /XObject << /Im1 7 0 R >> >>"
    : "<< /Font << /F1 5 0 R /F2 6 0 R >> >>";

  const content = Buffer.from(ops.join("\n"), "utf8");

  const objects: Array<{ id: number; body: Buffer }> = [];
  objects.push({
    id: 1,
    body: Buffer.from("<< /Type /Catalog /Pages 2 0 R >>", "utf8"),
  });
  objects.push({
    id: 2,
    body: Buffer.from("<< /Type /Pages /Kids [3 0 R] /Count 1 >>", "utf8"),
  });
  objects.push({
    id: 3,
    body: Buffer.from(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${fmt(pageWidth)} ${fmt(pageHeight)}] /Contents 4 0 R /Resources ${resources} >>`,
      "utf8",
    ),
  });
  objects.push({
    id: 4,
    body: Buffer.concat([
      Buffer.from(`<< /Length ${content.length} >>\nstream\n`, "utf8"),
      content,
      Buffer.from("\nendstream", "utf8"),
    ]),
  });
  objects.push({
    id: 5,
    body: Buffer.from(
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
      "utf8",
    ),
  });
  objects.push({
    id: 6,
    body: Buffer.from(
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
      "utf8",
    ),
  });

  if (logo) {
    objects.push({
      id: 7,
      body: Buffer.concat([
        Buffer.from(
          `<< /Type /XObject /Subtype /Image /Width ${logo.width} /Height ${logo.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${logo.bytes.length} >>\nstream\n`,
          "utf8",
        ),
        logo.bytes,
        Buffer.from("\nendstream", "utf8"),
      ]),
    });
  }

  const header = Buffer.from("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n", "binary");
  const chunks: Buffer[] = [header];
  const offsets: number[] = [0];
  let offset = header.length;

  for (const object of objects) {
    const prefix = Buffer.from(`${object.id} 0 obj\n`, "utf8");
    const suffix = Buffer.from("\nendobj\n", "utf8");
    offsets.push(offset);
    chunks.push(prefix, object.body, suffix);
    offset += prefix.length + object.body.length + suffix.length;
  }

  const xrefOffset = offset;
  const xref: string[] = [];
  xref.push(`xref\n0 ${objects.length + 1}`);
  xref.push("0000000000 65535 f ");
  for (let i = 1; i < offsets.length; i += 1) {
    xref.push(`${String(offsets[i]).padStart(10, "0")} 00000 n `);
  }
  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  chunks.push(Buffer.from(`${xref.join("\n")}\n${trailer}`, "utf8"));

  return Buffer.concat(chunks);
}

async function loadDataFromUrl(url: string): Promise<Buffer | null> {
  if (url.startsWith("data:image/")) {
    const parts = url.split(",");
    if (parts.length < 2) return null;
    return Buffer.from(parts[1], "base64");
  }

  if (!/^https?:\/\//i.test(url)) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function loadLogoImage(url?: string | null): Promise<LogoImage | null> {
  if (!url) return null;
  const raw = await loadDataFromUrl(url);
  if (!raw) return null;

  try {
    const transformed = await sharp(raw)
      .flatten({ background: "#ffffff" })
      .resize({
        width: 320,
        height: 320,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 86 })
      .toBuffer({ resolveWithObject: true });

    if (!transformed.info.width || !transformed.info.height) {
      return null;
    }

    return {
      bytes: transformed.data,
      width: transformed.info.width,
      height: transformed.info.height,
    };
  } catch {
    return null;
  }
}

export async function buildStudentRecordPdf(context: StudentRecordPdfContext) {
  const title = titleForTemplate(context.template);
  const effectivePeriod = periodLabelValue(
    context.periodType,
    context.periodLabel,
  );

  const logo = await loadLogoImage(context.institutionLogoUrl);

  let spec: DocumentSpec;
  if (context.template === "ID_CARD") {
    spec = buildIdCardSpec(context, title, effectivePeriod, logo);
  } else if (CERTIFICATE_TEMPLATES.has(context.template)) {
    spec = buildCertificateSpec(context, title, effectivePeriod, logo);
  } else if (REPORT_TEMPLATES.has(context.template)) {
    spec = buildReportSpec(context, title, effectivePeriod, logo);
  } else {
    spec = buildReportSpec(context, title, effectivePeriod, logo);
  }

  const pdf = buildPdfBuffer(spec.pageWidth, spec.pageHeight, spec.ops, logo);
  const fileName = `${safeToken(context.student.studentId)}-${safeToken(context.template)}-${safeToken(effectivePeriod)}.pdf`;

  return {
    title,
    periodLabel: effectivePeriod,
    fileName,
    fileUrl: `data:application/pdf;base64,${pdf.toString("base64")}`,
    size: pdf.byteLength,
  };
}
