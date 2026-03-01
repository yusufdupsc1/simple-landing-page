import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  markAttendance,
  getAttendanceForClass,
  getAttendanceSummary,
  getAttendanceTrend,
} from "@/server/actions/attendance";
import { db } from "@/lib/db";

vi.mock("@/lib/db", () => ({
  db: {
    attendance: {
      upsert: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    student: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    class: {
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

describe("Attendance Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (db.$transaction as ReturnType<typeof vi.fn>).mockImplementation((callback) => callback(db));
  });

  it("marks attendance for entries", async () => {
    (db.class.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "class-1" });
    (db.student.count as ReturnType<typeof vi.fn>).mockResolvedValue(2);

    const result = await markAttendance({
      classId: "class-1",
      date: "2026-02-01",
      entries: [
        { studentId: "student-1", status: "PRESENT" },
        { studentId: "student-2", status: "ABSENT" },
      ],
    });

    expect(result.success).toBe(true);
    expect(db.attendance.upsert).toHaveBeenCalledTimes(2);
  });

  it("returns class not found", async () => {
    (db.class.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const result = await markAttendance({
      classId: "missing",
      date: "2026-02-01",
      entries: [{ studentId: "student-1", status: "PRESENT" }],
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Class not found");
  });

  it("validates attendance entries", async () => {
    const result = await markAttendance({
      classId: "class-1",
      date: "2026-02-01",
      entries: [],
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Validation failed");
    expect(result.fieldErrors?.entries).toBeDefined();
  });

  it("returns merged attendance for a class/date", async () => {
    (db.student.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: "student-1", studentId: "STU-1", firstName: "Hasib", lastName: "Bhuiyan", photo: null },
      { id: "student-2", studentId: "STU-2", firstName: "Ashik", lastName: "Biswas", photo: null },
    ]);
    (db.attendance.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { studentId: "student-1", status: "PRESENT", remarks: null },
    ]);

    const result = await getAttendanceForClass({ classId: "class-1", date: "2026-02-01" });

    expect(result).toHaveLength(2);
    expect(result[0].attendance).toMatchObject({ status: "PRESENT" });
    expect(result[1].attendance).toBeNull();
  });

  it("returns attendance summary", async () => {
    (db.attendance.groupBy as ReturnType<typeof vi.fn>).mockResolvedValue([
      { status: "PRESENT", _count: 25 },
      { status: "ABSENT", _count: 3 },
      { status: "LATE", _count: 2 },
    ]);

    const result = await getAttendanceSummary({
      startDate: "2026-02-01",
      endDate: "2026-02-28",
    });

    expect(result.total).toBe(30);
    expect(result.presentRate).toBe(83);
    expect(result.absent).toBe(3);
  });

  it("returns attendance trend", async () => {
    (db.attendance.groupBy as ReturnType<typeof vi.fn>).mockResolvedValue([
      { date: new Date("2026-02-01"), status: "PRESENT", _count: 22 },
    ]);

    const result = await getAttendanceTrend({ days: 30 });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ status: "PRESENT", _count: 22 });
    expect(result[0].date).toContain("2026-02-01");
  });
});
