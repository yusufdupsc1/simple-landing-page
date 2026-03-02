"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isGovtPrimaryModeEnabled } from "@/lib/config";
import { toIsoDate } from "@/lib/server/serializers";

const GOVT_PRIMARY_EXAM_GRADES = new Set(["1", "2", "3", "4", "5"]);
const PASS_MARK_THRESHOLD = 33;

const CreatePrimaryExamSchema = z.object({
  name: z.string().trim().min(1, "Exam name is required").max(120),
  year: z.coerce.number().int().min(2020).max(2100),
  classId: z.string().min(1, "Class is required"),
  subjectsText: z.string().min(1, "Subjects are required"),
});

const SavePrimaryExamMarksSchema = z.object({
  examId: z.string().min(1, "Exam is required"),
  entries: z
    .array(
      z.object({
        studentId: z.string().min(1),
        subjectName: z.string().trim().min(1).max(120),
        score: z.number().min(0).max(100).nullable().optional(),
        isAbsent: z.boolean().optional(),
      }),
    )
    .max(5000),
});

export type CreatePrimaryExamInput = z.infer<typeof CreatePrimaryExamSchema>;
export type SavePrimaryExamMarksInput = z.infer<typeof SavePrimaryExamMarksSchema>;

type ActionResult<T = void> =
  | { success: true; data?: T; error?: never }
  | {
      success: false;
      error: string;
      fieldErrors?: Record<string, string[]>;
      data?: never;
    };

function normalizeSubjects(subjectsText: string): string[] {
  const seen = new Set<string>();
  const subjects: string[] = [];

  for (const raw of subjectsText.split(/[\n,]/g)) {
    const subject = raw.trim();
    if (!subject) continue;
    const key = subject.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    subjects.push(subject);
  }

  return subjects;
}

type MarkCell = {
  score: number | null;
  isAbsent: boolean;
  isMissing: boolean;
};

function getResultStatus(cells: MarkCell[]): "PASS" | "FAIL" | "INCOMPLETE" {
  if (cells.some((cell) => cell.isMissing)) return "INCOMPLETE";
  if (cells.some((cell) => cell.isAbsent || (typeof cell.score === "number" && cell.score < PASS_MARK_THRESHOLD))) {
    return "FAIL";
  }
  return "PASS";
}

async function getAuthContext() {
  const session = await auth();
  const user = session?.user as
    | { id?: string; institutionId?: string; role?: string }
    | undefined;

  if (!user?.id || !user.institutionId || !user.role) {
    throw new Error("Unauthorized");
  }

  return {
    userId: user.id,
    institutionId: user.institutionId,
    role: user.role,
  };
}

