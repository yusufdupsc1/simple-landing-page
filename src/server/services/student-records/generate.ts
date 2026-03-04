import type {
  RecordPeriodType,
  RecordSource,
  StudentRecord,
  StudentRecordType,
} from "@prisma/client";
import { db } from "@/lib/db";
import {
  BANGLADESHI_SUBJECT_OPTIONS,
  type StudentReportGenerateInput,
} from "@/lib/contracts/v1/students-records";
import { buildStudentRecordPdf } from "@/server/services/student-records/pdf-templates";

const PROGRESS_RECORD_TYPE_BY_PERIOD: Record<
  RecordPeriodType,
  StudentRecordType
> = {
  WEEKLY: "WEEKLY_PROGRESS",
  MONTHLY: "MONTHLY_PROGRESS",
  QUARTERLY: "QUARTERLY_PROGRESS",
  ANNUAL: "ANNUAL_FINAL_REPORT",
  CUSTOM: "WEEKLY_PROGRESS",
};

export function mapTemplateToRecordType(
  template: StudentReportGenerateInput["template"],
): StudentRecordType {
  return template;
}

export function defaultPeriodLabel(
  periodType: RecordPeriodType,
  now = new Date(),
) {
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");

  if (periodType === "WEEKLY") return `${year}-W${month}-${day}`;
  if (periodType === "MONTHLY") return `${year}-${month}`;
  if (periodType === "QUARTERLY")
    return `${year}-Q${Math.ceil((now.getUTCMonth() + 1) / 3)}`;
  if (periodType === "ANNUAL") return `${year}`;
  return `${year}-${month}-${day}`;
}

interface GenerateRecordInput {
  institutionId: string;
  studentId: string;
  recordType: StudentRecordType;
  periodType: RecordPeriodType;
  periodLabel?: string;
  source?: RecordSource;
  generatedByUserId?: string;
  regenerate?: boolean;
}

interface GenerateRecordResult {
  created: boolean;
  record: StudentRecord;
}

