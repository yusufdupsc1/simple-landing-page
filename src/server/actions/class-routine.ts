"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isGovtPrimaryModeEnabled } from "@/lib/config";

const ROUTINE_DAY_ROWS = [
  { dayOfWeek: 0, label: "রবিবার" },
  { dayOfWeek: 1, label: "সোমবার" },
  { dayOfWeek: 2, label: "মঙ্গলবার" },
  { dayOfWeek: 3, label: "বুধবার" },
  { dayOfWeek: 4, label: "বৃহস্পতিবার" },
] as const;

const ROUTINE_PERIODS = [1, 2, 3, 4, 5, 6] as const;
const GOVT_PRIMARY_ROUTINE_GRADES = new Set(["1", "2", "3", "4", "5"]);

const RoutineCellSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(4),
  periodNo: z.number().int().min(1).max(6),
  subjectName: z.string().max(120).optional().or(z.literal("")),
});

const SaveClassRoutineSchema = z.object({
  classId: z.string().min(1, "Class is required"),
  entries: z.array(RoutineCellSchema).max(30),
});

export type SaveClassRoutineInput = z.infer<typeof SaveClassRoutineSchema>;

export type RoutineGrid = {
  classId: string;
  className: string | null;
  grade: string | null;
  section: string | null;
  rows: Array<{
    dayOfWeek: number;
    label: string;
    periods: Array<{
      periodNo: number;
      subjectName: string;
    }>;
  }>;
};

type ActionResult<T = void> =
  | { success: true; data?: T; error?: never }
  | {
      success: false;
      error: string;
      fieldErrors?: Record<string, string[]>;
      data?: never;
    };

function buildEmptyRoutineRows(): RoutineGrid["rows"] {
  return ROUTINE_DAY_ROWS.map((day) => ({
    dayOfWeek: day.dayOfWeek,
    label: day.label,
    periods: ROUTINE_PERIODS.map((periodNo) => ({
      periodNo,
      subjectName: "",
    })),
  }));
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

export async function getClassRoutineGrid(classId?: string): Promise<RoutineGrid> {
  const { institutionId } = await getAuthContext();

  if (!classId) {
    return {
      classId: "",
      className: null,
      grade: null,
      section: null,
      rows: buildEmptyRoutineRows(),
    };
  }

  const classroom = await db.class.findFirst({
    where: {
      id: classId,
      institutionId,
      isActive: true,
      grade: { in: ["1", "2", "3", "4", "5"] },
    },
    select: {
      id: true,
      name: true,
      grade: true,
      section: true,
    },
  });

  if (!classroom) {
    return {
      classId: "",
      className: null,
      grade: null,
      section: null,
      rows: buildEmptyRoutineRows(),
    };
  }

  const entries = await db.classRoutineEntry.findMany({
    where: {
      institutionId,
      classId: classroom.id,
    },
    select: {
      dayOfWeek: true,
      periodNo: true,
      subjectName: true,
    },
  });

  const cellMap = new Map<string, string>(
    entries.map((entry) => [
      `${entry.dayOfWeek}-${entry.periodNo}`,
      entry.subjectName,
    ]),
  );

  return {
    classId: classroom.id,
    className: classroom.name,
    grade: classroom.grade,
    section: classroom.section,
    rows: ROUTINE_DAY_ROWS.map((day) => ({
      dayOfWeek: day.dayOfWeek,
      label: day.label,
      periods: ROUTINE_PERIODS.map((periodNo) => ({
        periodNo,
        subjectName: cellMap.get(`${day.dayOfWeek}-${periodNo}`) ?? "",
      })),
    })),
  };
}

export async function saveClassRoutine(
  formData: SaveClassRoutineInput,
): Promise<ActionResult<{ count: number }>> {
  try {
    const { institutionId, userId, role } = await getAuthContext();

    if (!isGovtPrimaryModeEnabled()) {
      return { success: false, error: "Govt Primary routine is disabled." };
    }

    if (!["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "STAFF"].includes(role)) {
      return { success: false, error: "Insufficient permissions" };
    }

    const parsed = SaveClassRoutineSchema.safeParse(formData);
    if (!parsed.success) {
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const data = parsed.data;

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

    if (!GOVT_PRIMARY_ROUTINE_GRADES.has(classroom.grade)) {
      return {
        success: false,
        error: "Routine is only available for Class 1 to Class 5.",
      };
    }

    const normalizedMap = new Map<string, { dayOfWeek: number; periodNo: number; subjectName: string }>();

    for (const entry of data.entries) {
      const key = `${entry.dayOfWeek}-${entry.periodNo}`;
      normalizedMap.set(key, {
        dayOfWeek: entry.dayOfWeek,
        periodNo: entry.periodNo,
        subjectName: (entry.subjectName ?? "").trim(),
      });
    }

    const entriesToSave = Array.from(normalizedMap.values()).filter(
      (entry) => entry.subjectName.length > 0,
    );

    await db.$transaction(async (tx) => {
      await tx.classRoutineEntry.deleteMany({
        where: {
          institutionId,
          classId: data.classId,
        },
      });

      if (entriesToSave.length > 0) {
        await tx.classRoutineEntry.createMany({
          data: entriesToSave.map((entry) => ({
            institutionId,
            classId: data.classId,
            dayOfWeek: entry.dayOfWeek,
            periodNo: entry.periodNo,
            subjectName: entry.subjectName,
          })),
        });
      }

      await tx.auditLog.create({
        data: {
          action: "SAVE_CLASS_ROUTINE",
          entity: "ClassRoutine",
          entityId: data.classId,
          newValues: {
            classId: data.classId,
            entriesCount: entriesToSave.length,
          },
          userId,
        },
      });
    });

    revalidatePath("/dashboard/timetable");
    revalidatePath(`/dashboard/timetable?classId=${data.classId}`);
    revalidatePath("/dashboard/timetable/print");

    return {
      success: true,
      data: {
        count: entriesToSave.length,
      },
    };
  } catch (error) {
    console.error("[SAVE_CLASS_ROUTINE]", error);
    return { success: false, error: "Failed to save class routine." };
  }
}
