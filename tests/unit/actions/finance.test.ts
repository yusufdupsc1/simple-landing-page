import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createFee,
  getFees,
  recordPayment,
  getFinanceSummary,
} from "@/server/actions/finance";
import { db } from "@/lib/db";

vi.mock("@/lib/db", () => ({
  db: {
    fee: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    payment: {
      create: vi.fn(),
      groupBy: vi.fn(),
    },
    student: {
      findFirst: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(vi.fn())),
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: {
      id: "user-123",
      institutionId: "inst-123",
      role: "ADMIN",
    },
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Finance Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (db.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      (callback) => callback(db),
    );
  });

  it("creates a fee for a valid student", async () => {
    (db.student.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "student-123",
    });
    (db.fee.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "fee-1",
    });

    const result = await createFee({
      title: "Tuition Fee",
      amount: 1500,
      dueDate: "2026-03-15",
      term: "Term 1",
      academicYear: "2026-2027",
      feeType: "TUITION",
      studentId: "student-123",
      isRecurring: false,
    });

    expect(result.success).toBe(true);
    expect(db.fee.create).toHaveBeenCalled();
    expect(db.auditLog.create).toHaveBeenCalled();
  });

  it("validates required studentId", async () => {
    const result = await createFee({
      title: "Tuition Fee",
      amount: 1500,
      dueDate: "2026-03-15",
      term: "Term 1",
      academicYear: "2026-2027",
      feeType: "TUITION",
      studentId: "",
      isRecurring: false,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Validation failed");
    expect(result.fieldErrors?.studentId).toBeDefined();
  });

  it("returns mapped fees with student and payments", async () => {
    (db.fee.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: "fee-1",
        title: "Tuition",
        amount: 1200,
        dueDate: new Date("2026-03-15"),
        status: "UNPAID",
        feeType: "TUITION",
        term: "Term 1",
        student: {
          firstName: "Hasib",
          lastName: "Bhuiyan",
          studentId: "STU2026011",
        },
        payments: [],
      },
    ]);
    (db.fee.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);

    const result = await getFees({ page: 1, limit: 20, search: "" });

    expect(result.total).toBe(1);
    expect(result.fees[0]).toMatchObject({
      id: "fee-1",
      student: { firstName: "Hasib", lastName: "Bhuiyan" },
    });
  });

  it("records partial payment and updates fee status", async () => {
    (db.fee.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "fee-1",
      amount: 1000,
      payments: [],
    });
    (db.payment.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "pay-1",
      amount: 400,
    });

    const result = await recordPayment({
      feeId: "fee-1",
      amount: 400,
      method: "ONLINE",
      transactionRef: "TXN-1",
      notes: "partial",
    });

    expect(result.success).toBe(true);
    expect(db.fee.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "PARTIAL" }),
      }),
    );
  });

  it("builds finance summary from aggregates", async () => {
    (db.fee.aggregate as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ _sum: { amount: 10000 }, _count: 10 })
      .mockResolvedValueOnce({ _sum: { amount: 7000 }, _count: 7 })
      .mockResolvedValueOnce({ _sum: { amount: 3000 }, _count: 3 });
    (db.fee.count as ReturnType<typeof vi.fn>).mockResolvedValue(2);
    (db.payment.groupBy as ReturnType<typeof vi.fn>).mockResolvedValue([
      { paidAt: new Date("2026-01-10"), _sum: { amount: 500 } },
    ]);

    const result = await getFinanceSummary();

    expect(result.totalFees).toEqual({ amount: 10000, count: 10 });
    expect(result.paidFees).toEqual({ amount: 7000, count: 7 });
    expect(result.pendingFees).toEqual({ amount: 3000, count: 3 });
    expect(result.overdueCount).toBe(2);
    expect(result.monthlyRevenue[0].amount).toBe(500);
  });
});
