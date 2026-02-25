import { formatCurrency } from "@/lib/utils";

interface RevenueRow {
  paidAt: Date;
  _sum: { amount: number | null };
}

export function RevenueChart({ data }: { data: RevenueRow[] }) {
  return (
    <section className="group h-full rounded-3xl border border-border/50 bg-card p-6 shadow-sm hover:border-border transition-colors relative overflow-hidden flex flex-col">
      <div className="absolute inset-0 bg-gradient-to-bl from-amber-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <h2 className="mb-6 text-lg font-semibold tracking-tight relative z-10 flex items-center justify-between">
        Revenue (This Year)
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600">YTD</span>
      </h2>
      <div className="space-y-3 relative z-10 flex-1 flex flex-col justify-center">
        {data.length ? (
          data.map((row, idx) => (
            <div key={`${row.paidAt.toISOString()}-${idx}`} className="flex items-center justify-between rounded-xl bg-muted/30 px-4 py-3 text-sm hover:bg-muted/60 transition-colors border border-border/40">
              <span className="font-medium text-muted-foreground">{row.paidAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              <span className="font-bold text-foreground">{formatCurrency(Number(row._sum.amount ?? 0))}</span>
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-border rounded-xl bg-muted/10">
            <p className="text-sm font-medium text-muted-foreground">No payments recorded yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Invoices will appear here.</p>
          </div>
        )}
      </div>
    </section>
  );
}