function canManagePrimaryExams(role: string): boolean {
  return ["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "STAFF", "TEACHER"].includes(role);
}

export async function createPrimaryExam(
  formData: CreatePrimaryExamInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { institutionId, userId, role } = await getAuthContext();

    if (!isGovtPrimaryModeEnabled()) {
      return { success: false, error: "Govt Primary mode is disabled." };
    }

    if (!canManagePrimaryExams(role)) {
      return { success: false, error: "Insufficient permissions" };
    }

    const parsed = CreatePrimaryExamSchema.safeParse(formData);
    if (!parsed.success) {
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const data = parsed.data;
    const subjects = normalizeSubjects(data.subjectsText);

    if (subjects.length === 0) {
      return { success: false, error: "Please provide at least one subject." };
    }

    const classroom = await db.class.findFirst({
      where: {
        id: data.classId,
        institutionId,
        isActive: true,
      },
      select: { id: true, grade: true },
    });

    if (!classroom) {
      return { success: false, error: "Class not found" };
    }

    if (!GOVT_PRIMARY_EXAM_GRADES.has(classroom.grade)) {
      return { success: false, error: "Primary exam is only available for Class 1 to 5." };
    }

    const exam = await db.$transaction(async (tx) => {
      const created = await tx.primaryExam.create({
        data: {
          name: data.name,
          year: data.year,
          classId: data.classId,
          institutionId,
          subjectsText: subjects.join("\n"),
        },
        select: { id: true },
      });

      await tx.auditLog.create({
        data: {
          action: "CREATE_PRIMARY_EXAM",
          entity: "PrimaryExam",
          entityId: created.id,
          newValues: {
            classId: data.classId,
            name: data.name,
            year: data.year,
            subjects,
          },
          userId,
        },
      });

      return created;
    });

    revalidatePath("/dashboard/exams/primary");

    return { success: true, data: { id: exam.id } };
  } catch (error) {
    console.error("[CREATE_PRIMARY_EXAM]", error);
    return { success: false, error: "Failed to create exam." };
  }
}

export async function getPrimaryExams() {
  const { institutionId } = await getAuthContext();

  const exams = await db.primaryExam.findMany({
    where: { institutionId },
    select: {
      id: true,
      name: true,
      year: true,
      subjectsText: true,
      createdAt: true,
      class: {
        select: {
          id: true,
          name: true,
          grade: true,
          section: true,
        },
      },
    },
    orderBy: [{ year: "desc" }, { createdAt: "desc" }],
  });

  return exams.map((exam) => ({
    id: exam.id,
    name: exam.name,
    year: exam.year,
    subjects: normalizeSubjects(exam.subjectsText),
    createdAt: toIsoDate(exam.createdAt),
    class: exam.class,
  }));
}

export async function getPrimaryExamResultData(examId: string) {
  const { institutionId } = await getAuthContext();

  const exam = await db.primaryExam.findFirst({
    where: {
      id: examId,
      institutionId,
    },
    select: {
      id: true,
      name: true,
      year: true,
      subjectsText: true,
      classId: true,
      class: {
        select: {
          id: true,
          name: true,
          grade: true,
          section: true,
        },
      },
    },
  });

  if (!exam) return null;

  if (!GOVT_PRIMARY_EXAM_GRADES.has(exam.class.grade)) {
    return null;
  }

  const subjects = normalizeSubjects(exam.subjectsText);

  const [students, marks] = await Promise.all([
    db.student.findMany({
      where: {
        institutionId,
        classId: exam.classId,
        status: "ACTIVE",
      },
      select: {
        id: true,
        studentId: true,
        firstName: true,
        lastName: true,
        studentNameEn: true,
        studentNameBn: true,
        rollNo: true,
      },
      orderBy: [{ rollNo: "asc" }, { firstName: "asc" }, { lastName: "asc" }],
    }),
    db.primaryExamMark.findMany({
      where: {
        institutionId,
        examId,
      },
      select: {
        studentId: true,
        subjectName: true,
        score: true,
        isAbsent: true,
      },
    }),
  ]);

  const markMap = new Map<string, { score: number | null; isAbsent: boolean }>(
    marks.map((mark) => [
      `${mark.studentId}::${mark.subjectName}`,
      {
        score: mark.score,
        isAbsent: mark.isAbsent,
      },
    ]),
  );

  const rows = students.map((student) => {
    const marksBySubject: Record<string, MarkCell> = {};
    let total = 0;

    for (const subject of subjects) {
      const mark = markMap.get(`${student.id}::${subject}`);
      if (!mark) {
        marksBySubject[subject] = { score: null, isAbsent: false, isMissing: true };
      } else if (mark.isAbsent) {
        marksBySubject[subject] = { score: null, isAbsent: true, isMissing: false };
      } else if (typeof mark.score === "number") {
        marksBySubject[subject] = { score: mark.score, isAbsent: false, isMissing: false };
        total += mark.score;
      } else {
        marksBySubject[subject] = { score: null, isAbsent: false, isMissing: true };
      }
    }

    const maxTotal = subjects.length * 100;
    const percentage = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
    const resultStatus = getResultStatus(Object.values(marksBySubject));

    return {
      studentId: student.id,
      studentCode: student.studentId,
      rollNo: student.rollNo,
      studentName:
        student.studentNameBn ||
        student.studentNameEn ||
        `${student.firstName} ${student.lastName}`.trim(),
      marksBySubject,
      total: Number(total.toFixed(2)),
      percentage: Number(percentage.toFixed(2)),
      resultStatus,
    };
  });

  return {
    exam: {
      id: exam.id,
      name: exam.name,
      year: exam.year,
      class: exam.class,
    },
    subjects,
    rows,
  };
}

export async function savePrimaryExamMarks(
  formData: SavePrimaryExamMarksInput,
): Promise<ActionResult<{ count: number }>> {
  try {
    const { institutionId, role, userId } = await getAuthContext();

    if (!isGovtPrimaryModeEnabled()) {
      return { success: false, error: "Govt Primary mode is disabled." };
    }

    if (!canManagePrimaryExams(role)) {
      return { success: false, error: "Insufficient permissions" };
    }

    const parsed = SavePrimaryExamMarksSchema.safeParse(formData);
    if (!parsed.success) {
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const data = parsed.data;

    const exam = await db.primaryExam.findFirst({
      where: {
        id: data.examId,
        institutionId,
      },
      select: {
        id: true,
        classId: true,
        subjectsText: true,
        class: {
          select: {
            grade: true,
          },
        },
      },
    });

    if (!exam) {
      return { success: false, error: "Exam not found." };
    }

    if (!GOVT_PRIMARY_EXAM_GRADES.has(exam.class.grade)) {
      return { success: false, error: "Primary exam is only available for Class 1 to 5." };
    }

    const allowedSubjects = new Set(normalizeSubjects(exam.subjectsText));
    const submittedStudentIds = Array.from(new Set(data.entries.map((entry) => entry.studentId)));

    const validStudents = await db.student.findMany({
      where: {
        institutionId,
        classId: exam.classId,
        id: { in: submittedStudentIds },
      },
      select: { id: true },
    });

    if (validStudents.length !== submittedStudentIds.length) {
      return { success: false, error: "Some students are not in the selected class." };
    }

    const normalizedMap = new Map<
      string,
      { studentId: string; subjectName: string; score: number | null; isAbsent: boolean }
    >();

    for (const entry of data.entries) {
      const subjectName = entry.subjectName.trim();
      if (!allowedSubjects.has(subjectName)) continue;
      const isAbsent = entry.isAbsent === true;
      const hasScore = typeof entry.score === "number";
      if (!isAbsent && !hasScore) continue;

      const key = `${entry.studentId}::${subjectName}`;
      normalizedMap.set(key, {
        studentId: entry.studentId,
        subjectName,
        score: isAbsent ? null : entry.score ?? null,
        isAbsent,
      });
    }

    const marksToSave = Array.from(normalizedMap.values());

    await db.$transaction(async (tx) => {
      await tx.primaryExamMark.deleteMany({
        where: {
          institutionId,
          examId: exam.id,
        },
      });

      if (marksToSave.length > 0) {
        await tx.primaryExamMark.createMany({
          data: marksToSave.map((mark) => ({
            institutionId,
            examId: exam.id,
            studentId: mark.studentId,
            subjectName: mark.subjectName,
            score: mark.score,
            isAbsent: mark.isAbsent,
          })),
        });
      }

      await tx.auditLog.create({
        data: {
          action: "SAVE_PRIMARY_EXAM_MARKS",
          entity: "PrimaryExam",
          entityId: exam.id,
          newValues: {
            examId: exam.id,
            marksCount: marksToSave.length,
          },
          userId,
        },
      });
    });

    revalidatePath("/dashboard/exams/primary");
    revalidatePath(`/dashboard/exams/primary?examId=${exam.id}`);
    revalidatePath(`/dashboard/exams/primary/${exam.id}/print`);

    return {
      success: true,
      data: {
        count: marksToSave.length,
      },
    };
  } catch (error) {
    console.error("[SAVE_PRIMARY_EXAM_MARKS]", error);
    return { success: false, error: "Failed to save marks." };
  }
}
