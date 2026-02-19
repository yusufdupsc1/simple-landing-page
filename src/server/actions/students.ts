// src/server/actions/students.ts
// Server Actions — Students CRUD (Next.js 16 Server Actions)
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

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

type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

// ─── Helper: get session + institution ─────
async function getAuthContext() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return {
    userId: session.user.id,
    institutionId: session.user.institutionId,
    role: session.user.role,
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
  formData: StudentFormData
): Promise<ActionResult<{ id: string; studentId: string }>> {
  try {
    const { institutionId, userId } = await getAuthContext();
    const parsed = StudentSchema.safeParse(formData);

    if (!parsed.success) {
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const data = parsed.data;
    const studentId = await generateStudentId(institutionId);

    const student = await db.$transaction(async (tx) => {
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
          newValues: { studentId, firstName: data.firstName, lastName: data.lastName },
          userId,
        },
      });

      return s;
    });

    revalidatePath("/dashboard/students");
    return { success: true, data: { id: student.id, studentId: student.studentId } };
  } catch (error) {
    console.error("[CREATE_STUDENT]", error);
    return { success: false, error: "Failed to create student. Please try again." };
  }
}

// ─── UPDATE ─────────────────────────────────
export async function updateStudent(
  id: string,
  formData: StudentFormData
): Promise<ActionResult> {
  try {
    const { institutionId, userId } = await getAuthContext();
    const parsed = StudentSchema.safeParse(formData);

    if (!parsed.success) {
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
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
          oldValues: { firstName: existing.firstName, lastName: existing.lastName },
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
  const { institutionId } = await getAuthContext();

  const where = {
    institutionId,
    ...(status !== "ALL" && { status: status as any }),
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
    students,
    total,
    pages: Math.ceil(total / limit),
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
    db.attendance.count({ where: { institutionId, date: today, status: "PRESENT" } }),
    db.fee.aggregate({
      where: { institutionId, status: { in: ["UNPAID", "PARTIAL", "OVERDUE"] } },
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
      amount: pendingFees._sum.amount ?? 0,
      count: pendingFees._count,
    },
    recentStudents,
  };
}
