// src/server/actions/classes.ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { asPlainArray, toNumber } from "@/lib/server/serializers";

const ClassSchema = z.object({
  name: z.string().min(1, "Class name is required"),
  grade: z.string().min(1, "Grade is required"),
  section: z.string().min(1, "Section is required"),
  capacity: z.coerce.number().min(1).max(200).default(30),
  roomNumber: z.string().optional(),
  academicYear: z.string().min(1, "Academic year is required"),
  teacherId: z.string().optional(),
});

const SubjectSchema = z.object({
  name: z.string().min(1, "Subject name is required"),
  code: z.string().min(1, "Subject code is required"),
  description: z.string().optional(),
  credits: z.coerce.number().min(1).default(1),
  isCore: z.boolean().default(true),
});

export type ClassFormData = z.infer<typeof ClassSchema>;
export type SubjectFormData = z.infer<typeof SubjectSchema>;

type ActionResult<T = void> =
  | { success: true; data?: T; error?: never }
  | {
      success: false;
      error: string;
      fieldErrors?: Record<string, string[]>;
      data?: never;
    };

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

// ─── Classes ──────────────────────────────────

export async function createClass(
  formData: ClassFormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { institutionId, userId } = await getAuthContext();
    const parsed = ClassSchema.safeParse(formData);

    if (!parsed.success) {
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<
          string,
          string[]
        >,
      };
    }

    const data = parsed.data;

    const existing = await db.class.findFirst({
      where: {
        institutionId,
        grade: data.grade,
        section: data.section,
        academicYear: data.academicYear,
      },
    });
    if (existing) {
      return {
        success: false,
        error: `Class Grade ${data.grade} Section ${data.section} already exists for ${data.academicYear}.`,
      };
    }

    const cls = await db.$transaction(async (tx) => {
      const c = await tx.class.create({
        data: {
          name: data.name,
          grade: data.grade,
          section: data.section,
          capacity: data.capacity,
          roomNumber: data.roomNumber || null,
          academicYear: data.academicYear,
          teacherId: data.teacherId || null,
          institutionId,
        },
      });

      await tx.auditLog.create({
        data: {
          action: "CREATE",
          entity: "Class",
          entityId: c.id,
          newValues: { name: data.name },
          userId,
        },
      });

      return c;
    });

    revalidatePath("/dashboard/classes");
    return { success: true, data: { id: cls.id } };
  } catch (error) {
    console.error("[CREATE_CLASS]", error);
    return { success: false, error: "Failed to create class." };
  }
}

export async function updateClass(
  id: string,
  formData: ClassFormData,
): Promise<ActionResult> {
  try {
    const { institutionId, userId } = await getAuthContext();
    const parsed = ClassSchema.safeParse(formData);

    if (!parsed.success) {
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<
          string,
          string[]
        >,
      };
    }

    const existing = await db.class.findFirst({ where: { id, institutionId } });
    if (!existing) return { success: false, error: "Class not found" };

    const data = parsed.data;

    await db.$transaction(async (tx) => {
      await tx.class.update({
        where: { id },
        data: {
          name: data.name,
          grade: data.grade,
          section: data.section,
          capacity: data.capacity,
          roomNumber: data.roomNumber || null,
          academicYear: data.academicYear,
          teacherId: data.teacherId || null,
        },
      });

      await tx.auditLog.create({
        data: {
          action: "UPDATE",
          entity: "Class",
          entityId: id,
          oldValues: { name: existing.name },
          newValues: { name: data.name },
          userId,
        },
      });
    });

    revalidatePath("/dashboard/classes");
    return { success: true };
  } catch (error) {
    console.error("[UPDATE_CLASS]", error);
    return { success: false, error: "Failed to update class." };
  }
}

export async function deleteClass(id: string): Promise<ActionResult> {
  try {
    const { institutionId, role, userId } = await getAuthContext();

    if (!["SUPER_ADMIN", "ADMIN", "PRINCIPAL"].includes(role)) {
      return { success: false, error: "Insufficient permissions" };
    }

    const cls = await db.class.findFirst({ where: { id, institutionId } });
    if (!cls) return { success: false, error: "Class not found" };

    await db.$transaction(async (tx) => {
      await tx.class.update({ where: { id }, data: { isActive: false } });
      await tx.auditLog.create({
        data: { action: "DEACTIVATE", entity: "Class", entityId: id, userId },
      });
    });

    revalidatePath("/dashboard/classes");
    return { success: true };
  } catch (error) {
    console.error("[DELETE_CLASS]", error);
    return { success: false, error: "Failed to delete class." };
  }
}

