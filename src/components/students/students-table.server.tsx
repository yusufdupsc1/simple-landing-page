import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { StudentRowActions } from "./student-row-actions.client";

type Student = {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  status: string;
  createdAt: string | null;
  class: { name: string; grade: string; section: string } | null;
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-500/10 text-green-600",
  INACTIVE: "bg-red-500/10 text-red-600",
  GRADUATED: "bg-blue-500/10 text-blue-600",
  SUSPENDED: "bg-yellow-500/10 text-yellow-600",
  EXPELLED: "bg-destructive/10 text-destructive",
  TRANSFERRED: "bg-muted text-muted-foreground",
};

interface StudentsTableServerProps {
  students: Student[];
}

export function StudentsTableServer({ students }: StudentsTableServerProps) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <table className="table-dense w-full min-w-[760px] text-left text-sm">
        <thead>
          <tr className="text-muted-foreground">
            <th className="whitespace-nowrap">Student</th>
            <th className="whitespace-nowrap">ID</th>
            <th className="whitespace-nowrap">Class</th>
            <th>Email</th>
            <th className="whitespace-nowrap">Status</th>
            <th className="whitespace-nowrap">Joined</th>
            <th className="whitespace-nowrap text-right pr-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.length ? (
            students.map((student) => {
              const statusKey = student.status.trim().toUpperCase();
              const statusLabel = statusKey.replace("_", " ");

              return (
                <tr key={student.id}>
                  <td className="font-medium">
                    <Link
                      href={`/dashboard/students/${student.id}`}
                      className="hover:underline"
                    >
                      {student.firstName} {student.lastName}
                    </Link>
                  </td>
                  <td>{student.studentId}</td>
                  <td>{student.class?.name ?? "-"}</td>
                  <td>{student.email ?? "-"}</td>
                  <td>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_COLORS[statusKey] ??
                        "bg-muted text-muted-foreground"
                      }`}
                    >
                      {statusLabel}
                    </span>
                  </td>
                  <td>
                    {student.createdAt ? formatDate(student.createdAt) : "-"}
                  </td>
                  <td>
                    <StudentRowActions student={student} />
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td className="text-muted-foreground" colSpan={7}>
                No students found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
