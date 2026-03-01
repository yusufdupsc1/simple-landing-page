// src/server/actions/students.ts
// Server Actions — Students CRUD (Next.js 16 Server Actions)
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { asPlainArray, toIsoDate } from "@/lib/server/serializers";
import {
  provisionRoleUser,
  type ProvisionedCredential,
} from "@/server/services/user-provisioning";
import { buildStudentVisibilityWhere, isPrivilegedOrStaff } from "@/lib/server/role-scope";

// ─── Schemas ───────────────────────────────
const StudentSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  classId: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  parentFirstName: z.string().optional(),
  parentLastName: z.string().optional(),
  parentEmail: z.string().email().optional().or(z.literal("")),
  parentPhone: z.string().optional(),
  parentRelation: z.string().optional(),
});

export type StudentFormData = z.infer<typeof StudentSchema>;
const VALID_STUDENT_STATUSES = [
  "ACTIVE",
  "INACTIVE",
  "GRADUATED",
  "SUSPENDED",
  "EXPELLED",
  "TRANSFERRED",
] as const;
type StudentStatus = (typeof VALID_STUDENT_STATUSES)[number];

type ActionResult<T = void> =
  | { success: true; data?: T; error?: never }
  | {
    success: false;
    error: string;
    fieldErrors?: Record<string, string[]>;
    data?: never;
  };

// ─── Helper: get session + institution ─────
async function getAuthContext() {
  const session = await auth();
  const user = session?.user as
    | { id?: string; institutionId?: string; role?: string; email?: string | null; phone?: string | null }
    | undefined;

  if (!user?.id || !user.institutionId || !user.role) {
    throw new Error("Unauthorized");
  }
  return {
    userId: user.id,
    institutionId: user.institutionId,
    role: user.role,
    email: user.email,
    phone: user.phone,
  };
}

// ─── Generate Student ID ────────────────────
async function generateStudentId(institutionId: string): Promise<string> {
  const year = new Date().getFullYear();
  const count = await db.student.count({ where: { institutionId } });
  return `STU-${year}-${String(count + 1).padStart(4, "0")}`;
}

// ─── CREATE ─────────────────────────────────
export async function createStudent(
  formData: StudentFormData,
): Promise<
  ActionResult<{
    id: string;
    studentId: string;
    studentCredential?: ProvisionedCredential | null;
    parentCredential?: ProvisionedCredential | null;
  }>
> {
  try {
    const { institutionId, userId, role } = await getAuthContext();
    if (!isPrivilegedOrStaff(role)) {
      return { success: false, error: "Insufficient permissions" };
    }
    const parsed = StudentSchema.safeParse(formData);

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
    const studentId = await generateStudentId(institutionId);

    const student = await db.$transaction(async (tx) => {
      const studentName = `${data.firstName} ${data.lastName}`.trim();
      let studentCredential: ProvisionedCredential | null = null;
      let parentCredential: ProvisionedCredential | null = null;

      if (data.email) {
        const provisionedStudent = await provisionRoleUser({
          tx,
          institutionId,
          role: "STUDENT",
          email: data.email,
          displayName: studentName,
          passwordSeed: studentId,
        });
        studentCredential = provisionedStudent.credential;
      }

      const s = await tx.student.create({
        data: {
          studentId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email || null,
          phone: data.phone || null,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
          gender: data.gender || null,
          address: data.address || null,
          city: data.city || null,
          country: data.country || null,
          classId: data.classId || null,
          institutionId,
        },
      });

      // Create parent if provided
      if (data.parentFirstName && data.parentLastName) {
        const parentName = `${data.parentFirstName} ${data.parentLastName}`.trim();
        if (data.parentEmail) {
          const provisionedParent = await provisionRoleUser({
            tx,
            institutionId,
            role: "PARENT",
            email: data.parentEmail,
            displayName: parentName,
            passwordSeed: `${studentId}-guardian`,
          });
          parentCredential = provisionedParent.credential;
        }

        await tx.parent.create({
          data: {
            firstName: data.parentFirstName,
            lastName: data.parentLastName,
            email: data.parentEmail || `parent-${s.id}@noreply.local`,
            phone: data.parentPhone || null,
            relation: data.parentRelation || "Parent",
            studentId: s.id,
          },
        });
      }

      // Audit log
      await tx.auditLog.create({
        data: {
          action: "CREATE",
          entity: "Student",
          entityId: s.id,
          newValues: {
            studentId,
            firstName: data.firstName,
            lastName: data.lastName,
          },
          userId,
        },
      });

      return {
        student: s,
        studentCredential,
        parentCredential,
      };
    });

    revalidatePath("/dashboard/students");
    return {
      success: true,
      data: {
        id: student.student.id,
        studentId: student.student.studentId,
        studentCredential: student.studentCredential,
        parentCredential: student.parentCredential,
      },
    };
  } catch (error) {
    console.error("[CREATE_STUDENT]", error);
    return {
      success: false,
      error: "Failed to create student. Please try again.",
    };
  }
}

