import Link from "next/link";
import { formatDate } from "@/lib/utils";

interface StudentItem {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
  createdAt: string | null;
  class: { name: string } | null;
}

export function RecentStudents({ students }: { students: StudentItem[] }) {
  return (
    <section className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border/50 bg-card p-4 shadow-sm transition-colors hover:border-border sm:p-6">
      <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative z-10 mb-6 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold tracking-tight">Recent Enrollments</h2>
        <Link className="text-sm font-medium text-primary hover:text-primary/80 transition-colors" href="/dashboard/students">
          View directory &rarr;
        </Link>
      </div>
      <div className="space-y-3 flex-1 relative z-10">
        {students.length ? (
          students.map((student) => (
            <div key={student.id} className="flex items-center justify-between rounded-2xl border border-border/40 bg-muted/20 px-4 py-3 hover:bg-muted/50 transition-colors group/item">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                  {student.firstName[0]}{student.lastName[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold">{student.firstName} {student.lastName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{student.studentId} {student.class?.name ? `• ${student.class.name}` : ""}</p>
                </div>
              </div>
              <p className="text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                {student.createdAt ? formatDate(student.createdAt) : "—"}
              </p>
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-6 border border-dashed border-border rounded-xl bg-muted/10">
            <p className="text-sm font-medium text-muted-foreground">No students found.</p>
            <p className="text-xs text-muted-foreground mt-1">Enrollments will appear here.</p>
          </div>
        )}
      </div>
    </section>
  );
}
