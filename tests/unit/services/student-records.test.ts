import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMock = {
  institution: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
  student: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
  grade: {
    findMany: vi.fn(),
  },
  attendance: {
    groupBy: vi.fn(),
  },
  studentRecord: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    findMany: vi.fn(),
  },
};

vi.mock("@/lib/db", () => ({
  db: dbMock,
}));

const { generateStudentRecord, generatePeriodicRecords } =
  await import("@/server/services/student-records/generate");

describe("student records generation service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reuses existing record when not regenerating", async () => {
    const existing = {
      id: "record-1",
      studentId: "student-1",
      title: "Result Sheet Report",
      fileName: "result.pdf",
      fileUrl: "data:application/pdf;base64,AAA",
      periodType: "MONTHLY",
      periodLabel: "2026-01",
      recordType: "RESULT_SHEET",
      source: "MANUAL",
      generatedByUserId: "user-1",
      generatedAt: new Date(),
      metadata: {},
      institutionId: "inst-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    dbMock.studentRecord.findUnique.mockResolvedValue(existing);

    const result = await generateStudentRecord({
      institutionId: "inst-1",
      studentId: "student-1",
      recordType: "RESULT_SHEET",
      periodType: "MONTHLY",
      periodLabel: "2026-01",
      regenerate: false,
    });

    expect(result.created).toBe(false);
    expect(result.record.id).toBe("record-1");
    expect(dbMock.studentRecord.create).not.toHaveBeenCalled();
    expect(dbMock.studentRecord.update).not.toHaveBeenCalled();
  });

  it("creates record when missing", async () => {
    dbMock.studentRecord.findUnique.mockResolvedValue(null);
    dbMock.institution.findUnique.mockResolvedValue({
      id: "inst-1",
      name: "Dhadash Demo",
      address: "Dhaka",
      settings: {
        signatoryName: "Md. Abdul Karim",
        signatoryTitle: "Principal",
        coSignatoryName: null,
        coSignatoryTitle: null,
        certificateFooter: "Issued by school",
      },
    });
    dbMock.student.findFirst.mockResolvedValue({
      id: "student-1",
      studentId: "STU-0001",
      firstName: "Ayaan",
      lastName: "Rahman",
      class: { name: "Class One" },
    });
    dbMock.grade.findMany.mockResolvedValue([]);
    dbMock.attendance.groupBy.mockResolvedValue([]);
    dbMock.studentRecord.create.mockResolvedValue({
      id: "record-2",
      studentId: "student-1",
      title: "Result Sheet Report",
      fileName: "stu-0001-result-sheet-2026-01.pdf",
      fileUrl: "data:application/pdf;base64,AAA",
      periodType: "MONTHLY",
      periodLabel: "2026-01",
      recordType: "RESULT_SHEET",
      source: "MANUAL",
      generatedByUserId: null,
      generatedAt: new Date(),
      metadata: {},
      institutionId: "inst-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await generateStudentRecord({
      institutionId: "inst-1",
      studentId: "student-1",
      recordType: "RESULT_SHEET",
      periodType: "MONTHLY",
      periodLabel: "2026-01",
      regenerate: false,
    });

    expect(result.created).toBe(true);
    expect(dbMock.studentRecord.create).toHaveBeenCalledOnce();
  });

  it("keeps cron idempotent when records already exist", async () => {
    dbMock.institution.findMany.mockResolvedValue([{ id: "inst-1" }]);
    dbMock.student.findMany.mockResolvedValue([{ id: "student-1" }]);
    dbMock.studentRecord.findUnique.mockResolvedValue({
      id: "record-existing",
      studentId: "student-1",
      title: "Weekly Progress Record",
      fileName: "weekly.pdf",
      fileUrl: "data:application/pdf;base64,AAA",
      periodType: "WEEKLY",
      periodLabel: "2026-W08",
      recordType: "WEEKLY_PROGRESS",
      source: "CRON",
      generatedByUserId: null,
      generatedAt: new Date(),
      metadata: {},
      institutionId: "inst-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await generatePeriodicRecords({
      periodType: "WEEKLY",
      periodLabel: "2026-W08",
      recordTypes: ["WEEKLY_PROGRESS"],
    });

    expect(result.generated).toBe(0);
    expect(result.reused).toBe(1);
    expect(result.failed).toBe(0);
  });
});
