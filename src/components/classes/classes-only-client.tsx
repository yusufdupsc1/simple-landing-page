"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Users, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { showMacDeleteToast } from "@/components/ui/macos-toast";
import {
  createClass,
  updateClass,
  deleteClass,
  type ClassFormData,
} from "@/server/actions/classes";
import { useT } from "@/lib/i18n/client";
import { getGradeOptions } from "@/lib/config";

type Teacher = { id: string; firstName: string; lastName: string };

type ClassRow = {
  id: string;
  name: string;
  grade: string;
  section: string;
  capacity: number;
  roomNumber: string | null;
  academicYear: string;
  classTeacher: { firstName: string; lastName: string } | null;
  _count: { students: number };
};

interface Props {
  classes: ClassRow[];
  teachers: Teacher[];
  total: number;
  pages: number;
  currentPage: number;
}

const NO_TEACHER_VALUE = "__no_teacher__";

type DeleteTarget = { id: string; name: string } | null;

function ClassForm({
  initial,
  teachers,
  onSuccess,
}: {
  initial?: ClassRow;
  teachers: Teacher[];
  onSuccess: () => void;
}) {
  const baseGradeOptions = getGradeOptions();
  const gradeOptions =
    initial?.grade && !baseGradeOptions.some((option) => option.grade === initial.grade)
      ? [
          ...baseGradeOptions,
          {
            grade: initial.grade,
            labelBn: `শ্রেণি ${initial.grade}`,
            labelEn: `Class ${initial.grade}`,
          },
        ]
      : baseGradeOptions;
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<ClassFormData>({
    name: initial?.name ?? "",
    grade: initial?.grade ?? gradeOptions[0]?.grade ?? "",
    section: initial?.section ?? "",
    capacity: initial?.capacity ?? 30,
    roomNumber: initial?.roomNumber ?? "",
    academicYear:
      initial?.academicYear ??
      `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    teacherId: "",
  });
  const set = (k: keyof ClassFormData, v: unknown) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = initial
        ? await updateClass(initial.id, form)
        : await createClass(form);
      if (res.success) {
        toast.success(initial ? "Class updated" : "Class created");
        onSuccess();
      } else toast.error(res.error);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="cl-name">Class Name *</Label>
        <Input
          id="cl-name"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. Grade 10A"
          required
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="cl-grade">Grade *</Label>
          <Select value={form.grade} onValueChange={(v) => set("grade", v)}>
            <SelectTrigger id="cl-grade">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {gradeOptions.map((gradeOption) => (
                <SelectItem key={gradeOption.grade} value={gradeOption.grade}>
                  {gradeOption.labelEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cl-sec">Section *</Label>
          <Input
            id="cl-sec"
            value={form.section}
            onChange={(e) => set("section", e.target.value)}
            placeholder="e.g. A"
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="cl-cap">Capacity</Label>
          <Input
            id="cl-cap"
            type="number"
            min={1}
            value={form.capacity}
            onChange={(e) => set("capacity", Number(e.target.value))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cl-room">Room Number</Label>
          <Input
            id="cl-room"
            value={form.roomNumber ?? ""}
            onChange={(e) => set("roomNumber", e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cl-year">Academic Year *</Label>
        <Input
          id="cl-year"
          value={form.academicYear}
          onChange={(e) => set("academicYear", e.target.value)}
          placeholder="e.g. 2024-2025"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label>Class Teacher</Label>
        <Select
          value={form.teacherId ? form.teacherId : NO_TEACHER_VALUE}
          onValueChange={(v) =>
            set("teacherId", v === NO_TEACHER_VALUE ? "" : v)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select class teacher" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_TEACHER_VALUE}>None</SelectItem>
            {teachers.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.firstName} {t.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Saving..." : initial ? "Update Class" : "Create Class"}
      </Button>
    </form>
  );
}

export function ClassesOnlyClient({
  classes,
  teachers,
  total,
  pages,
  currentPage,
}: Props) {
  const { t } = useT();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editClass, setEditClass] = useState<ClassRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [, startTransition] = useTransition();

  const confirmDelete = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      const res = await deleteClass(deleteTarget.id);
      if (res.success) {
        showMacDeleteToast({ entity: "Class", name: deleteTarget.name });
        router.refresh();
      } else {
        toast.error(res.error);
      }
      setDeleteTarget(null);
    });
  };

  return (
    <>
      <PageHeader
        title={t("class")}
        total={total}
        totalLabel={t("class")}
        description="Manage academic classes and class-teacher assignments"
      >
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => setEditClass(null)}
            >
              <Plus className="mr-1 h-4 w-4" /> Add Class
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editClass ? "Edit Class" : "Add Class"}</DialogTitle>
            </DialogHeader>
            <ClassForm
              initial={editClass ?? undefined}
              teachers={teachers}
              onSuccess={() => {
                setOpen(false);
                router.refresh();
              }}
            />
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="flex w-full flex-wrap items-center gap-3">
        <SearchInput placeholder="Search classes..." className="w-full sm:w-64" />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                {["Class", "Academic Year", "Room", "Class Teacher", "Students", "Capacity", ""].map(
                  (h) => (
                    <th
                      key={h}
                      className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {classes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    No classes found.
                  </td>
                </tr>
              ) : (
                classes.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.academicYear}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.roomNumber ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {c.classTeacher
                        ? `${c.classTeacher.firstName} ${c.classTeacher.lastName}`
                        : "—"}
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
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            setEditClass(c);
                            setOpen(true);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget({ id: c.id, name: c.name })}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DataTablePagination currentPage={currentPage} totalPages={pages} total={total} />

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(isOpen) => !isOpen && setDeleteTarget(null)}
      >
        <DialogContent className="max-w-md border-zinc-700/60 bg-gradient-to-b from-zinc-900/95 to-zinc-950/95 text-zinc-100 shadow-2xl backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-zinc-100">
              <span className="rounded-xl border border-red-400/40 bg-red-500/20 p-1.5">
                <TriangleAlert className="h-4 w-4 text-red-300" />
              </span>
              Confirm Deactivation
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-zinc-200">
              Deactivate class <span className="font-semibold">{deleteTarget?.name}</span>?
            </p>
            <p className="text-xs text-zinc-400">
              This keeps the record for audit/history and hides it from active lists.
            </p>
          </div>
          <div className="mt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-zinc-600 bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-red-600 text-white hover:bg-red-500"
              onClick={confirmDelete}
            >
              Deactivate
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
