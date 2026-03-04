import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { UserPlus, ArrowRight } from "lucide-react";

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
    <section className="group relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-border/40 bg-card/60 backdrop-blur-xl p-6 shadow-sm transition-premium hover:border-primary/20 premium-shadow">
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col">
          <h2 className="text-lg font-black tracking-tight text-foreground/90">
            New Admissions
          </h2>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Recent Enrollments
          </p>
        </div>
        <Link
          href="/dashboard/students"
          className="text-[11px] font-bold text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors uppercase tracking-widest leading-none"
        >
          Registry <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="space-y-3 flex-1">
        {students.length ? (
          students.map((student, i) => (
            <div
              key={student.id}
              className="flex items-center justify-between rounded-2xl border border-border/40 bg-muted/20 px-4 py-3 hover:bg-card hover:border-border hover:shadow-md transition-premium group/item"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex items-center gap-4">
                <div className="h-11 w-11 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-black text-xs shadow-inner">
                  {student.firstName[0]}
                  {student.lastName[0]}
                </div>
                <div>
                  <p className="text-sm font-black text-foreground/90 leading-none mb-1">
                    {student.firstName} {student.lastName}
                  </p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                    ID: {student.studentId}{" "}
                    {student.class?.name ? `• ${student.class.name}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-tighter">
                  Joined
                </span>
                <p className="text-[11px] font-bold text-muted-foreground">
                  {student.createdAt ? formatDate(student.createdAt) : "—"}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="h-48 flex flex-col items-center justify-center p-6 border-2 border-dashed border-border/60 rounded-[1.5rem] bg-muted/10">
            <div className="h-12 w-12 rounded-full bg-primary/5 flex items-center justify-center mb-4">
              <UserPlus className="h-6 w-6 text-muted-foreground/30" />
            </div>
            <p className="text-sm font-bold text-muted-foreground/60">
              No recent enrollments
            </p>
            <p className="text-[10px] text-muted-foreground/40 mt-1 uppercase tracking-widest text-center">
              New student data will appear here
            </p>
            <button className="mt-4 px-4 py-2 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary/20 transition-colors">
              Add First Student
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
