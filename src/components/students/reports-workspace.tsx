"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { MANUAL_TEMPLATE_OPTIONS } from "@/lib/contracts/v1/students-records";
import {
  ReportToolbar,
} from "@/components/students/report-toolbar";
import {
  ReportPreview,
  type StudentRecordItem,
} from "@/components/students/report-preview";
import { type StudentSearchItem } from "@/components/students/student-search-select";

interface ClassOption {
  id: string;
  name: string;
}

interface ReportsWorkspaceProps {
  classes: ClassOption[];
}

type PeriodType = "WEEKLY" | "MONTHLY" | "QUARTERLY" | "ANNUAL" | "CUSTOM";

type ManualTemplate = (typeof MANUAL_TEMPLATE_OPTIONS)[number];

function sortGrouped(groups: Record<string, StudentRecordItem[]>) {
  return Object.fromEntries(
    Object.entries(groups).sort(([left], [right]) => right.localeCompare(left)),
  );
}

export function ReportsWorkspace({ classes }: ReportsWorkspaceProps) {
  const [classFilter, setClassFilter] = useState("ALL_CLASSES");
  const [selectedStudent, setSelectedStudent] = useState<StudentSearchItem | null>(null);
  const [template, setTemplate] = useState<ManualTemplate>("ID_CARD");
  const [periodType, setPeriodType] = useState<PeriodType>("CUSTOM");
  const [periodLabel, setPeriodLabel] = useState("");
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [previewRecordId, setPreviewRecordId] = useState<string | null>(null);
  const [groupedRecords, setGroupedRecords] = useState<Record<string, StudentRecordItem[]>>({});

  const selectedStudentName = useMemo(() => {
    if (!selectedStudent) return "";
    return `${selectedStudent.firstName} ${selectedStudent.lastName} (${selectedStudent.studentId})`;
  }, [selectedStudent]);

  async function loadRecords(studentId: string) {
    setLoadingRecords(true);
    try {
      const res = await fetch(`/api/v1/students/${studentId}/records?limit=200`);
      const json = await res.json();
      const grouped = (json?.data?.grouped ?? {}) as Record<string, StudentRecordItem[]>;
      setGroupedRecords(sortGrouped(grouped));
    } catch {
      toast.error("Failed to load student records");
      setGroupedRecords({});
    } finally {
      setLoadingRecords(false);
    }
  }

  useEffect(() => {
    if (!selectedStudent) {
      setGroupedRecords({});
      setPreviewRecordId(null);
      return;
    }
    void loadRecords(selectedStudent.id);
  }, [selectedStudent]);

  async function generateRecord(opts?: { regenerate?: boolean; templateOverride?: string; periodTypeOverride?: PeriodType; periodLabelOverride?: string }) {
    if (!selectedStudent) {
      toast.error("Select a student first");
      return;
    }

    const payload = {
      studentId: selectedStudent.id,
      classId: classFilter === "ALL_CLASSES" ? undefined : classFilter,
      template: (opts?.templateOverride ?? template),
      periodType: (opts?.periodTypeOverride ?? periodType),
      periodLabel: (opts?.periodLabelOverride ?? periodLabel),
      regenerate: opts?.regenerate ?? false,
    };

    setGenerating(true);
    try {
      const res = await fetch("/api/v1/students/reports/generate", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || json?.error) {
        throw new Error(json?.error?.message ?? "Failed");
      }
      const generated = json?.data as StudentRecordItem | undefined;

      toast.success(opts?.regenerate ? "Record regenerated" : "PDF generated");
      await loadRecords(selectedStudent.id);
      if (generated?.id) {
        setPreviewRecordId(generated.id);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate PDF");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
      <ReportToolbar
        classes={classes}
        classFilter={classFilter}
        onClassFilterChange={(value) => {
          setClassFilter(value);
          setSelectedStudent(null);
        }}
        selectedStudent={selectedStudent}
        onStudentSelect={setSelectedStudent}
        template={template}
        onTemplateChange={setTemplate}
        periodType={periodType}
        onPeriodTypeChange={setPeriodType}
        periodLabel={periodLabel}
        onPeriodLabelChange={setPeriodLabel}
        onGenerate={() => void generateRecord()}
        generating={generating}
      />

      <ReportPreview
        loading={loadingRecords}
        selectedStudentName={selectedStudentName}
        grouped={groupedRecords}
        regeneratingId={regeneratingId}
        previewRecordId={previewRecordId}
        onPreviewRecordHandled={() => setPreviewRecordId(null)}
        onRegenerate={(record) => {
          setRegeneratingId(record.id);
          void generateRecord({
            regenerate: true,
            templateOverride: record.recordType,
            periodTypeOverride: record.periodType as PeriodType,
            periodLabelOverride: record.periodLabel,
          }).finally(() => setRegeneratingId(null));
        }}
      />
    </div>
  );
}
