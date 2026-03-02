"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Printer, Save, Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createPrimaryExam,
  savePrimaryExamMarks,
} from "@/server/actions/primary-exams";

type ClassRow = {
  id: string;
  name: string;
  grade: string;
  section: string;
};

type ExamRow = {
  id: string;
  name: string;
  year: number;
  subjects: string[];
  createdAt: string | null;
  class: {
    id: string;
    name: string;
    grade: string;
    section: string;
  };
};

type ResultData = {
  exam: {
    id: string;
    name: string;
    year: number;
    class: {
      id: string;
      name: string;
      grade: string;
      section: string;
    };
  };
  subjects: string[];
  rows: Array<{
    studentId: string;
    studentCode: string;
    rollNo: string | null;
    studentName: string;
    marksBySubject: Record<
      string,
      {
        score: number | null;
        isAbsent: boolean;
        isMissing: boolean;
      }
    >;
    total: number;
    percentage: number;
    resultStatus: "PASS" | "FAIL" | "INCOMPLETE";
  }>;
};

interface Props {
  classes: ClassRow[];
  exams: ExamRow[];
  selectedExamId: string;
  resultData: ResultData | null;
}

function cellKey(studentId: string, subject: string): string {
  return `${studentId}::${subject}`;
}

const PASS_MARK_THRESHOLD = 33;
type RowResultStatus = "PASS" | "FAIL" | "INCOMPLETE";

function parseMarkInput(raw: string): {
  kind: "missing" | "absent" | "score" | "invalid";
  score: number | null;
} {
  const value = raw.trim();
  if (!value) return { kind: "missing", score: null };
  if (value.toUpperCase() === "A") return { kind: "absent", score: null };
  const score = Number(value);
  if (!Number.isFinite(score)) return { kind: "invalid", score: null };
  if (score < 0 || score > 100) return { kind: "invalid", score: null };
  return { kind: "score", score };
}