export async function getClasses({
  page = 1,
  limit = 20,
  search = "",
  academicYear = "",
}: {
  page?: number;
  limit?: number;
  search?: string;
  academicYear?: string;
}) {
  const { institutionId } = await getAuthContext();

  const where: Record<string, unknown> = {
    institutionId,
    isActive: true,
    ...(academicYear && { academicYear }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { grade: { contains: search, mode: "insensitive" } },
        { section: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const [classes, total] = await Promise.all([
    db.class.findMany({
      where,
      include: {
        classTeacher: { select: { firstName: true, lastName: true } },
        _count: { select: { students: true } },
      },
      orderBy: [{ grade: "asc" }, { section: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.class.count({ where }),
  ]);

  return {
    classes: asPlainArray(classes).map((classItem) => ({
      id: classItem.id,
      name: classItem.name,
      grade: classItem.grade,
      section: classItem.section,
      capacity: classItem.capacity,
      roomNumber: classItem.roomNumber,
      academicYear: classItem.academicYear,
      classTeacher: classItem.classTeacher
        ? {
            firstName: classItem.classTeacher.firstName,
            lastName: classItem.classTeacher.lastName,
          }
        : null,
      _count: { students: toNumber(classItem._count.students) },
    })),
    total,
    pages: Math.max(1, Math.ceil(total / limit)),
    page,
  };
}

// ─── Subjects ─────────────────────────────────

export async function createSubject(
  formData: SubjectFormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { institutionId, userId } = await getAuthContext();
    const parsed = SubjectSchema.safeParse(formData);

    if (!parsed.success) {
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<
          string,
          string[]
        >,
      };
    }

    const data = parsed.data;

    const existing = await db.subject.findFirst({
      where: { institutionId, code: data.code.toUpperCase() },
    });
    if (existing) {
      return {
        success: false,
        error: `Subject code ${data.code.toUpperCase()} already exists.`,
      };
    }

    const subject = await db.$transaction(async (tx) => {
      const s = await tx.subject.create({
        data: {
          name: data.name,
          code: data.code.toUpperCase(),
          description: data.description || null,
          credits: data.credits,
          isCore: data.isCore,
          institutionId,
        },
      });

      await tx.auditLog.create({
        data: {
          action: "CREATE",
          entity: "Subject",
          entityId: s.id,
          newValues: { name: data.name, code: s.code },
          userId,
        },
      });

      return s;
    });

    revalidatePath("/dashboard/classes");
    return { success: true, data: { id: subject.id } };
  } catch (error) {
    console.error("[CREATE_SUBJECT]", error);
    return { success: false, error: "Failed to create subject." };
  }
}

export async function updateSubject(
  id: string,
  formData: SubjectFormData,
): Promise<ActionResult> {
  try {
    const { institutionId, userId } = await getAuthContext();
    const parsed = SubjectSchema.safeParse(formData);

    if (!parsed.success) {
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<
          string,
          string[]
        >,
      };
    }

    const existing = await db.subject.findFirst({
      where: { id, institutionId },
    });
    if (!existing) return { success: false, error: "Subject not found" };

    const data = parsed.data;

    await db.$transaction(async (tx) => {
      await tx.subject.update({
        where: { id },
        data: {
          name: data.name,
          code: data.code.toUpperCase(),
          description: data.description || null,
          credits: data.credits,
          isCore: data.isCore,
        },
      });

      await tx.auditLog.create({
        data: {
          action: "UPDATE",
          entity: "Subject",
          entityId: id,
          oldValues: { name: existing.name },
          newValues: { name: data.name },
          userId,
        },
      });
    });

    revalidatePath("/dashboard/classes");
    return { success: true };
  } catch (error) {
    console.error("[UPDATE_SUBJECT]", error);
    return { success: false, error: "Failed to update subject." };
  }
}

export async function deleteSubject(id: string): Promise<ActionResult> {
  try {
    const { institutionId, role, userId } = await getAuthContext();

    if (!["SUPER_ADMIN", "ADMIN", "PRINCIPAL"].includes(role)) {
      return { success: false, error: "Insufficient permissions" };
    }

    const existing = await db.subject.findFirst({
      where: { id, institutionId },
      select: { id: true, name: true },
    });
    if (!existing) return { success: false, error: "Subject not found" };

    await db.$transaction(async (tx) => {
      await tx.subject.update({
        where: { id },
        data: { isActive: false },
      });
      await tx.auditLog.create({
        data: {
          action: "DEACTIVATE",
          entity: "Subject",
          entityId: id,
          oldValues: { name: existing.name },
          userId,
        },
      });
    });

    revalidatePath("/dashboard/classes");
    return { success: true };
  } catch (error) {
    console.error("[DELETE_SUBJECT]", error);
    return { success: false, error: "Failed to delete subject." };
  }
}

export async function getSubjects(search = "") {
  const { institutionId } = await getAuthContext();

  const subjects = await db.subject.findMany({
    where: {
      institutionId,
      isActive: true,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { code: { contains: search, mode: "insensitive" } },
        ],
      }),
    },
    include: {
      _count: { select: { teachers: true, grades: true } },
    },
    orderBy: { name: "asc" },
  });

  return asPlainArray(subjects).map((subject) => ({
    id: subject.id,
    name: subject.name,
    code: subject.code,
    credits: subject.credits,
    isCore: subject.isCore,
    _count: {
      teachers: toNumber(subject._count.teachers),
      grades: toNumber(subject._count.grades),
    },
  }));
}