async function buildStudentContext(institutionId: string, studentId: string) {
  const [institution, student, grades, attendanceByStatus] = await Promise.all([
    db.institution.findUnique({
      where: { id: institutionId },
      select: {
        id: true,
        name: true,
        address: true,
        logo: true,
        settings: {
          select: {
            signatoryName: true,
            signatoryTitle: true,
            coSignatoryName: true,
            coSignatoryTitle: true,
            certificateFooter: true,
            certificateLogoUrl: true,
          },
        },
      },
    }),
    db.student.findFirst({
      where: { id: studentId, institutionId },
      select: {
        id: true,
        studentId: true,
        firstName: true,
        lastName: true,
        class: { select: { name: true } },
      },
    }),
    db.grade.findMany({
      where: { studentId, institutionId },
      include: { subject: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 24,
    }),
    db.attendance.groupBy({
      by: ["status"],
      where: { studentId, institutionId },
      _count: { status: true },
    }),
  ]);

  if (!institution || !student) {
    throw new Error("Student not found for institution");
  }

  const subjectMap = new Map<
    string,
    { name: string; score: number; maxScore: number }
  >();
  for (const grade of grades) {
    const key = grade.subjectId;
    if (!subjectMap.has(key)) {
      subjectMap.set(key, {
        name: grade.subject.name,
        score: grade.score,
        maxScore: grade.maxScore,
      });
    }
  }

  if (subjectMap.size === 0) {
    for (const subject of BANGLADESHI_SUBJECT_OPTIONS) {
      subjectMap.set(subject, {
        name: subject,
        score: 0,
        maxScore: 100,
      });
    }
  }

  const attendance = {
    present: 0,
    absent: 0,
    late: 0,
  };

  for (const row of attendanceByStatus) {
    if (row.status === "PRESENT") attendance.present = row._count.status;
    if (row.status === "ABSENT") attendance.absent = row._count.status;
    if (row.status === "LATE") attendance.late = row._count.status;
  }

  return {
    institution,
    student,
    subjects: Array.from(subjectMap.values()),
    attendance,
  };
}

export async function generateStudentRecord(
  input: GenerateRecordInput,
): Promise<GenerateRecordResult> {
  const periodLabel =
    (input.periodLabel ?? "").trim() || defaultPeriodLabel(input.periodType);

  const uniqueWhere = {
    studentId_periodType_periodLabel_recordType: {
      studentId: input.studentId,
      periodType: input.periodType,
      periodLabel,
      recordType: input.recordType,
    },
  } as const;

  const existing = await db.studentRecord.findUnique({ where: uniqueWhere });
  if (existing && !input.regenerate) {
    return { created: false, record: existing };
  }

  const context = await buildStudentContext(
    input.institutionId,
    input.studentId,
  );
  const rendered = await buildStudentRecordPdf({
    template: input.recordType,
    periodType: input.periodType,
    periodLabel,
    institutionName: context.institution.name,
    institutionAddress: context.institution.address,
    institutionLogoUrl:
      context.institution.settings?.certificateLogoUrl ??
      context.institution.logo ??
      null,
    student: {
      id: context.student.id,
      studentId: context.student.studentId,
      firstName: context.student.firstName,
      lastName: context.student.lastName,
      className: context.student.class?.name,
    },
    subjects: context.subjects,
    attendance: context.attendance,
    generatedAt: new Date(),
    signatory: {
      signatoryName: context.institution.settings?.signatoryName,
      signatoryTitle: context.institution.settings?.signatoryTitle,
      coSignatoryName: context.institution.settings?.coSignatoryName,
      coSignatoryTitle: context.institution.settings?.coSignatoryTitle,
      certificateFooter: context.institution.settings?.certificateFooter,
    },
  });

  const payload = {
    institutionId: input.institutionId,
    studentId: input.studentId,
    title: rendered.title,
    fileName: rendered.fileName,
    fileUrl: rendered.fileUrl,
    periodType: input.periodType,
    periodLabel: rendered.periodLabel,
    recordType: input.recordType,
    source: input.source ?? "MANUAL",
    generatedByUserId: input.generatedByUserId ?? null,
    metadata: {
      size: rendered.size,
    },
  };

  const record = existing
    ? await db.studentRecord.update({
        where: { id: existing.id },
        data: payload,
      })
    : await db.studentRecord.create({ data: payload });

  return { created: !existing, record };
}

interface ListStudentRecordsInput {
  institutionId: string;
  studentId: string;
  periodType?: RecordPeriodType;
  q?: string;
  limit?: number;
}

export async function listStudentRecords(input: ListStudentRecordsInput) {
  const records = await db.studentRecord.findMany({
    where: {
      institutionId: input.institutionId,
      studentId: input.studentId,
      ...(input.periodType ? { periodType: input.periodType } : {}),
      ...(input.q
        ? {
            OR: [
              { title: { contains: input.q, mode: "insensitive" } },
              { periodLabel: { contains: input.q, mode: "insensitive" } },
              { recordType: { equals: input.q as StudentRecordType } },
            ],
          }
        : {}),
    },
    orderBy: [{ periodLabel: "desc" }, { generatedAt: "desc" }],
    take: input.limit ?? 100,
  });
  const typedRecords = records as StudentRecord[];

  const grouped = typedRecords.reduce(
    (acc, record) => {
      const key = `${record.periodType}:${record.periodLabel}`;
      acc[key] = acc[key] ? [...acc[key], record] : [record];
      return acc;
    },
    {} as Record<string, StudentRecord[]>,
  );

  return {
    records: typedRecords,
    grouped,
  };
}

interface GeneratePeriodicRecordsInput {
  periodType: RecordPeriodType;
  periodLabel?: string;
  recordTypes?: StudentRecordType[];
}

export async function generatePeriodicRecords(
  input: GeneratePeriodicRecordsInput,
) {
  if ((process.env.AUTO_DOCS_ENABLED ?? "true") === "false") {
    return {
      generated: 0,
      reused: 0,
      failed: 0,
      skipped: true,
    };
  }

  const institutions = await db.institution.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  let generated = 0;
  let reused = 0;
  let failed = 0;

  const defaultRecordType = PROGRESS_RECORD_TYPE_BY_PERIOD[input.periodType];
  const recordTypes = input.recordTypes?.length
    ? input.recordTypes
    : [defaultRecordType];

  for (const institution of institutions) {
    const students = await db.student.findMany({
      where: {
        institutionId: institution.id,
        status: "ACTIVE",
      },
      select: { id: true },
    });

    for (const student of students) {
      for (const recordType of recordTypes) {
        try {
          const result = await generateStudentRecord({
            institutionId: institution.id,
            studentId: student.id,
            periodType: input.periodType,
            periodLabel: input.periodLabel,
            recordType,
            source: "CRON",
            regenerate: false,
          });

          if (result.created) generated += 1;
          else reused += 1;
        } catch {
          failed += 1;
        }
      }
    }
  }

  return {
    generated,
    reused,
    failed,
    skipped: false,
    periodType: input.periodType,
    periodLabel: input.periodLabel ?? defaultPeriodLabel(input.periodType),
  };
}

export const PERIOD_RECORD_BUNDLES: Record<
  RecordPeriodType,
  StudentRecordType[]
> = {
  WEEKLY: ["WEEKLY_PROGRESS", "ATTENDANCE_RECORD"],
  MONTHLY: ["MONTHLY_PROGRESS", "RESULT_SHEET"],
  QUARTERLY: ["QUARTERLY_PROGRESS", "RESULT_SHEET", "BEHAVIOR_TRACKING"],
  ANNUAL: [
    "ANNUAL_FINAL_REPORT",
    "FINAL_EXAM_CERTIFICATE",
    "CHARACTER_CERTIFICATE",
  ],
  CUSTOM: ["WEEKLY_PROGRESS"],
};
