import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createGrade,
  updateGrade,
  deleteGrade,
  getGrades,
  getGradeDistribution,
} from "@/server/actions/grades";
import { db } from "@/lib/db";

vi.mock("@/lib/db", () => ({
  db: {
    grade: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
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

describe("Grades Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (db.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      (callback) => callback(db),
    );
  });

  it("creates grade and computes percentage/letter", async () => {
    (db.student.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "student-1",
    });

    let createCall: any;
    (db.grade.create as ReturnType<typeof vi.fn>).mockImplementation((args) => {
      createCall = args;
      return Promise.resolve({ id: "grade-1", ...args.data });
    });

    const result = await createGrade({
      studentId: "student-1",
      subjectId: "subject-1",
      score: 92,
      maxScore: 100,
      term: "Term 1",
      remarks: "Excellent",
    });

    expect(result.success).toBe(true);
    expect(createCall.data.percentage).toBe(92);
    expect(createCall.data.letterGrade).toBe("A+");
  });

  it("rejects score above maxScore", async () => {
    const result = await createGrade({
      studentId: "student-1",
      subjectId: "subject-1",
      score: 110,
      maxScore: 100,
      term: "Term 1",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Score cannot exceed max score");
  });

  it("updates existing grade", async () => {
    (db.grade.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "grade-1",
      score: 80,
    });

    const result = await updateGrade("grade-1", {
      studentId: "student-1",
      subjectId: "subject-1",
      score: 88,
      maxScore: 100,
      term: "Term 1",
      remarks: "Improved",
    });

    expect(result.success).toBe(true);
    expect(db.grade.update).toHaveBeenCalled();
  });

  it("returns not found when deleting missing grade", async () => {
    (db.grade.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const result = await deleteGrade("missing-id");

    expect(result.success).toBe(false);
    expect(result.error).toContain("not found");
  });

  it("returns mapped grades list", async () => {
    (db.grade.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: "grade-1",
        score: 88,
        maxScore: 100,
        percentage: 88,
        letterGrade: "A",
        term: "Term 1",
        remarks: null,
        student: {
          id: "student-1",
          firstName: "Hasib",
          lastName: "Bhuiyan",
          studentId: "STU-1",
          class: { name: "Class One" },
        },
        subject: { id: "subject-1", name: "Math", code: "MTH" },
      },
    ]);
    (db.grade.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);

    const result = await getGrades({ page: 1, limit: 20, search: "" });

    expect(result.total).toBe(1);
    expect(result.grades[0]).toMatchObject({
      id: "grade-1",
      student: { firstName: "Hasib" },
      subject: { code: "MTH" },
    });
  });

  it("returns grade distribution", async () => {
    (db.grade.groupBy as ReturnType<typeof vi.fn>).mockResolvedValue([
      { letterGrade: "A", _count: 10 },
      { letterGrade: "B", _count: 6 },
    ]);

    const result = await getGradeDistribution();

    expect(result).toEqual([
      { letterGrade: "A", _count: 10 },
      { letterGrade: "B", _count: 6 },
    ]);
  });
});
