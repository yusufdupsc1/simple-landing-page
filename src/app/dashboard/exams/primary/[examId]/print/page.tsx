import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isGovtPrimaryModeEnabled } from "@/lib/config";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ examId: string }>;
}

const PRIMARY_EXAM_GRADES = new Set(["1", "2", "3", "4", "5"]);
const PASS_MARK_THRESHOLD = 33;

function normalizeSubjects(subjectsText: string): string[] {
  const seen = new Set<string>();
  const subjects: string[] = [];

  for (const raw of subjectsText.split(/[\n,]/g)) {
    const subject = raw.trim();
    if (!subject) continue;
    const key = subject.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    subjects.push(subject);
  }

  return subjects;
}

type MarkCell = {
  score: number | null;
  isAbsent: boolean;
  isMissing: boolean;
};

function getResultStatus(cells: MarkCell[]): "PASS" | "FAIL" | "INCOMPLETE" {
  if (cells.some((cell) => cell.isMissing)) return "INCOMPLETE";
  if (cells.some((cell) => cell.isAbsent || (typeof cell.score === "number" && cell.score < PASS_MARK_THRESHOLD))) {
    return "FAIL";
  }
  return "PASS";
}

export default async function PrimaryExamPrintPage({ params }: PageProps) {
  if (!isGovtPrimaryModeEnabled()) {
    redirect("/dashboard/grades");
  }

  const { examId } = await params;
  const session = await auth();
  const user = session?.user as { institutionId?: string } | undefined;

  if (!user?.institutionId) {
    redirect("/auth/login");
  }

  const [institution, exam] = await Promise.all([
    db.institution.findUnique({
      where: { id: user.institutionId },
      select: { name: true, address: true },
    }),
    db.primaryExam.findFirst({
      where: {
        id: examId,
        institutionId: user.institutionId,
      },
      select: {
        id: true,
        name: true,
        year: true,
        subjectsText: true,
        classId: true,
        class: {
          select: {
            id: true,
            name: true,
            grade: true,
            section: true,
          },
        },
      },
    }),
  ]);

  if (!exam || !PRIMARY_EXAM_GRADES.has(exam.class.grade)) {
    return (
      <main className="print-a4 p-4">
        <p className="text-sm">Exam not found.</p>
      </main>
    );
  }

  const subjects = normalizeSubjects(exam.subjectsText);

  const [students, marks] = await Promise.all([
    db.student.findMany({
      where: {
        institutionId: user.institutionId,
        classId: exam.classId,
        status: "ACTIVE",
      },
      select: {
        id: true,
        studentId: true,
        firstName: true,
        lastName: true,
        studentNameEn: true,
        studentNameBn: true,
        rollNo: true,
      },
      orderBy: [{ rollNo: "asc" }, { firstName: "asc" }, { lastName: "asc" }],
    }),
    db.primaryExamMark.findMany({
      where: {
        institutionId: user.institutionId,
        examId: exam.id,
      },
      select: {
        studentId: true,
        subjectName: true,
        score: true,
        isAbsent: true,
      },
    }),
  ]);

  const markMap = new Map<string, { score: number | null; isAbsent: boolean }>(
    marks.map((mark) => [
      `${mark.studentId}::${mark.subjectName}`,
      {
        score: mark.score,
        isAbsent: mark.isAbsent,
      },
    ]),
  );

  const rows = students.map((student) => {
    const scores = subjects.map((subject) => {
      const mark = markMap.get(`${student.id}::${subject}`);
      if (!mark) return { score: null, isAbsent: false, isMissing: true };
      if (mark.isAbsent) return { score: null, isAbsent: true, isMissing: false };
      if (typeof mark.score === "number") return { score: mark.score, isAbsent: false, isMissing: false };
      return { score: null, isAbsent: false, isMissing: true };
    });
    const total = scores.reduce((sum, cell) => sum + (cell.score ?? 0), 0);

    return {
      studentName:
        student.studentNameBn ||
        student.studentNameEn ||
        `${student.firstName} ${student.lastName}`.trim(),
      studentCode: student.studentId,
      rollNo: student.rollNo,
      scores,
      total: Number(total.toFixed(2)),
      resultStatus: getResultStatus(scores),
    };
  });

  return (
    <main className="print-a4 text-slate-900">
      <header className="mb-4 border-b border-slate-300 pb-3 text-center">
        <h1 className="text-xl font-bold">ফলাফল শিট</h1>
        <p className="text-xs text-slate-600">Primary Result Sheet</p>
        <p className="mt-2 text-sm font-semibold">{institution?.name ?? "School"}</p>
        <p className="text-xs text-slate-600">{institution?.address ?? "Bangladesh"}</p>
      </header>

      <section className="mb-4 grid grid-cols-2 gap-2 text-sm">
        <p>
          <span className="font-semibold">পরীক্ষা:</span> {exam.name}
        </p>
        <p>
          <span className="font-semibold">বছর:</span> {exam.year}
        </p>
        <p>
          <span className="font-semibold">শ্রেণি:</span> {exam.class.grade}
        </p>
        <p>
          <span className="font-semibold">সেকশন:</span> {exam.class.section}
        </p>
      </section>

      <table className="w-full border-collapse text-sm result-sheet-print-table">
        <thead>
          <tr>
            <th>রোল</th>
            <th>শিক্ষার্থী</th>
            {subjects.map((subject) => (
              <th key={subject}>{subject}</th>
            ))}
            <th>মোট</th>
            <th>ফলাফল</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.studentCode}>
              <td>{row.rollNo ?? "-"}</td>
              <td>
                <div className="font-medium">{row.studentName}</div>
                <div className="text-[11px] text-slate-600">{row.studentCode}</div>
              </td>
              {row.scores.map((cell, index) => (
                <td key={`${row.studentCode}-${subjects[index]}`}>
                  {cell.isAbsent ? "A" : typeof cell.score === "number" ? cell.score : "—"}
                </td>
              ))}
              <td>{row.total}</td>
              <td>{row.resultStatus}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <footer className="mt-12 grid grid-cols-2 gap-8 text-center text-sm">
        <div>
          <p className="pt-10">....................................</p>
          <p className="font-semibold">শ্রেণি শিক্ষক</p>
          <p className="text-xs text-slate-600">Class Teacher</p>
        </div>
        <div>
          <p className="pt-10">....................................</p>
          <p className="font-semibold">প্রধান শিক্ষক</p>
          <p className="text-xs text-slate-600">Head Teacher</p>
        </div>
      </footer>
    </main>
  );
}
