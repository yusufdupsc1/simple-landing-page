// src/components/teachers/teachers-client.tsx
"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Pencil, UserX, Mail, Phone, BookOpen } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createTeacher, updateTeacher, deleteTeacher, type TeacherFormData } from "@/server/actions/teachers";
import { formatCurrency } from "@/lib/utils";

type Subject = { id: string; name: string; code: string };
type Teacher = {
    id: string; teacherId: string; firstName: string; lastName: string;
    email: string; phone: string | null; specialization: string | null;
    qualification: string | null; salary: number | null; status: string;
    joiningDate: string | null; subjects: { subject: { id: string; name: string; code: string } }[];
    classTeacher: { name: string }[];
};

interface Props {
    teachers: Teacher[];
    subjects: Subject[];
    total: number; pages: number; currentPage: number;
}

const STATUS_COLORS: Record<string, string> = {
    ACTIVE: "bg-green-500/10 text-green-600",
    INACTIVE: "bg-muted text-muted-foreground",
    ON_LEAVE: "bg-yellow-500/10 text-yellow-600",
    RESIGNED: "bg-red-500/10 text-red-600",
    TERMINATED: "bg-destructive/10 text-destructive",
};

function TeacherForm({ initial, subjects: _subjects, onSuccess }: { initial?: Teacher; subjects: Subject[]; onSuccess: () => void }) {
    const [pending, startTransition] = useTransition();
    const [form, setForm] = useState<TeacherFormData>({
        firstName: initial?.firstName ?? "",
        lastName: initial?.lastName ?? "",
        email: initial?.email ?? "",
        phone: initial?.phone ?? "",
        gender: undefined, dateOfBirth: "", address: "",
        qualification: initial?.qualification ?? "",
        specialization: initial?.specialization ?? "",
        salary: initial?.salary != null ? String(initial.salary) : "",
        status: (initial?.status as TeacherFormData["status"]) ?? "ACTIVE",
        subjectIds: initial?.subjects.map(s => s.subject.id) ?? [],
    });

    const set = (k: keyof TeacherFormData, v: unknown) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            const res = initial ? await updateTeacher(initial.id, form) : await createTeacher(form);
            if (res.success) {
                toast.success(initial ? "Teacher updated" : "Teacher created");
                onSuccess();
            } else {
                toast.error(res.error);
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                    <Label htmlFor="tf-first">First Name *</Label>
                    <Input id="tf-first" value={form.firstName} onChange={e => set("firstName", e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="tf-last">Last Name *</Label>
                    <Input id="tf-last" value={form.lastName} onChange={e => set("lastName", e.target.value)} required />
                </div>
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="tf-email">Email *</Label>
                <Input id="tf-email" type="email" value={form.email} onChange={e => set("email", e.target.value)} required />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                    <Label htmlFor="tf-phone">Phone</Label>
                    <Input id="tf-phone" value={form.phone ?? ""} onChange={e => set("phone", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                    <Label>Gender</Label>
                    <Select value={form.gender ?? ""} onValueChange={v => set("gender", v || undefined)}>
                        <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="MALE">Male</SelectItem>
                            <SelectItem value="FEMALE">Female</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                    <Label htmlFor="tf-qual">Qualification</Label>
                    <Input id="tf-qual" value={form.qualification ?? ""} onChange={e => set("qualification", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="tf-spec">Specialization</Label>
                    <Input id="tf-spec" value={form.specialization ?? ""} onChange={e => set("specialization", e.target.value)} />
                </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                    <Label htmlFor="tf-salary">Salary</Label>
                    <Input id="tf-salary" type="number" step="0.01" value={form.salary ?? ""} onChange={e => set("salary", e.target.value)} placeholder="0.00" />
                </div>
                <div className="space-y-1.5">
                    <Label>Status</Label>
                    <Select value={form.status ?? "ACTIVE"} onValueChange={v => set("status", v as TeacherFormData["status"])}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="INACTIVE">Inactive</SelectItem>
                            <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                            <SelectItem value="RESIGNED">Resigned</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <Button type="submit" disabled={pending} className="w-full">
                {pending ? "Saving..." : initial ? "Update Teacher" : "Create Teacher"}
            </Button>
        </form>
    );
}

export function TeachersClient({ teachers, subjects, total, pages, currentPage }: Props) {
    const [open, setOpen] = useState(false);
    const [editTeacher, setEditTeacher] = useState<Teacher | null>(null);
    const [, startTransition] = useTransition();

    const handleDelete = (id: string, name: string) => {
        if (!confirm(`Deactivate ${name}?`)) return;
        startTransition(async () => {
            const res = await deleteTeacher(id);
            if (res.success) toast.success("Teacher deactivated");
            else toast.error(res.error);
        });
    };

    return (
        <>
            <PageHeader title="Teachers" total={total} totalLabel="teachers">
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="w-full sm:w-auto" onClick={() => setEditTeacher(null)}>
                            <Plus className="h-4 w-4 mr-1.5" /> Add Teacher
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl">
                        <DialogHeader>
                            <DialogTitle>{editTeacher ? "Edit Teacher" : "Add New Teacher"}</DialogTitle>
                        </DialogHeader>
                        <TeacherForm
                            initial={editTeacher ?? undefined}
                            subjects={subjects}
                            onSuccess={() => setOpen(false)}
                        />
                    </DialogContent>
                </Dialog>
            </PageHeader>

            <div className="flex w-full flex-wrap items-center gap-3">
                <SearchInput placeholder="Search teachers..." className="w-full sm:w-64" />
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                    <table className="w-full min-w-[700px] text-sm">
                        <thead className="border-b border-border bg-muted/30">
                            <tr>
                                {["Teacher", "ID", "Contact", "Specialization", "Classes", "Salary", "Status", ""].map(h => (
                                    <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {teachers.length === 0 ? (
                                <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">No teachers found.</td></tr>
                            ) : teachers.map(t => (
                                <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3">
                                        <div>
                                            <p className="font-medium">{t.firstName} {t.lastName}</p>
                                            <p className="text-xs text-muted-foreground">{t.qualification ?? "—"}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{t.teacherId}</td>
                                    <td className="px-4 py-3">
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-1.5 text-xs"><Mail className="h-3 w-3 text-muted-foreground" />{t.email}</div>
                                            {t.phone && <div className="flex items-center gap-1.5 text-xs"><Phone className="h-3 w-3 text-muted-foreground" />{t.phone}</div>}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-muted-foreground">{t.specialization ?? "—"}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <BookOpen className="h-3 w-3" />
                                            {t.classTeacher.length > 0 ? t.classTeacher.map(c => c.name).join(", ") : "—"}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm">{t.salary ? formatCurrency(Number(t.salary)) : "—"}</td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[t.status] ?? ""}`}>
                                            {t.status.replace("_", " ")}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditTeacher(t); setOpen(true); }}>
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(t.id, `${t.firstName} ${t.lastName}`)}>
                                                <UserX className="h-3.5 w-3.5" />
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
        </>
    );
}
