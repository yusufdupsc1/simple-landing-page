// src/components/classes/classes-client.tsx
"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Users, BookOpen } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    createClass, updateClass, deleteClass, createSubject, updateSubject, deleteSubject,
    type ClassFormData, type SubjectFormData,
} from "@/server/actions/classes";

type Teacher = { id: string; firstName: string; lastName: string };
type Subject = { id: string; name: string; code: string; credits: number; isCore: boolean; _count: { teachers: number; grades: number } };
type ClassRow = {
    id: string; name: string; grade: string; section: string; capacity: number;
    roomNumber: string | null; academicYear: string;
    classTeacher: { firstName: string; lastName: string } | null;
    _count: { students: number };
};

interface Props {
    classes: ClassRow[]; subjects: Subject[]; teachers: Teacher[];
    total: number; pages: number; currentPage: number; activeTab: string;
}

const NO_TEACHER_VALUE = "__no_teacher__";

function ClassForm({ initial, teachers, onSuccess }: { initial?: ClassRow; teachers: Teacher[]; onSuccess: () => void }) {
    const [pending, startTransition] = useTransition();
    const [form, setForm] = useState<ClassFormData>({
        name: initial?.name ?? "",
        grade: initial?.grade ?? "",
        section: initial?.section ?? "",
        capacity: initial?.capacity ?? 30,
        roomNumber: initial?.roomNumber ?? "",
        academicYear: initial?.academicYear ?? `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
        teacherId: "",
    });
    const set = (k: keyof ClassFormData, v: unknown) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            const res = initial ? await updateClass(initial.id, form) : await createClass(form);
            if (res.success) { toast.success(initial ? "Class updated" : "Class created"); onSuccess(); }
            else toast.error(res.error);
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
                <Label htmlFor="cl-name">Class Name *</Label>
                <Input id="cl-name" value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Grade 10A" required />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                    <Label htmlFor="cl-grade">Grade *</Label>
                    <Input id="cl-grade" value={form.grade} onChange={e => set("grade", e.target.value)} placeholder="e.g. 10" required />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="cl-sec">Section *</Label>
                    <Input id="cl-sec" value={form.section} onChange={e => set("section", e.target.value)} placeholder="e.g. A" required />
                </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                    <Label htmlFor="cl-cap">Capacity</Label>
                    <Input id="cl-cap" type="number" min={1} value={form.capacity} onChange={e => set("capacity", Number(e.target.value))} />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="cl-room">Room Number</Label>
                    <Input id="cl-room" value={form.roomNumber ?? ""} onChange={e => set("roomNumber", e.target.value)} />
                </div>
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="cl-year">Academic Year *</Label>
                <Input id="cl-year" value={form.academicYear} onChange={e => set("academicYear", e.target.value)} placeholder="e.g. 2024-2025" required />
            </div>
            <div className="space-y-1.5">
                <Label>Class Teacher</Label>
                <Select
                    value={form.teacherId ? form.teacherId : NO_TEACHER_VALUE}
                    onValueChange={v => set("teacherId", v === NO_TEACHER_VALUE ? "" : v)}
                >
                    <SelectTrigger><SelectValue placeholder="Select class teacher" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value={NO_TEACHER_VALUE}>None</SelectItem>
                        {teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.firstName} {t.lastName}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <Button type="submit" disabled={pending} className="w-full">
                {pending ? "Saving..." : initial ? "Update Class" : "Create Class"}
            </Button>
        </form>
    );
}

function SubjectForm({ initial, onSuccess }: { initial?: Subject; onSuccess: () => void }) {
    const [pending, startTransition] = useTransition();
    const [form, setForm] = useState<SubjectFormData>({
        name: initial?.name ?? "", code: initial?.code ?? "",
        description: "", credits: initial?.credits ?? 1, isCore: initial?.isCore ?? true,
    });
    const set = (k: keyof SubjectFormData, v: unknown) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            const res = initial ? await updateSubject(initial.id, form) : await createSubject(form);
            if (res.success) { toast.success(initial ? "Subject updated" : "Subject created"); onSuccess(); }
            else toast.error(res.error);
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
                <Label htmlFor="sub-name">Subject Name *</Label>
                <Input id="sub-name" value={form.name} onChange={e => set("name", e.target.value)} required />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                    <Label htmlFor="sub-code">Code *</Label>
                    <Input id="sub-code" value={form.code} onChange={e => set("code", e.target.value)} placeholder="e.g. MATH101" required />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="sub-cred">Credits</Label>
                    <Input id="sub-cred" type="number" min={1} value={form.credits} onChange={e => set("credits", Number(e.target.value))} />
                </div>
            </div>
            <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.isCore ? "core" : "elective"} onValueChange={v => set("isCore", v === "core")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="core">Core</SelectItem>
                        <SelectItem value="elective">Elective</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <Button type="submit" disabled={pending} className="w-full">
                {pending ? "Saving..." : initial ? "Update Subject" : "Create Subject"}
            </Button>
        </form>
    );
}

export function ClassesClient({ classes, subjects, teachers, total, pages, currentPage, activeTab }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [open, setOpen] = useState(false);
    const [editClass, setEditClass] = useState<ClassRow | null>(null);
    const [editSubject, setEditSubject] = useState<Subject | null>(null);
    const [dialogType, setDialogType] = useState<"class" | "subject">("class");
    const [, startTransition] = useTransition();

    const handleTabChange = (tab: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", tab);
        router.push(`?${params.toString()}`);
    };

    const handleDeleteClass = (id: string, name: string) => {
        if (!confirm(`Deactivate class "${name}"?`)) return;
        startTransition(async () => {
            const res = await deleteClass(id);
            if (res.success) toast.success("Class deactivated");
            else toast.error(res.error);
        });
    };

    const handleDeleteSubject = (id: string, name: string) => {
        if (!confirm(`Deactivate subject "${name}"?`)) return;
        startTransition(async () => {
            const res = await deleteSubject(id);
            if (res.success) {
                toast.success("Subject deactivated");
                router.refresh();
            } else {
                toast.error(res.error);
            }
        });
    };

    return (
        <>
            <PageHeader title="Classes & Subjects" description="Manage academic classes and subjects">
                <Dialog open={open} onOpenChange={setOpen}>
                    <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                        <DialogTrigger asChild>
                            <Button size="sm" className="flex-1 sm:flex-none" variant="outline" onClick={() => { setDialogType("subject"); setEditSubject(null); }}>
                                <Plus className="h-4 w-4 mr-1" /> Subject
                            </Button>
                        </DialogTrigger>
                        <DialogTrigger asChild>
                            <Button size="sm" className="flex-1 sm:flex-none" onClick={() => { setDialogType("class"); setEditClass(null); }}>
                                <Plus className="h-4 w-4 mr-1" /> Class
                            </Button>
                        </DialogTrigger>
                    </div>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {dialogType === "class" ? (editClass ? "Edit Class" : "Add Class") : (editSubject ? "Edit Subject" : "Add Subject")}
                            </DialogTitle>
                        </DialogHeader>
                        {dialogType === "class"
                            ? <ClassForm initial={editClass ?? undefined} teachers={teachers} onSuccess={() => setOpen(false)} />
                            : <SubjectForm initial={editSubject ?? undefined} onSuccess={() => setOpen(false)} />}
                    </DialogContent>
                </Dialog>
            </PageHeader>

            <Tabs value={activeTab} onValueChange={handleTabChange}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <TabsList>
                        <TabsTrigger value="classes">Classes ({total})</TabsTrigger>
                        <TabsTrigger value="subjects">Subjects ({subjects.length})</TabsTrigger>
                    </TabsList>
                    <SearchInput placeholder="Search..." className="w-full sm:w-56" />
                </div>

                <TabsContent value="classes">
                    <div className="rounded-xl border border-border bg-card overflow-hidden">
                        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                        <table className="w-full min-w-[620px] text-sm">
                            <thead className="border-b border-border bg-muted/30">
                                <tr>
                                    {["Class", "Academic Year", "Room", "Class Teacher", "Students", "Capacity", ""].map(h => (
                                        <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {classes.length === 0 ? (
                                    <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No classes found.</td></tr>
                                ) : classes.map(c => (
                                    <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3 font-medium">{c.name}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{c.academicYear}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{c.roomNumber ?? "—"}</td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {c.classTeacher ? `${c.classTeacher.firstName} ${c.classTeacher.lastName}` : "—"}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5">
                                                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span>{c._count.students}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">{c.capacity}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditClass(c); setDialogType("class"); setOpen(true); }}>
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDeleteClass(c.id, c.name)}>
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
                </TabsContent>

                <TabsContent value="subjects">
                    <div className="rounded-xl border border-border bg-card overflow-hidden">
                        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                        <table className="w-full min-w-[520px] text-sm">
                            <thead className="border-b border-border bg-muted/30">
                                <tr>
                                    {["Subject", "Code", "Credits", "Type", "Teachers", ""].map(h => (
                                        <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {subjects.length === 0 ? (
                                    <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No subjects found.</td></tr>
                                ) : subjects.map(s => (
                                    <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3 font-medium">{s.name}</td>
                                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.code}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{s.credits}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${s.isCore ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                                                {s.isCore ? "Core" : "Elective"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                                                <BookOpen className="h-3.5 w-3.5" />{s._count.teachers}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditSubject(s); setDialogType("subject"); setOpen(true); }}>
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-destructive hover:text-destructive"
                                                    onClick={() => handleDeleteSubject(s.id, s.name)}
                                                >
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
                </TabsContent>
            </Tabs>
        </>
    );
}
