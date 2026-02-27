// src/components/analytics/analytics-client.tsx
"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { format } from "date-fns";
import { PageHeader } from "@/components/ui/page-header";
import { formatCurrency } from "@/lib/utils";

type AttendanceSummary = { total: number; present: number; absent: number; late: number; excused: number; presentRate: number };
type TrendPoint = { date: string | null; status: string; _count: number };
type GradeDist = { letterGrade: string | null; _count: number }[];
type FinanceSummary = {
    totalFees: { amount: number; count: number };
    paidFees: { amount: number; count: number };
    pendingFees: { amount: number; count: number };
    overdueCount: number;
};
type StatGroup = { status: string; _count: number }[];

interface Props {
    attendanceSummary: AttendanceSummary;
    attendanceTrend: TrendPoint[];
    gradeDistribution: GradeDist;
    financeSummary: FinanceSummary;
    studentStats: StatGroup;
    teacherStats: StatGroup;
}

const GRADE_COLORS: Record<string, string> = {
    "A+": "#22c55e", A: "#84cc16", "B+": "#3b82f6", B: "#6366f1",
    "C+": "#f59e0b", C: "#f97316", D: "#ef4444", F: "#dc2626",
};

const ATTENDANCE_COLORS: Record<string, string> = {
    PRESENT: "#22c55e", ABSENT: "#ef4444", LATE: "#f59e0b", EXCUSED: "#3b82f6",
};

export function AnalyticsClient({
    attendanceSummary, attendanceTrend, gradeDistribution,
    financeSummary, studentStats, teacherStats,
}: Props) {

    // Transform attendance trend into date-grouped chart data
    const trendByDate: Record<string, Record<string, number>> = {};
    attendanceTrend.forEach(({ date, status, _count }) => {
        if (!date) return;
        const d = format(new Date(date), "MMM d");
        if (!trendByDate[d]) trendByDate[d] = {};
        trendByDate[d][status] = _count;
    });
    const trendData = Object.entries(trendByDate).slice(-14).map(([date, counts]) => ({ date, ...counts }));

    // Grade distribution for pie
    const gradeData = gradeDistribution.map(d => ({
        name: d.letterGrade ?? "—", value: d._count,
        fill: GRADE_COLORS[d.letterGrade ?? ""] ?? "#94a3b8",
    }));

    // Finance bar data
    const financeData = [
        { name: "Total", value: financeSummary.totalFees.amount },
        { name: "Collected", value: financeSummary.paidFees.amount },
        { name: "Pending", value: financeSummary.pendingFees.amount },
    ];

    const kpis = [
        { label: "Attendance Rate", value: `${attendanceSummary.presentRate}%`, color: "text-green-600" },
        { label: "Present (30d)", value: attendanceSummary.present, color: "text-foreground" },
        { label: "Absent (30d)", value: attendanceSummary.absent, color: "text-red-600" },
        { label: "Total Collected", value: formatCurrency(financeSummary.paidFees.amount), color: "text-foreground" },
        { label: "Outstanding Fees", value: formatCurrency(financeSummary.pendingFees.amount), color: "text-yellow-600" },
        { label: "Overdue Fees", value: financeSummary.overdueCount, color: "text-destructive" },
    ];

    return (
        <>
            <PageHeader title="Analytics" description="Institution-wide insights across all modules" />

            {/* KPI Strip */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
                {kpis.map(({ label, value, color }) => (
                    <div key={label} className="rounded-xl border border-border bg-card p-3 sm:p-4">
                        <p className="text-xs text-muted-foreground mb-1">{label}</p>
                        <p className={`text-lg font-bold sm:text-xl ${color}`}>{value}</p>
                    </div>
                ))}
            </div>

            {/* Attendance Trend */}
            <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
                <h2 className="font-semibold text-sm mb-4">Attendance Trend — Last 14 Days</h2>
                {trendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={trendData} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                            <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                            {(["PRESENT", "ABSENT", "LATE"] as const).map(s => (
                                <Line key={s} type="monotone" dataKey={s} stroke={ATTENDANCE_COLORS[s]} strokeWidth={2} dot={false} />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-60 flex items-center justify-center text-muted-foreground text-sm">No attendance data in the last 14 days.</div>
                )}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Grade Distribution */}
                <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
                    <h2 className="font-semibold text-sm mb-4">Grade Distribution</h2>
                    {gradeData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                                <Pie data={gradeData} cx="50%" cy="50%" outerRadius={88} dataKey="value" paddingAngle={3}>
                                    {gradeData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                                </Pie>
                                <Legend wrapperStyle={{ fontSize: 12 }} />
                                <Tooltip formatter={(v: number) => [`${v} records`]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-60 flex items-center justify-center text-muted-foreground text-sm">No grade records yet.</div>
                    )}
                </div>

                {/* Finance Overview */}
                <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
                    <h2 className="font-semibold text-sm mb-4">Finance Overview</h2>
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={financeData} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                            <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                            <Tooltip formatter={(v: number) => [formatCurrency(v), "Amount"]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                {financeData.map((_, i) => <Cell key={i} fill={i === 0 ? "#6366f1" : i === 1 ? "#22c55e" : "#f59e0b"} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* People Stats */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {[
                    { title: "Students by Status", data: studentStats },
                    { title: "Teachers by Status", data: teacherStats },
                ].map(({ title, data }) => (
                    <div key={title} className="rounded-xl border border-border bg-card p-5">
                        <h2 className="font-semibold text-sm mb-3">{title}</h2>
                        <div className="space-y-2">
                            {data.map(({ status, _count }) => (
                                <div key={status} className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">{status.replace("_", " ")}</span>
                                    <span className="font-semibold text-sm">{_count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}
