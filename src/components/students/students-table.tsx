import Link from "next/link";
import { formatDate } from "@/lib/utils";

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

type ClassRow = { id: string; name: string; grade: string; section: string };

interface Props {
  students: Student[];
  classes: ClassRow[];
  total: number;
  pages: number;
  currentPage: number;
}

export function StudentsTable({ students, total, pages, currentPage }: Props) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">Showing {students.length} of {total}</p>
        <p className="text-sm text-muted-foreground">Page {currentPage} / {Math.max(pages, 1)}</p>
      </div>
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="text-muted-foreground">
              <th className="pb-2">Student</th>
              <th className="pb-2 whitespace-nowrap">ID</th>
              <th className="pb-2 whitespace-nowrap">Class</th>
              <th className="pb-2">Email</th>
              <th className="pb-2 whitespace-nowrap">Status</th>
              <th className="pb-2 whitespace-nowrap">Joined</th>
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
                  <td className="py-2">{student.status}</td>
                  <td className="py-2">
                    {student.createdAt ? formatDate(student.createdAt) : "-"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="py-3 text-muted-foreground" colSpan={6}>
                  No students found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
