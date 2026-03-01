// src/server/actions/teachers.ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  provisionRoleUser,
  type ProvisionedCredential,
} from "@/server/services/user-provisioning";
import {
  asPlainArray,
  toIsoDate,
  toNullableNumber,
} from "@/lib/server/serializers";
import { isPrivilegedOrStaff } from "@/lib/server/role-scope";

const TeacherSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  address: z.string().optional(),
  qualification: z.string().optional(),
  specialization: z.string().optional(),
  salary: z.string().optional(),
  joiningDate: z.string().optional(),
  status: z
    .enum(["ACTIVE", "INACTIVE", "ON_LEAVE", "RESIGNED", "TERMINATED"])
    .optional(),
  subjectIds: z.array(z.string()).optional(),
});

export type TeacherFormData = z.infer<typeof TeacherSchema>;
const VALID_TEACHER_STATUSES = [
  "ACTIVE",
  "INACTIVE",
  "ON_LEAVE",
  "RESIGNED",
  "TERMINATED",
] as const;
type TeacherStatus = (typeof VALID_TEACHER_STATUSES)[number];

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
    | { id?: string; institutionId?: string; role?: string; email?: string | null }
    | undefined;

  if (!user?.id || !user.institutionId || !user.role) {
    throw new Error("Unauthorized");
  }
  return {
    userId: user.id,
    institutionId: user.institutionId,
    role: user.role,
    email: user.email,
  };
}

async function generateTeacherId(institutionId: string): Promise<string> {
  const year = new Date().getFullYear();
  const count = await db.teacher.count({ where: { institutionId } });
  return `TCH-${year}-${String(count + 1).padStart(3, "0")}`;
}

export async function createTeacher(
  formData: TeacherFormData,
): Promise<ActionResult<{ id: string; teacherId: string; credential?: ProvisionedCredential | null }>> {
  try {
    const { institutionId, userId, role } = await getAuthContext();
    if (!isPrivilegedOrStaff(role)) {
      return { success: false, error: "Insufficient permissions" };
    }
    const parsed = TeacherSchema.safeParse(formData);

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
    const teacherId = await generateTeacherId(institutionId);

    // Check email uniqueness within institution
    const existing = await db.teacher.findFirst({
      where: { institutionId, email: data.email },
    });
    if (existing) {
      return {
        success: false,
        error: "A teacher with this email already exists.",
      };
    }

    const teacher = await db.$transaction(async (tx) => {
      const displayName = `${data.firstName} ${data.lastName}`.trim();
      const provisioned = await provisionRoleUser({
        tx,
        institutionId,
        role: "TEACHER",
        email: data.email,
        displayName,
        passwordSeed: teacherId,
      });

      const t = await tx.teacher.create({
        data: {
          teacherId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone || null,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
          gender: data.gender || null,
          address: data.address || null,
          qualification: data.qualification || null,
          specialization: data.specialization || null,
          salary: data.salary ? parseFloat(data.salary) : null,
          joiningDate: data.joiningDate
            ? new Date(data.joiningDate)
            : new Date(),
          status: data.status || "ACTIVE",
          institutionId,
          userId: provisioned.userId,
        },
      });

      if (data.subjectIds && data.subjectIds.length > 0) {
        await tx.teacherSubject.createMany({
          data: data.subjectIds.map((subjectId) => ({
            teacherId: t.id,
            subjectId,
          })),
          skipDuplicates: true,
        });
      }

      await tx.auditLog.create({
        data: {
          action: "CREATE",
          entity: "Teacher",
          entityId: t.id,
          newValues: {
            teacherId,
            firstName: data.firstName,
            lastName: data.lastName,
          },
          userId,
        },
      });

      return {
        teacher: t,
        credential: provisioned.credential,
      };
    });

    revalidatePath("/dashboard/teachers");
    return {
      success: true,
      data: {
        id: teacher.teacher.id,
        teacherId: teacher.teacher.teacherId,
        credential: teacher.credential,
      },
    };
  } catch (error) {
    console.error("[CREATE_TEACHER]", error);
    return {
      success: false,
      error: "Failed to create teacher. Please try again.",
    };
  }
}

export async function updateTeacher(
  id: string,
  formData: TeacherFormData,
): Promise<ActionResult> {
  try {
    const { institutionId, userId, role } = await getAuthContext();
    if (!isPrivilegedOrStaff(role)) {
      return { success: false, error: "Insufficient permissions" };
    }
    const parsed = TeacherSchema.safeParse(formData);

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

    const existing = await db.teacher.findFirst({
      where: { id, institutionId },
    });
    if (!existing) return { success: false, error: "Teacher not found" };

    const data = parsed.data;

    await db.$transaction(async (tx) => {
      await tx.teacher.update({
        where: { id },
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone || null,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
          gender: data.gender || null,
          address: data.address || null,
          qualification: data.qualification || null,
          specialization: data.specialization || null,
          salary: data.salary ? parseFloat(data.salary) : null,
          status: data.status || "ACTIVE",
        },
      });

      if (data.subjectIds !== undefined) {
        await tx.teacherSubject.deleteMany({ where: { teacherId: id } });
        if (data.subjectIds.length > 0) {
          await tx.teacherSubject.createMany({
            data: data.subjectIds.map((subjectId) => ({
              teacherId: id,
              subjectId,
            })),
            skipDuplicates: true,
          });
        }
      }

      await tx.auditLog.create({
        data: {
          action: "UPDATE",
          entity: "Teacher",
          entityId: id,
          oldValues: {
            firstName: existing.firstName,
            lastName: existing.lastName,
          },
          newValues: { firstName: data.firstName, lastName: data.lastName },
          userId,
        },
      });
    });

    revalidatePath("/dashboard/teachers");
    return { success: true };
  } catch (error) {
    console.error("[UPDATE_TEACHER]", error);
    return { success: false, error: "Failed to update teacher." };
  }
}