export function PrimaryExamClient({
  classes,
  exams,
  selectedExamId,
  resultData,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const [newExamName, setNewExamName] = useState("");
  const [newExamYear, setNewExamYear] = useState(String(new Date().getFullYear()));
  const [newExamClassId, setNewExamClassId] = useState(classes[0]?.id ?? "");
  const [newExamSubjects, setNewExamSubjects] = useState("বাংলা\nইংরেজি\nগণিত\nবিজ্ঞান");

  const [marksMap, setMarksMap] = useState<Record<string, string>>(() => {
    const next: Record<string, string> = {};
    if (resultData) {
      for (const row of resultData.rows) {
        for (const subject of resultData.subjects) {
          const mark = row.marksBySubject[subject];
          if (mark?.isAbsent) {
            next[cellKey(row.studentId, subject)] = "A";
          } else if (typeof mark?.score === "number") {
            next[cellKey(row.studentId, subject)] = String(mark.score);
          } else {
            next[cellKey(row.studentId, subject)] = "";
          }
        }
      }
    }
    return next;
  });

  const hasExam = Boolean(resultData && selectedExamId);

  const updateExamQuery = (examId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (examId) params.set("examId", examId);
    else params.delete("examId");
    router.push(`?${params.toString()}`);
  };

  const handleCreateExam = () => {
    if (!newExamName.trim() || !newExamClassId || !newExamSubjects.trim()) {
      toast.error("Exam name, class and subjects are required.");
      return;
    }

    startTransition(async () => {
      const result = await createPrimaryExam({
        name: newExamName.trim(),
        year: Number(newExamYear),
        classId: newExamClassId,
        subjectsText: newExamSubjects,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Exam created.");
      setNewExamName("");
      if (result.data?.id) {
        updateExamQuery(result.data.id);
      } else {
        router.refresh();
      }
    });
  };

  const computeRowMetrics = (studentId: string) => {
    if (!resultData) return { total: 0, resultStatus: "INCOMPLETE" as RowResultStatus };

    let total = 0;
    let hasMissing = false;
    let hasFailOrAbsent = false;
    for (const subject of resultData.subjects) {
      const parsed = parseMarkInput(marksMap[cellKey(studentId, subject)] ?? "");
      if (parsed.kind === "missing" || parsed.kind === "invalid") {
        hasMissing = true;
        continue;
      }
      if (parsed.kind === "absent") {
        hasFailOrAbsent = true;
        continue;
      }
      if ((parsed.score ?? 0) < PASS_MARK_THRESHOLD) {
        hasFailOrAbsent = true;
      }
      total += parsed.score ?? 0;
    }

    let resultStatus: RowResultStatus = "PASS";
    if (hasMissing) resultStatus = "INCOMPLETE";
    else if (hasFailOrAbsent) resultStatus = "FAIL";

    return {
      total: Number(total.toFixed(2)),
      resultStatus,
    };
  };

  const handleSaveMarks = () => {
    if (!resultData) {
      toast.error("Select an exam first.");
      return;
    }

    startTransition(async () => {
      let invalidCells = 0;
      const entries = resultData.rows.flatMap((row) =>
        resultData.subjects.map((subject) => ({
          parsed: parseMarkInput(marksMap[cellKey(row.studentId, subject)] ?? ""),
          studentId: row.studentId,
          subjectName: subject,
        })),
      );
      for (const entry of entries) {
        if (entry.parsed.kind === "invalid") invalidCells += 1;
      }
      if (invalidCells > 0) {
        toast.error(`Found ${invalidCells} invalid mark input(s). Use 0-100, A, or leave blank.`);
        return;
      }

      const result = await savePrimaryExamMarks({
        examId: resultData.exam.id,
        entries: entries.map((entry) => ({
          studentId: entry.studentId,
          subjectName: entry.subjectName,
          score: entry.parsed.kind === "score" ? entry.parsed.score : null,
          isAbsent: entry.parsed.kind === "absent",
        })),
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Marks saved.");
      router.refresh();
    });
  };

  const openPrintSheet = () => {
    if (!resultData) {
      toast.error("Select an exam first.");
      return;
    }

    window.open(
      `/dashboard/exams/primary/${encodeURIComponent(resultData.exam.id)}/print`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const selectedExamLabel = useMemo(() => {
    const exam = exams.find((item) => item.id === selectedExamId);
    if (!exam) return "Select exam";
    return `${exam.name} ${exam.year} • Class ${exam.class.grade}-${exam.class.section}`;
  }, [exams, selectedExamId]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Primary Exam & Result"
        description="Class 1-5 exam setup, marks entry, and printable result sheet"
      />

      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold">Create Exam</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Exam Name</Label>
            <Input
              value={newExamName}
              onChange={(event) => setNewExamName(event.target.value)}
              placeholder="Half Yearly / বার্ষিক পরীক্ষা"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Year</Label>
            <Input
              type="number"
              value={newExamYear}
              onChange={(event) => setNewExamYear(event.target.value)}
              min={2020}
              max={2100}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Class</Label>
            <Select value={newExamClassId} onValueChange={setNewExamClassId}>
              <SelectTrigger>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((classItem) => (
                  <SelectItem key={classItem.id} value={classItem.id}>
                    Class {classItem.grade} - {classItem.section}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-3">
            <Label>Subjects (comma or new line)</Label>
            <Textarea
              value={newExamSubjects}
              onChange={(event) => setNewExamSubjects(event.target.value)}
              className="min-h-[88px]"
            />
          </div>
          <div className="flex items-end">
            <Button type="button" onClick={handleCreateExam} disabled={pending} className="w-full">
              <Plus className="mr-1.5 h-4 w-4" />
              {pending ? "Creating..." : "Create Exam"}
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 sm:items-end">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Exam</Label>
            <Select value={selectedExamId || "none"} onValueChange={(value) => updateExamQuery(value === "none" ? "" : value)}>
              <SelectTrigger>
                <SelectValue placeholder={selectedExamLabel} />
              </SelectTrigger>
              <SelectContent>
                {exams.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No exams yet
                  </SelectItem>
                ) : (
                  exams.map((exam) => (
                    <SelectItem key={exam.id} value={exam.id}>
                      {exam.name} {exam.year} • Class {exam.class.grade}-{exam.class.section}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <Button type="button" variant="outline" onClick={openPrintSheet} disabled={!hasExam}>
            <Printer className="mr-1.5 h-4 w-4" />
            Print A4
          </Button>
          <Button type="button" onClick={handleSaveMarks} disabled={pending || !hasExam}>
            <Save className="mr-1.5 h-4 w-4" />
            {pending ? "Saving..." : "Save Marks"}
          </Button>
        </div>
      </div>

      {resultData ? (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full min-w-[980px] text-sm result-entry-table">
            <thead>
              <tr>
                <th className="text-left">Student</th>
                <th className="text-left">Roll</th>
                {resultData.subjects.map((subject) => (
                  <th key={subject} className="text-left">
                    {subject}
                  </th>
                ))}
                <th className="text-left">Total</th>
                <th className="text-left">Result</th>
              </tr>
            </thead>
            <tbody>
              {resultData.rows.map((row) => {
                const metrics = computeRowMetrics(row.studentId);
                return (
                  <tr key={row.studentId}>
                    <td>
                      <div className="font-medium">{row.studentName}</div>
                      <div className="text-xs text-muted-foreground">{row.studentCode}</div>
                    </td>
                    <td>{row.rollNo ?? "-"}</td>
                    {resultData.subjects.map((subject) => {
                      const key = cellKey(row.studentId, subject);
                      return (
                        <td key={key}>
                          <Input
                            type="text"
                            value={marksMap[key] ?? ""}
                            onChange={(event) =>
                              setMarksMap((prev) => ({
                                ...prev,
                                [key]: event.target.value,
                              }))
                            }
                            placeholder="0-100 / A"
                            inputMode="text"
                            className="h-8 w-20"
                          />
                        </td>
                      );
                    })}
                    <td className="font-semibold">{metrics.total}</td>
                    <td>{metrics.resultStatus}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Create or select an exam to start entering marks.
        </div>
      )}
    </div>
  );
}
