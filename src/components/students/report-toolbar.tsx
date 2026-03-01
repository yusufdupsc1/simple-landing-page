"use client";

import { Loader2, Sparkles } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StudentSearchSelect, type StudentSearchItem } from "@/components/students/student-search-select";
import { TemplateSelector } from "@/components/students/template-selector";
import { BANGLADESHI_CLASS_OPTIONS, MANUAL_TEMPLATE_OPTIONS } from "@/lib/contracts/v1/students-records";

interface ClassOption {
  id: string;
  name: string;
}

interface ReportToolbarProps {
  classes: ClassOption[];
  classFilter: string;
  onClassFilterChange: (value: string) => void;
  selectedStudent: StudentSearchItem | null;
  onStudentSelect: (student: StudentSearchItem | null) => void;
  template: (typeof MANUAL_TEMPLATE_OPTIONS)[number];
  onTemplateChange: (template: (typeof MANUAL_TEMPLATE_OPTIONS)[number]) => void;
  periodType: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "ANNUAL" | "CUSTOM";
  onPeriodTypeChange: (value: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "ANNUAL" | "CUSTOM") => void;
  periodLabel: string;
  onPeriodLabelChange: (value: string) => void;
  onGenerate: () => void;
  generating: boolean;
}

export function ReportToolbar({
  classes,
  classFilter,
  onClassFilterChange,
  selectedStudent,
  onStudentSelect,
  template,
  onTemplateChange,
  periodType,
  onPeriodTypeChange,
  periodLabel,
  onPeriodLabelChange,
  onGenerate,
  generating,
}: ReportToolbarProps) {
  const classLabelFallback = BANGLADESHI_CLASS_OPTIONS;

  return (
    <section className="rounded-2xl border border-border/70 bg-gradient-to-b from-card to-card/90 p-4 shadow-sm md:p-5">
      <div className="mb-4 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
        <Sparkles className="mt-0.5 h-4 w-4 text-primary" />
        <div>
          <p className="text-sm font-semibold text-foreground">Certificate Studio</p>
          <p className="text-xs text-muted-foreground">
            Choose class, template, and period to generate production-ready student documents.
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        <div className="space-y-1.5">
          <Label>Class Filter</Label>
          <Select value={classFilter} onValueChange={onClassFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder="All Classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL_CLASSES">All Classes</SelectItem>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name}
                </SelectItem>
              ))}
              {classes.length === 0
                ? classLabelFallback.map((label) => (
                    <SelectItem key={label} value={`fallback-${label}`} disabled>
                      {label}
                    </SelectItem>
                  ))
                : null}
            </SelectContent>
          </Select>
        </div>

        <TemplateSelector value={template} onChange={onTemplateChange} />
      </div>

      <div className="mt-4">
        <StudentSearchSelect
          classId={classFilter}
          selectedStudent={selectedStudent}
          onSelect={onStudentSelect}
        />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Period</Label>
          <Select value={periodType} onValueChange={(value) => onPeriodTypeChange(value as typeof periodType)}>
            <SelectTrigger>
              <SelectValue placeholder="Custom" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CUSTOM">Custom</SelectItem>
              <SelectItem value="WEEKLY">Weekly</SelectItem>
              <SelectItem value="MONTHLY">Monthly</SelectItem>
              <SelectItem value="QUARTERLY">Quarterly</SelectItem>
              <SelectItem value="ANNUAL">Annual</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="period-label">Period Label</Label>
          <Input
            id="period-label"
            placeholder="e.g., March 2026"
            value={periodLabel}
            onChange={(event) => onPeriodLabelChange(event.target.value)}
          />
        </div>
      </div>

      <div className="mt-5">
        <Button
          type="button"
          onClick={onGenerate}
          disabled={generating || !selectedStudent}
          className="w-full sm:w-auto"
        >
          {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {generating ? "Generating..." : "Generate PDF"}
        </Button>
      </div>
    </section>
  );
}
