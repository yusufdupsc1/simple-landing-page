"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Edit3, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Student = {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  classId?: string | null;
  status: string;
  createdAt: string | null;
  class: { name: string; grade: string; section: string } | null;
};

type ClassRow = { id: string; name: string; grade: string; section: string };

interface Props {
  students: Student[];
  classes: ClassRow[];
  total: number;
  pages: number;
  currentPage: number;
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-500/10 text-green-600",
  INACTIVE: "bg-red-500/10 text-red-600",
  GRADUATED: "bg-blue-500/10 text-blue-600",
  SUSPENDED: "bg-yellow-500/10 text-yellow-600",
  EXPELLED: "bg-destructive/10 text-destructive",
  TRANSFERRED: "bg-muted text-muted-foreground",
};

type EditState = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: "MALE" | "FEMALE" | "OTHER" | "";
  classId: string;
  address: string;
  city: string;
  country: string;
};

type CreateState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: "MALE" | "FEMALE" | "OTHER" | "";
  classId: string;
  address: string;
  city: string;
  country: string;
  parentFirstName: string;
  parentLastName: string;
  parentEmail: string;
  parentPhone: string;
  parentRelation: string;
};

function toDateInputValue(value?: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

function getInitialCreateState(): CreateState {
  return {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    classId: "",
    address: "",
    city: "",
    country: "Bangladesh",
    parentFirstName: "",
    parentLastName: "",
    parentEmail: "",
    parentPhone: "",
    parentRelation: "Guardian",
  };
}

export function StudentsTable({ students, classes, total, pages, currentPage }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState<CreateState>(getInitialCreateState());
  const [editing, setEditing] = useState<EditState | null>(null);

  const classOptions = useMemo(() => classes, [classes]);

  function openEditor(student: Student) {
    setEditing({
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email ?? "",
      phone: student.phone ?? "",
      dateOfBirth: toDateInputValue(student.dateOfBirth),
      gender: ((student.gender as "MALE" | "FEMALE" | "OTHER" | null) ?? "") as
        | "MALE"
        | "FEMALE"
        | "OTHER"
        | "",
      classId: student.classId ?? "",
      address: student.address ?? "",
      city: student.city ?? "",
      country: student.country ?? "",
    });
  }

  function updateEdit<K extends keyof EditState>(key: K, value: EditState[K]) {
    setEditing((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function updateCreate<K extends keyof CreateState>(key: K, value: CreateState[K]) {
    setCreating((prev) => ({ ...prev, [key]: value }));
  }

  function resetCreateForm() {
    setCreating(getInitialCreateState());
  }

  async function handleCreate() {
    if (!creating.firstName.trim() || !creating.lastName.trim()) {
      toast.error("First name and last name are required");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/v1/students", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            firstName: creating.firstName.trim(),
            lastName: creating.lastName.trim(),
            email: creating.email.trim(),
            phone: creating.phone.trim(),
            dateOfBirth: creating.dateOfBirth || undefined,
            gender: creating.gender || undefined,
            classId: creating.classId || undefined,
            address: creating.address.trim(),
            city: creating.city.trim(),
            country: creating.country.trim(),
            parentFirstName: creating.parentFirstName.trim(),
            parentLastName: creating.parentLastName.trim(),
            parentEmail: creating.parentEmail.trim(),
            parentPhone: creating.parentPhone.trim(),
            parentRelation: creating.parentRelation.trim(),
          }),
        });

        const json = await res.json();
        if (!res.ok || json?.error) {
          throw new Error(json?.error?.message ?? "Failed to create student");
        }

        toast.success("Student created");
        setCreateOpen(false);
        resetCreateForm();
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to create student");
      }
    });
  }

  async function handleSave() {
    if (!editing) return;

    startTransition(async () => {
      try {
        const res = await fetch(`/api/v1/students/${editing.id}`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            firstName: editing.firstName,
            lastName: editing.lastName,
            email: editing.email,
            phone: editing.phone,
            dateOfBirth: editing.dateOfBirth || undefined,
            gender: editing.gender || undefined,
            classId: editing.classId || undefined,
            address: editing.address,
            city: editing.city,
            country: editing.country,
          }),
        });

        const json = await res.json();
        if (!res.ok || json?.error) {
          throw new Error(json?.error?.message ?? "Failed to update student");
        }

        toast.success("Student updated");
        setEditing(null);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to update student");
      }
    });
  }

  async function handleDelete(student: Student) {
    const confirmed = window.confirm(
      `Delete ${student.firstName} ${student.lastName}? This will deactivate the student record.`,
    );

    if (!confirmed) return;

    startTransition(async () => {
      try {
        const res = await fetch(`/api/v1/students/${student.id}`, {
          method: "DELETE",
        });

        const json = await res.json();
        if (!res.ok || json?.error) {
          throw new Error(json?.error?.message ?? "Failed to delete student");
        }

        toast.success("Student deleted");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to delete student");
      }
    });
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-0.5">
          <p className="text-sm text-muted-foreground">Showing {students.length} of {total}</p>
          <p className="text-sm text-muted-foreground">Page {currentPage} / {Math.max(pages, 1)}</p>
        </div>
        <Button type="button" size="sm" onClick={() => setCreateOpen(true)} disabled={pending}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add Student
        </Button>
      </div>
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="text-muted-foreground">
              <th className="pb-2">Student</th>
              <th className="pb-2 whitespace-nowrap">ID</th>
              <th className="pb-2 whitespace-nowrap">Class</th>
              <th className="pb-2">Email</th>
              <th className="pb-2 whitespace-nowrap">Status</th>
              <th className="pb-2 whitespace-nowrap">Joined</th>
              <th className="pb-2 whitespace-nowrap text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.length ? (
              students.map((student) => (
                <tr key={student.id} className="border-t border-border/60">
                  <td className="py-2 font-medium">
                    <Link href={`/dashboard/students?search=${encodeURIComponent(student.studentId)}`} className="hover:underline">
                      {student.firstName} {student.lastName}
                    </Link>
                  </td>
                  <td className="py-2">{student.studentId}</td>
                  <td className="py-2">{student.class?.name ?? "-"}</td>
                  <td className="py-2">{student.email ?? "-"}</td>
                  <td className="py-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_COLORS[student.status] ?? "bg-muted text-muted-foreground"
                      }`}
                    >
                      {student.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-2">{student.createdAt ? formatDate(student.createdAt) : "-"}</td>
                  <td className="py-2">
                    <div className="flex items-center justify-end gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => openEditor(student)} disabled={pending}>
                        <Edit3 className="mr-1 h-3.5 w-3.5" /> Edit
                      </Button>
                      <Button type="button" size="sm" variant="destructive" onClick={() => handleDelete(student)} disabled={pending}>
                        <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="py-3 text-muted-foreground" colSpan={7}>
                  No students found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) resetCreateForm();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
            <DialogDescription>Create a student profile and optional guardian details.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="create-firstName">First Name *</Label>
                <Input id="create-firstName" value={creating.firstName} onChange={(e) => updateCreate("firstName", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="create-lastName">Last Name *</Label>
                <Input id="create-lastName" value={creating.lastName} onChange={(e) => updateCreate("lastName", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="create-email">Email</Label>
                <Input id="create-email" type="email" value={creating.email} onChange={(e) => updateCreate("email", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="create-phone">Phone</Label>
                <Input id="create-phone" value={creating.phone} onChange={(e) => updateCreate("phone", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="create-dob">Date of Birth</Label>
                <Input id="create-dob" type="date" value={creating.dateOfBirth} onChange={(e) => updateCreate("dateOfBirth", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="create-gender">Gender</Label>
                <select
                  id="create-gender"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={creating.gender}
                  onChange={(e) => updateCreate("gender", e.target.value as CreateState["gender"])}
                >
                  <option value="">Select gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="create-class">Class</Label>
                <select
                  id="create-class"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={creating.classId}
                  onChange={(e) => updateCreate("classId", e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {classOptions.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="create-address">Address</Label>
                <Input id="create-address" value={creating.address} onChange={(e) => updateCreate("address", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="create-city">City</Label>
                <Input id="create-city" value={creating.city} onChange={(e) => updateCreate("city", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="create-country">Country</Label>
                <Input id="create-country" value={creating.country} onChange={(e) => updateCreate("country", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="create-parentFirstName">Guardian First Name</Label>
                <Input id="create-parentFirstName" value={creating.parentFirstName} onChange={(e) => updateCreate("parentFirstName", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="create-parentLastName">Guardian Last Name</Label>
                <Input id="create-parentLastName" value={creating.parentLastName} onChange={(e) => updateCreate("parentLastName", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="create-parentEmail">Guardian Email</Label>
                <Input id="create-parentEmail" type="email" value={creating.parentEmail} onChange={(e) => updateCreate("parentEmail", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="create-parentPhone">Guardian Phone</Label>
                <Input id="create-parentPhone" value={creating.parentPhone} onChange={(e) => updateCreate("parentPhone", e.target.value)} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="create-parentRelation">Guardian Relation</Label>
                <Input id="create-parentRelation" value={creating.parentRelation} onChange={(e) => updateCreate("parentRelation", e.target.value)} />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={pending}>
                Cancel
              </Button>
              <Button type="button" onClick={handleCreate} disabled={pending}>
                Create Student
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>Update student profile and class assignment.</DialogDescription>
          </DialogHeader>

          {editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-firstName">First Name</Label>
                  <Input id="edit-firstName" value={editing.firstName} onChange={(e) => updateEdit("firstName", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-lastName">Last Name</Label>
                  <Input id="edit-lastName" value={editing.lastName} onChange={(e) => updateEdit("lastName", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input id="edit-email" type="email" value={editing.email} onChange={(e) => updateEdit("email", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input id="edit-phone" value={editing.phone} onChange={(e) => updateEdit("phone", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-dob">Date of Birth</Label>
                  <Input id="edit-dob" type="date" value={editing.dateOfBirth} onChange={(e) => updateEdit("dateOfBirth", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-gender">Gender</Label>
                  <select
                    id="edit-gender"
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={editing.gender}
                    onChange={(e) => updateEdit("gender", e.target.value as EditState["gender"])}
                  >
                    <option value="">Select gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="edit-class">Class</Label>
                  <select
                    id="edit-class"
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={editing.classId}
                    onChange={(e) => updateEdit("classId", e.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {classOptions.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="edit-address">Address</Label>
                  <Input id="edit-address" value={editing.address} onChange={(e) => updateEdit("address", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-city">City</Label>
                  <Input id="edit-city" value={editing.city} onChange={(e) => updateEdit("city", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-country">Country</Label>
                  <Input id="edit-country" value={editing.country} onChange={(e) => updateEdit("country", e.target.value)} />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditing(null)} disabled={pending}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleSave} disabled={pending}>
                  Save Changes
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
