// src/server/actions/finance.ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateReceiptNumber } from "@/lib/utils";
import {
  asPlainArray,
  toIsoDate,
  toNumber,
} from "@/lib/server/serializers";
import { createDomainEvent, publishDomainEvent } from "@/server/events/publish";
import { buildStudentVisibilityWhere, isPrivilegedOrStaff } from "@/lib/server/role-scope";

const FeeSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  dueDate: z.string().min(1, "Due date is required"),
  term: z.string().min(1, "Term is required"),
  academicYear: z.string().min(1, "Academic year is required"),
  feeType: z
    .enum([
      "TUITION",
      "TRANSPORT",
      "LIBRARY",
      "LABORATORY",
      "SPORTS",
      "EXAMINATION",
      "UNIFORM",
      "MISC",
    ])
    .default("TUITION"),
  studentId: z.string().min(1, "Student is required"),
  classId: z.string().optional(),
  isRecurring: z.boolean().default(false),
});

const PaymentSchema = z.object({
  feeId: z.string().min(1, "Fee is required"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  method: z
    .enum(["CASH", "CARD", "BANK_TRANSFER", "CHEQUE", "ONLINE", "STRIPE"])
    .default("CASH"),
  transactionRef: z.string().optional(),
  notes: z.string().optional(),
});

export type FeeFormData = z.infer<typeof FeeSchema>;
export type PaymentFormData = z.infer<typeof PaymentSchema>;
const VALID_FEE_STATUSES = [
  "UNPAID",
  "PARTIAL",
  "PAID",
  "OVERDUE",
  "WAIVED",
] as const;

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
    | {
        id?: string;
        institutionId?: string;
        role?: string;
        email?: string | null;
        phone?: string | null;
      }
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

function requireFinanceRole(role: string) {
  if (!["SUPER_ADMIN", "ADMIN", "PRINCIPAL"].includes(role)) {
    throw new Error("Insufficient permissions for finance operations");
  }
}

// ─── Fee CRUD ─────────────────────────────────

export async function createFee(
  formData: FeeFormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { institutionId, role, userId } = await getAuthContext();
    requireFinanceRole(role);

    const parsed = FeeSchema.safeParse(formData);
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

    const student = await db.student.findFirst({
      where: { id: data.studentId, institutionId },
    });
    if (!student) return { success: false, error: "Student not found" };

    const fee = await db.$transaction(async (tx) => {
      const f = await tx.fee.create({
        data: {
          title: data.title,
          description: data.description || null,
          amount: data.amount,
          dueDate: new Date(data.dueDate),
          term: data.term,
          academicYear: data.academicYear,
          feeType: data.feeType,
          isRecurring: data.isRecurring,
          institutionId,
          studentId: data.studentId,
          classId: data.classId || null,
        },
      });

      await tx.auditLog.create({
        data: {
          action: "CREATE",
          entity: "Fee",
          entityId: f.id,
          newValues: {
            title: data.title,
            amount: data.amount,
            studentId: data.studentId,
          },
          userId,
        },
      });

      return f;
    });

    revalidatePath("/dashboard/finance");
    return { success: true, data: { id: fee.id } };
  } catch (error) {
    console.error("[CREATE_FEE]", error);
    return { success: false, error: "Failed to create fee." };
  }
}

export async function recordPayment(
  formData: PaymentFormData,
): Promise<ActionResult<{ id: string; receiptNumber: string }>> {
  try {
    const { institutionId, role, userId } = await getAuthContext();
    requireFinanceRole(role);

    const parsed = PaymentSchema.safeParse(formData);
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

    const fee = await db.fee.findFirst({
      where: { id: data.feeId, institutionId },
      include: { payments: true },
    });
    if (!fee) return { success: false, error: "Fee not found" };

    const totalPaid = fee.payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    );
    const remaining = Number(fee.amount) - totalPaid;

    if (data.amount > remaining + 0.01) {
      return {
        success: false,
        error: `Amount exceeds remaining balance of ${remaining.toFixed(2)}.`,
      };
    }

    const receiptNumber = generateReceiptNumber();

    const payment = await db.$transaction(async (tx) => {
      const p = await tx.payment.create({
        data: {
          amount: data.amount,
          method: data.method,
          transactionRef: data.transactionRef || null,
          receiptNumber,
          notes: data.notes || null,
          institutionId,
          feeId: data.feeId,
        },
      });

      // Update fee status
      const newTotalPaid = totalPaid + data.amount;
      const status =
        newTotalPaid >= Number(fee.amount) - 0.01
          ? "PAID"
          : newTotalPaid > 0
            ? "PARTIAL"
            : "UNPAID";

      await tx.fee.update({ where: { id: data.feeId }, data: { status } });

      await tx.auditLog.create({
        data: {
          action: "PAYMENT",
          entity: "Payment",
          entityId: p.id,
          newValues: {
            amount: data.amount,
            method: data.method,
            receiptNumber,
          },
          userId,
        },
      });

      return p;
    });

    publishDomainEvent(
      createDomainEvent("NotificationCreated", institutionId, {
        channel: "finance",
        title: "Payment recorded",
        body: `Receipt ${receiptNumber} was recorded.`,
        actorId: userId,
        entityId: payment.id,
      }),
    );

    revalidatePath("/dashboard/finance");
    return { success: true, data: { id: payment.id, receiptNumber } };
  } catch (error) {
    console.error("[RECORD_PAYMENT]", error);
    return { success: false, error: "Failed to record payment." };
  }
}

