import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isGovtPrimaryModeEnabled, PRIMARY_GRADES } from "@/lib/config";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ classId?: string; date?: string }>;
}

export default async function AttendancePrintPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await auth();
  const currentUser = session?.user as
    | { id?: string; institutionId?: string }
    | undefined;
  const institutionId = currentUser?.institutionId;

  if (!institutionId) {
    redirect("/auth/login");
  }

  const classId = params.classId;
  const dateParam = params.date;

  if (!classId || !dateParam) {
    return (
      <main className="print-a4 p-4">
        <p className="text-sm">Missing class/date parameters.</p>
      </main>
    );
  }

  const date = new Date(dateParam);
  date.setHours(0, 0, 0, 0);

  const [institution, classroom, studentsRaw, attendanceRows] = await Promise.all([
    db.institution.findUnique({
      where: { id: institutionId },
      select: { name: true, address: true },
    }),
    db.class.findFirst({
      where: {
        id: classId,
        institutionId,
        isActive: true,
        ...(isGovtPrimaryModeEnabled() ? { grade: { in: [...PRIMARY_GRADES] } } : {}),
      },
      select: { id: true, name: true, grade: true, section: true },
    }),
    db.student.findMany({
      where: { institutionId, classId, status: "ACTIVE" },
      select: {
        id: true,
        rollNo: true,
        firstName: true,
        lastName: true,
      },
    }),
    db.attendance.findMany({
      where: { institutionId, classId, date },
      select: { studentId: true, status: true },
    }),
  ]);

  if (!classroom) {
    return (
      <main className="print-a4 p-4">
        <p className="text-sm">Class not found.</p>
      </main>
    );
  }

  const attendanceMap = new Map(attendanceRows.map((row) => [row.studentId, row.status]));
  const students = [...studentsRaw].sort((a, b) => {
    const rollA = Number.parseInt(a.rollNo ?? "", 10);
    const rollB = Number.parseInt(b.rollNo ?? "", 10);
    const aHasRoll = Number.isFinite(rollA);
    const bHasRoll = Number.isFinite(rollB);

    if (aHasRoll && bHasRoll && rollA !== rollB) return rollA - rollB;
    if (aHasRoll !== bHasRoll) return aHasRoll ? -1 : 1;

    const nameA = `${a.firstName} ${a.lastName}`.trim().toLowerCase();
    const nameB = `${b.firstName} ${b.lastName}`.trim().toLowerCase();
    return nameA.localeCompare(nameB);
  });

  const statusLabel: Record<string, string> = {
    PRESENT: "Present",
    ABSENT: "Absent",
    LATE: "Late",
    EXCUSED: "Excused",
    HOLIDAY: "Holiday",
  };

  if (currentUser?.id) {
    try {
      await db.auditLog.create({
        data: {
          action: "PRINT_ATTENDANCE_REGISTER",
          entity: "AttendanceRegister",
          entityId: classroom.id,
          newValues: {
            classId: classId,
            date: dateParam,
          },
          userId: currentUser.id,
        },
      });
    } catch (error) {
      console.error("[ATTENDANCE_PRINT_AUDIT]", error);
    }
  }

  return (
    <main className="print-a4 text-slate-900">
      <header className="mb-4 border-b border-slate-300 pb-3 text-center">
        <h1 className="text-xl font-bold">উপস্থিতি রেজিস্টার</h1>
        <p className="text-xs text-slate-600">Attendance Register</p>
        <p className="mt-2 text-sm font-semibold">{institution?.name ?? "Dhadash School"}</p>
        <p className="text-xs text-slate-600">{institution?.address ?? "Bangladesh"}</p>
      </header>

      <section className="mb-4 grid grid-cols-2 gap-2 text-sm">
        <p>
          <span className="font-semibold">শ্রেণি:</span> Class {classroom.grade}
        </p>
        <p>
          <span className="font-semibold">Section:</span> {classroom.section}
        </p>
        <p>
          <span className="font-semibold">Class Name:</span> {classroom.name}
        </p>
        <p>
          <span className="font-semibold">Date:</span> {dateParam}
        </p>
      </section>

      <table className="attendance-print-table w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="text-left">Roll</th>
            <th className="text-left">Student Name</th>
            <th className="text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => {
            const status = String(attendanceMap.get(student.id) ?? "PRESENT");

            return (
              <tr key={student.id}>
                <td>{student.rollNo?.trim() || "-"}</td>
                <td>
                  {student.firstName} {student.lastName}
                </td>
                <td>{statusLabel[status] ?? status}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <footer className="attendance-signatures mt-10 grid grid-cols-2 gap-8 text-center text-sm">
        <div>
          <p className="signature-line">....................................</p>
          <p className="font-semibold">প্রধান শিক্ষক</p>
          <p className="text-xs text-slate-600">Head Teacher</p>
        </div>
        <div>
          <p className="signature-line">....................................</p>
          <p className="font-semibold">শ্রেণি শিক্ষক</p>
          <p className="text-xs text-slate-600">Class Teacher</p>
        </div>
      </footer>
    </main>
  );
}
