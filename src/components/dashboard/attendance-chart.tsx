import { formatDate } from "@/lib/utils";

interface AttendanceRow {
  date: Date;
  status: string;
  _count: number;
}

export function AttendanceChart({ data }: { data: AttendanceRow[] }) {
  return (
    <section className="group h-full rounded-3xl border border-border/50 bg-card p-6 shadow-sm hover:border-border transition-colors relative overflow-hidden flex flex-col">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <h2 className="mb-6 text-lg font-semibold tracking-tight relative z-10 flex items-center justify-between">
        Attendance (Last 30 Days)
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600">Overview</span>
      </h2>
      <div className="flex-1 relative z-10">
        <div className="max-h-72 overflow-auto pr-2 custom-scrollbar">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-card z-20">
              <tr className="text-muted-foreground border-b border-border/40">
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium text-right">Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {data.length ? (
                data.map((row, idx) => (
                  <tr key={`${row.date.toISOString()}-${row.status}-${idx}`} className="group/row hover:bg-muted/30 transition-colors">
                    <td className="py-3 pl-2 tabular-nums">{formatDate(row.date)}</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                        ${row.status === "PRESENT" ? "bg-emerald-500/10 text-emerald-600" :
                          row.status === "ABSENT" ? "bg-red-500/10 text-red-600" :
                            row.status === "LATE" ? "bg-amber-500/10 text-amber-600" :
                              "bg-muted text-muted-foreground"}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3 pr-2 text-right font-medium">{row._count}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-8 text-center" colSpan={3}>
                    <div className="flex flex-col items-center justify-center p-6 border border-dashed border-border rounded-xl bg-muted/10">
                      <p className="text-sm font-medium text-muted-foreground">No attendance data available.</p>
                      <p className="text-xs text-muted-foreground mt-1">Submit attendance records to see trends.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
