// src/components/grades/grades-client.tsx
"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createGrade, updateGrade, deleteGrade, type GradeFormData } from "@/server/actions/grades";
import { PieChart, Pie, Cell, Legend, ResponsiveContainer, Tooltip } from "recharts";

type Subject = { id: string; name: string; code: string };
type Grade = {
    id: string; score: number; maxScore: number; percentage: number;
    letterGrade: string | null; term: string; remarks: string | null;
    student: { firstName: string; lastName: string; studentId: string; class: { name: string } | null };
    subject: { name: string; code: string };
};
type Distribution = { letterGrade: string | null; _count: number }[];

interface Props {
    grades: Grade[]; subjects: Subject[]; distribution: Distribution;
    total: number; pages: number; currentPage: number;
}

const GRADE_COLORS: Record<string, string> = {
    "A+": "#22c55e", A: "#84cc16", "B+": "#3b82f6", B: "#6366f1",
    "C+": "#f59e0b", C: "#f97316", D: "#ef4444", F: "#dc2626",
};

const CURRENT_TERMS = ["Term 1 2025", "Term 2 2025", "Term 3 2025", "Term 1 2026"];

function GradeForm({ initial, subjects, onSuccess }: { initial?: Grade; subjects: Subject[]; onSuccess: () => void }) {
    const [pending, startTransition] = useTransition();
    const [form, setForm] = useState<GradeFormData>({
        studentId: initial?.student.studentId ?? "",
        subjectId: initial?.subject.code ?? "",
        score: initial?.score ?? 0,
        maxScore: initial?.maxScore ?? 100,
        term: initial?.term ?? CURRENT_TERMS[0],
        remarks: initial?.remarks ?? "",
    });
    const set = (k: keyof GradeFormData, v: unknown) => setForm(f => ({ ...f, [k]: v }));

    const percentage = form.maxScore > 0 ? Math.round((Number(form.score) / Number(form.maxScore)) * 100) : 0;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            const res = initial ? await updateGrade(initial.id, form) : await createGrade(form);
            if (res.success) { toast.success(initial ? "Grade updated" : "Grade recorded"); onSuccess(); }
            else toast.error(res.error);
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {!initial && (
                <div className="space-y-1.5">
                    <Label htmlFor="gr-sid">Student ID *</Label>
                    <Input id="gr-sid" value={form.studentId} onChange={e => set("studentId", e.target.value)} placeholder="e.g. STU-2024-0001" required />
                </div>
            )}
            <div className="space-y-1.5">
                <Label>Subject *</Label>
                <Select value={form.subjectId} onValueChange={v => set("subjectId", v)} required>
                    <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                    <SelectContent>
                        {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                    <Label htmlFor="gr-score">Score *</Label>
                    <Input id="gr-score" type="number" min={0} step={0.01} value={form.score} onChange={e => set("score", e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="gr-max">Max Score</Label>
                    <Input id="gr-max" type="number" min={1} value={form.maxScore} onChange={e => set("maxScore", e.target.value)} />
                </div>
            </div>
            {percentage > 0 && (
                <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <span className="text-sm text-muted-foreground">Result: </span>
                    <span className="font-bold text-lg">{percentage}%</span>
                </div>
            )}
            <div className="space-y-1.5">
                <Label>Term *</Label>
                <Select value={form.term} onValueChange={v => set("term", v)}>
                    <SelectTrigger><SelectValue placeholder="Select term" /></SelectTrigger>
                    <SelectContent>
                        {CURRENT_TERMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="gr-rem">Remarks</Label>
                <Input id="gr-rem" value={form.remarks ?? ""} onChange={e => set("remarks", e.target.value)} placeholder="Optional remarks..." />
            </div>
            <Button type="submit" disabled={pending} className="w-full">
                {pending ? "Saving..." : initial ? "Update Grade" : "Record Grade"}
            </Button>
        </form>
    );
}

export function GradesClient({ grades, subjects, distribution, total, pages, currentPage }: Props) {
    const [open, setOpen] = useState(false);
    const [editGrade, setEditGrade] = useState<Grade | null>(null);
    const [, startTransition] = useTransition();

    const chartData = distribution.map(d => ({
        name: d.letterGrade ?? "—",
        value: d._count,
        fill: GRADE_COLORS[d.letterGrade ?? ""] ?? "#94a3b8",
    }));

    const handleDelete = (id: string) => {
        if (!confirm("Delete this grade record?")) return;
        startTransition(async () => {
            const res = await deleteGrade(id);
            if (res.success) toast.success("Grade deleted");
            else toast.error(res.error);
        });
    };

    return (
        <>
            <PageHeader title="Grades" total={total} totalLabel="records">
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="w-full sm:w-auto" onClick={() => setEditGrade(null)}>
                            <Plus className="h-4 w-4 mr-1.5" /> Add Grade
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>{editGrade ? "Edit Grade" : "Record Grade"}</DialogTitle></DialogHeader>
                        <GradeForm initial={editGrade ?? undefined} subjects={subjects} onSuccess={() => setOpen(false)} />
                    </DialogContent>
                </Dialog>
            </PageHeader>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                <div className="lg:col-span-3 space-y-4">
                    <div className="flex w-full flex-wrap gap-3">
                        <SearchInput placeholder="Search students..." className="w-full sm:w-64" />
                    </div>
                    <div className="rounded-xl border border-border bg-card overflow-hidden">
                        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                        <table className="w-full min-w-[640px] text-sm">
                            <thead className="border-b border-border bg-muted/30">
                                <tr>
                                    {["Student", "Subject", "Score", "Grade", "Term", ""].map(h => (
                                        <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {grades.length === 0 ? (
                                    <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No grades found.</td></tr>
                                ) : grades.map(g => (
                                    <tr key={g.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3">
                                            <p className="font-medium">{g.student.firstName} {g.student.lastName}</p>
                                            <p className="text-xs text-muted-foreground">{g.student.class?.name ?? "—"}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p>{g.subject.name}</p>
                                            <p className="text-xs font-mono text-muted-foreground">{g.subject.code}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="font-semibold">{g.score}/{g.maxScore}</p>
                                            <p className="text-xs text-muted-foreground">{g.percentage.toFixed(1)}%</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: `${GRADE_COLORS[g.letterGrade ?? ""] ?? "#94a3b8"}20`, color: GRADE_COLORS[g.letterGrade ?? ""] ?? "#94a3b8" }}>
                                                {g.letterGrade ?? "—"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground text-xs">{g.term}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditGrade(g); setOpen(true); }}>
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(g.id)}>
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        </div>
                    </div>
                    <DataTablePagination currentPage={currentPage} totalPages={pages} total={total} />
                </div>

                <div className="rounded-xl border border-border bg-card p-4">
                    <h3 className="font-semibold text-sm mb-4">Grade Distribution</h3>
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                                    {chartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                                </Pie>
                                <Tooltip formatter={(v: number) => [`${v} students`, "Count"]} />
                                <Legend formatter={v => <span className="text-xs">{v}</span>} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
                    )}
                </div>
            </div>
        </>
    );
}