export async function getFees({
  page = 1,
  limit = 20,
  search = "",
  status = "",
  term = "",
}: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  term?: string;
}) {
  const { institutionId, role, userId, email, phone } = await getAuthContext();
  const studentVisibility = await buildStudentVisibilityWhere({
    institutionId,
    role,
    userId,
    email,
    phone,
  });
  const scopedWhere = isPrivilegedOrStaff(role) ? {} : { student: studentVisibility };
  const normalizedStatus = VALID_FEE_STATUSES.includes(
    status as (typeof VALID_FEE_STATUSES)[number],
  )
    ? status
    : "";

  const where: Record<string, unknown> = {
    institutionId,
    ...scopedWhere,
    ...(normalizedStatus && { status: normalizedStatus }),
    ...(term && { term }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { student: { firstName: { contains: search, mode: "insensitive" } } },
        { student: { lastName: { contains: search, mode: "insensitive" } } },
        { student: { studentId: { contains: search, mode: "insensitive" } } },
      ],
    }),
  };

  const [fees, total] = await Promise.all([
    db.fee.findMany({
      where,
      include: {
        student: {
          select: { firstName: true, lastName: true, studentId: true },
        },
        payments: {
          select: {
            amount: true,
            paidAt: true,
            method: true,
            receiptNumber: true,
          },
        },
      },
      orderBy: { dueDate: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.fee.count({ where }),
  ]);

  return {
    fees: asPlainArray(fees).map((fee) => ({
      id: fee.id,
      title: fee.title,
      amount: toNumber(fee.amount),
      dueDate: toIsoDate(fee.dueDate),
      status: fee.status,
      feeType: fee.feeType,
      term: fee.term,
      student: {
        firstName: fee.student.firstName,
        lastName: fee.student.lastName,
        studentId: fee.student.studentId,
      },
      payments: asPlainArray(fee.payments).map((payment) => ({
        amount: toNumber(payment.amount),
        paidAt: toIsoDate(payment.paidAt),
        method: payment.method,
        receiptNumber: payment.receiptNumber,
      })),
    })),
    total,
    pages: Math.max(1, Math.ceil(total / limit)),
    page,
  };
}

export async function getFinanceSummary() {
  const { institutionId, role, userId, email, phone } = await getAuthContext();
  const studentVisibility = await buildStudentVisibilityWhere({
    institutionId,
    role,
    userId,
    email,
    phone,
  });
  const feeScope = isPrivilegedOrStaff(role) ? {} : { student: studentVisibility };
  const paymentScope = isPrivilegedOrStaff(role) ? {} : { fee: { student: studentVisibility } };

  const [totalFees, paidFees, pendingFees, overdueCount] = await Promise.all([
    db.fee.aggregate({
      where: { institutionId, ...feeScope },
      _sum: { amount: true },
      _count: true,
    }),
    db.fee.aggregate({
      where: { institutionId, status: "PAID", ...feeScope },
      _sum: { amount: true },
      _count: true,
    }),
    db.fee.aggregate({
      where: { institutionId, status: { in: ["UNPAID", "PARTIAL"] }, ...feeScope },
      _sum: { amount: true },
      _count: true,
    }),
    db.fee.count({
      where: { institutionId, status: "OVERDUE", ...feeScope },
    }),
  ]);

  // Monthly revenue for current year
  const year = new Date().getFullYear();
  const monthlyRevenue = await db.payment.groupBy({
    by: ["paidAt"],
    where: {
      institutionId,
      ...paymentScope,
      paidAt: {
        gte: new Date(`${year}-01-01`),
        lte: new Date(`${year}-12-31`),
      },
    },
    _sum: { amount: true },
  });

  return {
    totalFees: {
      amount: Number(totalFees._sum.amount ?? 0),
      count: totalFees._count,
    },
    paidFees: {
      amount: Number(paidFees._sum.amount ?? 0),
      count: paidFees._count,
    },
    pendingFees: {
      amount: Number(pendingFees._sum.amount ?? 0),
      count: pendingFees._count,
    },
    overdueCount,
    monthlyRevenue: asPlainArray(monthlyRevenue).map((row) => ({
      paidAt: toIsoDate(row.paidAt),
      amount: toNumber(row._sum.amount),
    })),
  };
}
