"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Edit3, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  showMacDeleteToast,
  showMacStatusToast,
} from "@/components/ui/macos-toast";
import { setStudentStatus } from "@/server/actions/students";

type Student = {
  id: string;
  firstName: string;
  lastName: string;
  status: string;
};

interface StudentRowActionsProps {
  student: Student;
}

export function StudentRowActions({ student }: StudentRowActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleToggleActive = () => {
    const targetStatus = student.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    startTransition(async () => {
      const res = await setStudentStatus(
        student.id,
        targetStatus as "ACTIVE" | "INACTIVE",
      );
      if (res.success) {
        showMacStatusToast({
          entity: "Student",
          status: targetStatus,
          name: `${student.firstName} ${student.lastName}`,
        });
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  const handleDelete = async () => {
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

        showMacDeleteToast({
          entity: "Student",
          name: `${student.firstName} ${student.lastName}`,
        });
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to delete student",
        );
      }
    });
  };

  return (
    <div className="flex items-center justify-end gap-2 text-right">
      <Link href={`?edit=${student.id}`} scroll={false}>
        <Button type="button" size="sm" variant="outline" disabled={pending}>
          <Edit3 className="mr-1 h-3.5 w-3.5" /> Edit
        </Button>
      </Link>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={handleToggleActive}
        disabled={pending}
      >
        {student.status === "ACTIVE" ? (
          <>
            <ToggleRight className="mr-1 h-3.5 w-3.5 text-green-600" />
            Deactivate
          </>
        ) : (
          <>
            <ToggleLeft className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
            Activate
          </>
        )}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="destructive"
        onClick={handleDelete}
        disabled={pending}
      >
        <Trash2 className="mr-1 h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
