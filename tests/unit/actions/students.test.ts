import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createStudent,
  updateStudent,
  deleteStudent,
  getStudents,
  getDashboardStats,
} from "@/server/actions/students";
import { db } from "@/lib/db";
import { provisionRoleUser } from "@/server/services/user-provisioning";

vi.mock("@/server/services/user-provisioning", () => ({
  provisionRoleUser: vi.fn().mockResolvedValue({
    userId: "user-provisioned",
    credential: null,
  }),
}));

vi.mock("@/lib/db", () => ({
  db: {
    student: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    class: {
      findFirst: vi.fn(),
    },
    parent: {
      create: vi.fn(),
    },
    teacher: {
      count: vi.fn(),
    },
    attendance: {
      count: vi.fn(),
    },
    fee: {
      aggregate: vi.fn(),
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

vi.mock("@/lib/config", () => ({
  isGovtPrimaryModeEnabled: vi.fn().mockReturnValue(false),
  PRIMARY_GRADES: ["1", "2", "3", "4", "5"],
}));

describe("Students Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (db.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      (callback) => callback(db),
    );
  });

  it("creates a student and provisions student user when email exists", async () => {
    (db.student.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);
    (db.class.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "class-1",
      grade: "1",
    });
    (db.student.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "student-1",
      studentId: "STU-2026-0001",
    });

    const result = await createStudent({
      firstName: "Hasib",
      lastName: "Bhuiyan",
      email: "hasib@student.school.edu",
      gender: "MALE",
      dateOfBirth: "2010-01-15",
      classId: "class-1",
      fatherName: "Karim",
      motherName: "Rokeya",
      guardianPhone: "01710000000",
    });

    expect(result.success).toBe(true);
    expect(db.student.create).toHaveBeenCalled();
    expect(provisionRoleUser).toHaveBeenCalled();
  });

  it("validates create payload", async () => {
    const result = await createStudent({
      firstName: "",
      lastName: "",
      email: "invalid",
    } as any);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Validation failed");
    expect(result.fieldErrors).toBeDefined();
  });

  it("updates existing student", async () => {
    (db.student.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "student-1",
    });
    (db.class.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "class-1",
      grade: "1",
    });

    const result = await updateStudent("student-1", {
      firstName: "Hasib",
      lastName: "Bhuiyan",
      email: "hasib@student.school.edu",
      gender: "MALE",
      dateOfBirth: "2010-01-15",
      classId: "class-1",
      fatherName: "Karim",
      motherName: "Rokeya",
      guardianPhone: "01710000000",
    });

    expect(result.success).toBe(true);
    expect(db.student.update).toHaveBeenCalled();
  });

  it("deactivates an existing student", async () => {
    (db.student.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "student-1",
    });

    const result = await deleteStudent("student-1");

    expect(result.success).toBe(true);
    expect(db.student.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "INACTIVE" } }),
    );
  });

  it("returns paginated students", async () => {
    (db.student.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: "student-1",
        studentId: "STU-2026-0001",
        firstName: "Hasib",
        lastName: "Bhuiyan",
        email: "hasib@student.school.edu",
        phone: null,
        dateOfBirth: new Date("2010-01-15"),
        gender: "MALE",
        address: null,
        city: null,
        country: null,
        classId: "class-1",
        status: "ACTIVE",
        createdAt: new Date("2026-01-01"),
        class: { name: "Class One", grade: "1", section: "A" },
        parents: [],
      },
    ]);
    (db.student.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);

    const result = await getStudents({ page: 1, limit: 20, search: "" });

    expect(result.total).toBe(1);
    expect(result.students[0]).toMatchObject({
      id: "student-1",
      firstName: "Hasib",
      class: { name: "Class One" },
    });
  });

  it("returns dashboard stats", async () => {
    (db.student.count as ReturnType<typeof vi.fn>).mockResolvedValue(120);
    (db.teacher.count as ReturnType<typeof vi.fn>).mockResolvedValue(16);
    (db.attendance.count as ReturnType<typeof vi.fn>).mockResolvedValue(90);
    (db.fee.aggregate as ReturnType<typeof vi.fn>).mockResolvedValue({
      _sum: { amount: 50000 },
      _count: 22,
    });
    (db.student.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: "student-1",
        firstName: "Hasib",
        lastName: "Bhuiyan",
        studentId: "STU-2026-0001",
        createdAt: new Date("2026-01-01"),
        class: { name: "Class One" },
      },
    ]);

    const result = await getDashboardStats();

    expect(result.totalStudents).toBe(120);
    expect(result.totalTeachers).toBe(16);
    expect(result.pendingFees).toEqual({ amount: 50000, count: 22 });
    expect(result.recentStudents).toHaveLength(1);
  });
});
