"use client";

import { FileBadge2, FileCheck2, IdCard, ScrollText, type LucideIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { MANUAL_TEMPLATE_OPTIONS } from "@/lib/contracts/v1/students-records";
import { cn } from "@/lib/utils";

const TEMPLATE_LABELS: Record<(typeof MANUAL_TEMPLATE_OPTIONS)[number], string> = {
  ID_CARD: "ID Card",
  RESULT_SHEET: "Result Sheet Report",
  ATTENDANCE_RECORD: "Attendance Record",
  BEHAVIOR_TRACKING: "Behavior Tracking Report",
  FINAL_EXAM_CERTIFICATE: "Final Exam Certificate",
  CHARACTER_CERTIFICATE: "Character Certificate",
  EXTRA_SKILLS_CERTIFICATE: "Extra Skills Certificate",
  TRANSFER_CERTIFICATE: "Transfer Certificate",
};

const TEMPLATE_META: Record<
  (typeof MANUAL_TEMPLATE_OPTIONS)[number],
  { description: string; tone: string; icon: LucideIcon }
> = {
  ID_CARD: {
    description: "Compact institutional identity format",
    tone: "from-sky-500/10 to-cyan-500/5 border-sky-500/30",
    icon: IdCard,
  },
  RESULT_SHEET: {
    description: "Score-focused subject performance sheet",
    tone: "from-blue-500/10 to-indigo-500/5 border-blue-500/30",
    icon: FileCheck2,
  },
  ATTENDANCE_RECORD: {
    description: "Attendance summary with rate indicators",
    tone: "from-emerald-500/10 to-teal-500/5 border-emerald-500/30",
    icon: ScrollText,
  },
  BEHAVIOR_TRACKING: {
    description: "Conduct and behavior observation report",
    tone: "from-amber-500/10 to-orange-500/5 border-amber-500/30",
    icon: FileBadge2,
  },
  FINAL_EXAM_CERTIFICATE: {
    description: "Formal completion certificate layout",
    tone: "from-violet-500/10 to-fuchsia-500/5 border-violet-500/30",
    icon: FileBadge2,
  },
  CHARACTER_CERTIFICATE: {
    description: "Character and discipline certificate style",
    tone: "from-rose-500/10 to-pink-500/5 border-rose-500/30",
    icon: FileBadge2,
  },
  EXTRA_SKILLS_CERTIFICATE: {
    description: "Extracurricular achievement certificate",
    tone: "from-lime-500/10 to-green-500/5 border-lime-500/30",
    icon: FileBadge2,
  },
  TRANSFER_CERTIFICATE: {
    description: "Transfer and forwarding record certificate",
    tone: "from-slate-500/10 to-zinc-500/5 border-slate-500/30",
    icon: FileBadge2,
  },
};

interface TemplateSelectorProps {
  value: string;
  onChange: (value: (typeof MANUAL_TEMPLATE_OPTIONS)[number]) => void;
}

export function templateLabel(value: string) {
  const key = value as keyof typeof TEMPLATE_LABELS;
  return TEMPLATE_LABELS[key] ?? value.replaceAll("_", " ");
}

export function TemplateSelector({ value, onChange }: TemplateSelectorProps) {
  return (
    <div className="space-y-2">
      <Label>Template *</Label>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {MANUAL_TEMPLATE_OPTIONS.map((item) => {
          const active = item === value;
          const meta = TEMPLATE_META[item];
          const Icon = meta.icon;

          return (
            <button
              key={item}
              type="button"
              onClick={() => onChange(item)}
              className={cn(
                "group rounded-lg border bg-gradient-to-br p-3 text-left transition-all",
                meta.tone,
                active
                  ? "ring-1 ring-primary shadow-sm"
                  : "border-border/70 hover:border-primary/40 hover:shadow-sm",
              )}
            >
              <div className="mb-1 flex items-center gap-2">
                <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
                <p className={cn("text-sm font-semibold", active ? "text-primary" : "text-foreground")}>
                  {templateLabel(item)}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">{meta.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
