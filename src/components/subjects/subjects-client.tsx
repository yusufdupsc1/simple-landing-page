"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, BookOpen, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
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
  createSubject,
  updateSubject,
  deleteSubject,
  type SubjectFormData,
} from "@/server/actions/classes";

type Subject = {
  id: string;
  name: string;
  code: string;
  credits: number;
  isCore: boolean;
  _count: { teachers: number; grades: number };
};

interface Props {
  subjects: Subject[];
}

type DeleteTarget = { id: string; name: string } | null;

function SubjectForm({
  initial,
  onSuccess,
}: {
  initial?: Subject;
  onSuccess: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<SubjectFormData>({
    name: initial?.name ?? "",
    code: initial?.code ?? "",
    description: "",
    credits: initial?.credits ?? 1,
    isCore: initial?.isCore ?? true,
  });

  const set = (k: keyof SubjectFormData, v: unknown) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = initial
        ? await updateSubject(initial.id, form)
        : await createSubject(form);
      if (res.success) {
        toast.success(initial ? "Subject updated" : "Subject created");
        onSuccess();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="sub-name">Subject Name *</Label>
        <Input
          id="sub-name"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          required
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="sub-code">Code *</Label>
          <Input
            id="sub-code"
            value={form.code}
            onChange={(e) => set("code", e.target.value)}
            placeholder="e.g. MATH101"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sub-cred">Credits</Label>
          <Input
            id="sub-cred"
            type="number"
            min={1}
            value={form.credits}
            onChange={(e) => set("credits", Number(e.target.value))}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Type</Label>
        <Select
          value={form.isCore ? "core" : "elective"}
          onValueChange={(v) => set("isCore", v === "core")}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
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

export function SubjectsClient({ subjects }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editSubject, setEditSubject] = useState<Subject | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [, startTransition] = useTransition();

  const confirmDelete = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      const res = await deleteSubject(deleteTarget.id);
      if (res.success) {
        showMacDeleteToast({ entity: "Subject", name: deleteTarget.name });
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
        title="Subjects"
        total={subjects.length}
        totalLabel="subjects"
        description="Manage curriculum subjects, codes, and core/elective status"
      >
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => setEditSubject(null)}
            >
              <Plus className="mr-1 h-4 w-4" /> Add Subject
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editSubject ? "Edit Subject" : "Add Subject"}
              </DialogTitle>
            </DialogHeader>
            <SubjectForm
              initial={editSubject ?? undefined}
              onSuccess={() => {
                setOpen(false);
                router.refresh();
              }}
            />
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="flex w-full flex-wrap items-center gap-3">
        <SearchInput placeholder="Search subjects..." className="w-full sm:w-64" />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                {["Subject", "Code", "Credits", "Type", "Teachers", ""].map((h) => (
                  <th
                    key={h}
                    className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {subjects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    No subjects found.
                  </td>
                </tr>
              ) : (
                subjects.map((subject) => (
                  <tr key={subject.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{subject.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {subject.code}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{subject.credits}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          subject.isCore
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {subject.isCore ? "Core" : "Elective"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <BookOpen className="h-3.5 w-3.5" />
                        {subject._count.teachers}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            setEditSubject(subject);
                            setOpen(true);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() =>
                            setDeleteTarget({ id: subject.id, name: subject.name })
                          }
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
              Deactivate subject <span className="font-semibold">{deleteTarget?.name}</span>?
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
