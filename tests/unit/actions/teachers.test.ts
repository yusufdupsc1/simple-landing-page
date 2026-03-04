import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createTeacher,
  updateTeacher,
  deleteTeacher,
  getTeachers,
} from "@/server/actions/teachers";
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
    teacher: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    teacherSubject: {
      createMany: vi.fn(),
      deleteMany: vi.fn(),
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

describe("Teachers Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (db.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      (callback) => callback(db),
    );
  });

  const validTeacher = {
    firstName: "Emily",
    lastName: "Thompson",
    email: "emily@school.edu",
    gender: "FEMALE" as const,
    dateOfBirth: "1988-06-10",
    phone: "+8801000000000",
    specialization: "English",
    qualification: "M.Ed",
    salary: "70000",
    joiningDate: "2026-01-05",
    status: "ACTIVE" as const,
  };

  it("creates a teacher with generated teacher ID", async () => {
    (db.teacher.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);
    (db.teacher.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (db.teacher.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "teacher-1",
      teacherId: "TCH-2026-001",
    });

    const result = await createTeacher(validTeacher);

    expect(result.success).toBe(true);
    expect(provisionRoleUser).toHaveBeenCalled();
    expect(db.teacher.create).toHaveBeenCalled();
  });

  it("prevents duplicate teacher email", async () => {
    (db.teacher.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);
    (db.teacher.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "existing",
    });

    const result = await createTeacher(validTeacher);

    expect(result.success).toBe(false);
    expect(result.error).toContain("already exists");
  });

  it("updates an existing teacher", async () => {
    (db.teacher.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "teacher-1",
      firstName: "Emily",
      lastName: "Thompson",
    });

    const result = await updateTeacher("teacher-1", {
      ...validTeacher,
      firstName: "Emma",
      salary: "75000",
      subjectIds: ["subject-1"],
    });

    expect(result.success).toBe(true);
    expect(db.teacher.update).toHaveBeenCalled();
    expect(db.teacherSubject.deleteMany).toHaveBeenCalled();
    expect(db.teacherSubject.createMany).toHaveBeenCalled();
  });

  it("deactivates teacher", async () => {
    (db.teacher.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "teacher-1",
    });

    const result = await deleteTeacher("teacher-1");

    expect(result.success).toBe(true);
    expect(db.teacher.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "INACTIVE" } }),
    );
  });

  it("returns mapped teacher list", async () => {
    (db.teacher.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: "teacher-1",
        teacherId: "TCH-2026-001",
        firstName: "Emily",
        lastName: "Thompson",
        email: "emily@school.edu",
        phone: null,
        specialization: "English",
        qualification: "M.Ed",
        salary: 70000,
        status: "ACTIVE",
        joiningDate: new Date("2026-01-05"),
        subjects: [{ subject: { id: "sub-1", name: "English", code: "ENG" } }],
        classTeacher: [{ name: "Class One" }],
      },
    ]);
    (db.teacher.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);

    const result = await getTeachers({ page: 1, limit: 20, search: "" });

    expect(result.total).toBe(1);
    expect(result.teachers[0]).toMatchObject({
      id: "teacher-1",
      firstName: "Emily",
      subjects: [{ subject: { code: "ENG" } }],
    });
  });

  it("applies status filter", async () => {
    (db.teacher.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (db.teacher.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);

    await getTeachers({ page: 1, status: "ACTIVE" });

    expect(db.teacher.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: "ACTIVE" }),
      }),
    );
  });
});
