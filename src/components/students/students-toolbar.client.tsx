"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";
import Link from "next/link";
import { exportStudentsToCSV } from "@/server/actions/students";
import { convertToCSV, downloadCSV } from "@/lib/csv-export";
import { toast } from "sonner";

interface StudentsToolbarProps {
  total: number;
  currentPage: number;
  pages: number;
  hasStudents: boolean;
}

export function StudentsToolbar({
  total,
  currentPage,
  pages,
  hasStudents,
}: StudentsToolbarProps) {
  const [pending, startTransition] = useTransition();

  const handleExportCSV = async () => {
    startTransition(async () => {
      try {
        const result = await exportStudentsToCSV({});
        if (!result.success || !result.data) {
          toast.error(result.error || "Failed to export students");
          return;
        }

        const headers = [
          "studentId",
          "firstName",
          "lastName",
          "email",
          "phone",
          "dateOfBirth",
          "gender",
          "class",
          "status",
          "joinedDate",
        ];
        const headerLabels = [
          "Student ID",
          "First Name",
          "Last Name",
          "Email",
          "Phone",
          "Date of Birth",
          "Gender",
          "Class",
          "Status",
          "Joined Date",
        ];

        const csv = convertToCSV(result.data, headers, headerLabels);
        const timestamp = new Date().toISOString().slice(0, 10);
        downloadCSV(csv, `students_${timestamp}.csv`);
        toast.success(`Exported ${result.data.length} students`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Export failed");
      }
    });
  };

  return (
    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-0.5">
        <p className="text-sm text-muted-foreground">
          Showing {total} students
        </p>
        <p className="text-sm text-muted-foreground">
          Page {currentPage} / {Math.max(pages, 1)}
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          onClick={handleExportCSV}
          disabled={pending || !hasStudents}
          variant="outline"
        >
          <Download className="mr-1.5 h-4 w-4" />
          Export CSV
        </Button>
        <Link href="?dialog=create" scroll={false}>
          <Button type="button" size="sm" disabled={pending}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Student
          </Button>
        </Link>
      </div>
    </div>
  );
}