export async function deleteTeacher(id: string): Promise<ActionResult> {
  try {
    const { institutionId, role, userId } = await getAuthContext();

    if (!["SUPER_ADMIN", "ADMIN", "PRINCIPAL"].includes(role)) {
      return { success: false, error: "Insufficient permissions" };
    }

    const teacher = await db.teacher.findFirst({
      where: { id, institutionId },
    });
    if (!teacher) return { success: false, error: "Teacher not found" };

    await db.$transaction(async (tx) => {
      await tx.teacher.update({
        where: { id },
        data: { status: "INACTIVE" },
      });

      await tx.auditLog.create({
        data: {
          action: "DEACTIVATE",
          entity: "Teacher",
          entityId: id,
          userId,
        },
      });
    });

    revalidatePath("/dashboard/teachers");
    revalidatePath("/dashboard/control/inactive");
    return { success: true };
  } catch (error) {
    console.error("[DELETE_TEACHER]", error);
    return { success: false, error: "Failed to deactivate teacher." };
  }
}

export async function setTeacherStatus(
  id: string,
  status: Extract<TeacherStatus, "ACTIVE" | "INACTIVE">,
): Promise<ActionResult> {
  try {
    const { institutionId, role, userId } = await getAuthContext();

    if (!["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "STAFF"].includes(role)) {
      return { success: false, error: "Insufficient permissions" };
    }

    const teacher = await db.teacher.findFirst({
      where: { id, institutionId },
      select: { id: true, status: true },
    });
    if (!teacher) {
      return { success: false, error: "Teacher not found" };
    }

    await db.$transaction(async (tx) => {
      await tx.teacher.update({
        where: { id },
        data: { status },
      });

      await tx.auditLog.create({
        data: {
          action: status === "ACTIVE" ? "ACTIVATE" : "DEACTIVATE",
          entity: "Teacher",
          entityId: id,
          oldValues: { status: teacher.status },
          newValues: { status },
          userId,
        },
      });
    });

    revalidatePath("/dashboard/teachers");
    revalidatePath("/dashboard/control/inactive");
    return { success: true };
  } catch (error) {
    console.error("[SET_TEACHER_STATUS]", error);
    return { success: false, error: "Failed to update teacher status." };
  }
}

export async function getTeachers({
  page = 1,
  limit = 20,
  search = "",
  status = "ACTIVE",
}: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}) {
  const { institutionId, role, userId, email } = await getAuthContext();
  const normalizedStatus =
    status === "ALL" ||
    VALID_TEACHER_STATUSES.includes(
      status as (typeof VALID_TEACHER_STATUSES)[number],
    )
      ? status
      : "ACTIVE";

  const where: Record<string, unknown> = {
    institutionId,
    ...(role === "TEACHER"
      ? {
          OR: [
            { userId },
            ...(email
              ? [{ email: { equals: email.trim().toLowerCase(), mode: "insensitive" } }]
              : []),
          ],
        }
      : {}),
    ...(normalizedStatus !== "ALL" && { status: normalizedStatus }),
    ...(search && {
      OR: [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { teacherId: { contains: search, mode: "insensitive" } },
        { specialization: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const [teachers, total] = await Promise.all([
    db.teacher.findMany({
      where,
      select: {
        id: true,
        teacherId: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        specialization: true,
        qualification: true,
        salary: true,
        status: true,
        joiningDate: true,
        subjects: {
          select: { subject: { select: { id: true, name: true, code: true } } },
        },
        classTeacher: { select: { name: true } },
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.teacher.count({ where }),
  ]);

  return {
    teachers: asPlainArray(teachers).map((teacher) => ({
      id: teacher.id,
      teacherId: teacher.teacherId,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      email: teacher.email,
      phone: teacher.phone,
      specialization: teacher.specialization,
      qualification: teacher.qualification,
      salary: toNullableNumber(teacher.salary),
      status: teacher.status,
      joiningDate: toIsoDate(teacher.joiningDate),
      subjects: asPlainArray(teacher.subjects).map((item) => ({
        subject: {
          id: item.subject.id,
          name: item.subject.name,
          code: item.subject.code,
        },
      })),
      classTeacher: asPlainArray(teacher.classTeacher).map((item) => ({
        name: item.name,
      })),
    })),
    total,
    pages: Math.max(1, Math.ceil(total / limit)),
    page,
  };
}