// ─── UPDATE ─────────────────────────────────
export async function updateStudent(
  id: string,
  formData: StudentFormData,
): Promise<ActionResult> {
  try {
    const { institutionId, userId, role } = await getAuthContext();
    if (!isPrivilegedOrStaff(role)) {
      return { success: false, error: "Insufficient permissions" };
    }
    const parsed = StudentSchema.safeParse(formData);

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

    const existing = await db.student.findFirst({
      where: { id, institutionId },
    });

    if (!existing) {
      return { success: false, error: "Student not found" };
    }

    const data = parsed.data;

    await db.$transaction(async (tx) => {
      await tx.student.update({
        where: { id },
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email || null,
          phone: data.phone || null,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
          gender: data.gender || null,
          address: data.address || null,
          city: data.city || null,
          classId: data.classId || null,
        },
      });

      await tx.auditLog.create({
        data: {
          action: "UPDATE",
          entity: "Student",
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

    revalidatePath("/dashboard/students");
    revalidatePath(`/dashboard/students/${id}`);
    return { success: true };
  } catch (error) {
    console.error("[UPDATE_STUDENT]", error);
    return { success: false, error: "Failed to update student." };
  }
}

// ─── DELETE ─────────────────────────────────
export async function deleteStudent(id: string): Promise<ActionResult> {
  try {
    const { institutionId, role, userId } = await getAuthContext();

    if (!["SUPER_ADMIN", "ADMIN", "PRINCIPAL"].includes(role)) {
      return { success: false, error: "Insufficient permissions" };
    }

    const student = await db.student.findFirst({
      where: { id, institutionId },
    });

    if (!student) {
      return { success: false, error: "Student not found" };
    }

    await db.$transaction(async (tx) => {
      await tx.student.update({
        where: { id },
        data: { status: "INACTIVE" },
      });

      await tx.auditLog.create({
        data: {
          action: "DEACTIVATE",
          entity: "Student",
          entityId: id,
          userId,
        },
      });
    });

    revalidatePath("/dashboard/students");
    return { success: true };
  } catch (error) {
    console.error("[DELETE_STUDENT]", error);
    return { success: false, error: "Failed to delete student." };
  }
}

export async function setStudentStatus(
  id: string,
  status: Extract<StudentStatus, "ACTIVE" | "INACTIVE">,
): Promise<ActionResult> {
  try {
    const { institutionId, role, userId } = await getAuthContext();

    if (!["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "STAFF"].includes(role)) {
      return { success: false, error: "Insufficient permissions" };
    }

    const student = await db.student.findFirst({
      where: { id, institutionId },
      select: { id: true, status: true },
    });
    if (!student) {
      return { success: false, error: "Student not found" };
    }

    await db.$transaction(async (tx) => {
      await tx.student.update({
        where: { id },
        data: { status },
      });
      await tx.auditLog.create({
        data: {
          action: status === "ACTIVE" ? "ACTIVATE" : "DEACTIVATE",
          entity: "Student",
          entityId: id,
          oldValues: { status: student.status },
          newValues: { status },
          userId,
        },
      });
    });

    revalidatePath("/dashboard/students");
    return { success: true };
  } catch (error) {
    console.error("[SET_STUDENT_STATUS]", error);
    return { success: false, error: "Failed to update student status." };
  }
}

// ─── GET STUDENTS (paginated) ────────────────
export async function getStudents({
  page = 1,
  limit = 20,
  search = "",
  classId = "",
  status = "ACTIVE",
}: {
  page?: number;
  limit?: number;
  search?: string;
  classId?: string;
  status?: string;
}) {
  const { institutionId, role, userId, email, phone } = await getAuthContext();
  const normalizedStatus =
    status === "ALL" ||
    VALID_STUDENT_STATUSES.includes(
      status as (typeof VALID_STUDENT_STATUSES)[number],
    )
      ? status
      : "ACTIVE";

  const where: Record<string, unknown> = {
    institutionId,
    ...(await buildStudentVisibilityWhere({
      institutionId,
      role,
      userId,
      email,
      phone,
    })),
    ...(normalizedStatus !== "ALL" && { status: normalizedStatus }),
    ...(classId && { classId }),
    ...(search && {
      OR: [
        { firstName: { contains: search, mode: "insensitive" as const } },
        { lastName: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
        { studentId: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [students, total] = await Promise.all([
    db.student.findMany({
      where,
      include: {
        class: { select: { name: true, grade: true, section: true } },
        parents: { select: { firstName: true, lastName: true, phone: true } },
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.student.count({ where }),
  ]);

  return {
    students: asPlainArray(students).map((student) => ({
      id: student.id,
      studentId: student.studentId,
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      phone: student.phone,
      dateOfBirth: toIsoDate(student.dateOfBirth),
      gender: student.gender,
      address: student.address,
      city: student.city,
      country: student.country,
      classId: student.classId,
      status: student.status,
      createdAt: toIsoDate(student.createdAt),
      class: student.class
        ? {
            name: student.class.name,
            grade: student.class.grade,
            section: student.class.section,
          }
        : null,
    })),
    total,
    pages: Math.max(1, Math.ceil(total / limit)),
    page,
  };
}

// ─── GET DASHBOARD STATS ─────────────────────
export async function getDashboardStats() {
  const { institutionId } = await getAuthContext();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalStudents,
    totalTeachers,
    todayAttendance,
    pendingFees,
    recentStudents,
  ] = await Promise.all([
    db.student.count({ where: { institutionId, status: "ACTIVE" } }),
    db.teacher.count({ where: { institutionId, status: "ACTIVE" } }),
    db.attendance.count({
      where: { institutionId, date: today, status: "PRESENT" },
    }),
    db.fee.aggregate({
      where: {
        institutionId,
        status: { in: ["UNPAID", "PARTIAL", "OVERDUE"] },
      },
      _sum: { amount: true },
      _count: true,
    }),
    db.student.findMany({
      where: { institutionId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        studentId: true,
        createdAt: true,
        class: { select: { name: true } },
      },
    }),
  ]);

  return {
    totalStudents,
    totalTeachers,
    todayAttendance,
    pendingFees: {
      amount: Number(pendingFees._sum.amount ?? 0),
      count: pendingFees._count,
    },
    recentStudents: asPlainArray(recentStudents).map((student) => ({
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      studentId: student.studentId,
      createdAt: toIsoDate(student.createdAt),
      class: student.class ? { name: student.class.name } : null,
    })),
  };
}
