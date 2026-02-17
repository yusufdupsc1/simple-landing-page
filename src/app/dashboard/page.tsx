import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/dashboard/stat-card";
import {
    Users,
    UserRound,
    TrendingUp,
    DollarSign,
    CheckCircle2,
    XCircle,
    Clock,
    Calendar,
    ArrowUpRight,
    Zap
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { DashboardCharts } from "@/components/dashboard/charts";

export default async function DashboardPage() {
    const [
        totalStudents,
        totalEmployees,
        totalRevenue,
        newAdmissions,
        absentStudents,
        presentEmployees,
    ] = await Promise.all([
        prisma.student.count(),
        prisma.employee.count(),
        prisma.feePayment.aggregate({
            _sum: { amount: true },
            where: { status: "paid" }
        }),
        prisma.student.findMany({
            orderBy: { admissionDate: 'desc' },
            take: 5,
            include: { class: true }
        }),
        prisma.attendance.findMany({
            where: {
                date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
                status: "absent"
            },
            include: { student: true }
        }),
        prisma.employeeAttendance.findMany({
            where: {
                date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
                status: "present"
            },
            include: { employee: true }
        }),
    ]);

    const revenueAmount = totalRevenue._sum.amount || 0;

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Top Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <StatCard
                    label="Active Students"
                    value={totalStudents.toLocaleString()}
                    subValue="+12% growth"
                    icon={Users}
                    variant="blue"
                />
                <StatCard
                    label="School Staff"
                    value={totalEmployees.toLocaleString()}
                    subValue="98% retention"
                    icon={UserRound}
                    variant="indigo"
                />
                <StatCard
                    label="Net Revenue"
                    value={formatCurrency(revenueAmount)}
                    subValue="+৳ 24,000 today"
                    icon={TrendingUp}
                    variant="pink"
                />
                <StatCard
                    label="Total Profit"
                    value={formatCurrency(revenueAmount * 0.4)}
                    subValue="40% margin"
                    icon={DollarSign}
                    variant="orange"
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                {/* Left Column: Analytics & Vital Stats */}
                <div className="xl:col-span-2 space-y-10">
                    {/* Welcome Banner - Editorial Style */}
                    <div className="bg-[#0f172a] rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group border border-white/5">
                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                            <div className="flex-1 space-y-4">
                                <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 px-4 py-1.5 rounded-full border border-blue-500/20">
                                    <Zap size={14} className="fill-blue-400" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">System Operational</span>
                                </div>
                                <h2 className="text-4xl font-black text-white tracking-tight">
                                    Good morning, <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Principal Admin</span>
                                </h2>
                                <p className="text-gray-400 text-sm leading-relaxed max-w-md font-medium">
                                    The school ecosystem is thriving. You have <span className="text-white font-bold">48 pending homework</span> reviews and <span className="text-white font-bold">12 new fee receipts</span> to acknowledge today.
                                </p>
                                <div className="flex gap-4 pt-2">
                                    <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl shadow-blue-600/20">
                                        View Schedule
                                    </button>
                                    <button className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all">
                                        System Logs
                                    </button>
                                </div>
                            </div>
                            <div className="shrink-0 relative">
                                <div className="w-48 h-48 bg-gradient-to-tr from-blue-600/20 to-indigo-600/20 rounded-[3rem] flex items-center justify-center p-8 backdrop-blur-xl border border-white/10">
                                    <div className="w-full h-full bg-blue-600/80 rounded-[2rem] flex items-center justify-center shadow-2xl relative">
                                        <Users className="text-white" size={48} />
                                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-500 border-4 border-[#0f172a] rounded-full flex items-center justify-center text-[10px] font-black">12</div>
                                    </div>
                                </div>
                                {/* Floating elements */}
                                <div className="absolute -left-6 top-4 p-3 bg-[#1e293b] rounded-2xl border border-white/5 shadow-2xl animate-bounce duration-[3000ms]">
                                    <CheckCircle2 size={20} className="text-green-400" />
                                </div>
                            </div>
                        </div>
                        {/* Background mesh */}
                        <div className="absolute right-0 top-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.1),transparent)] pointer-events-none"></div>
                    </div>

                    {/* Chart Container */}
                    <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-gray-100 flex flex-col gap-8 transition-all hover:shadow-xl hover:shadow-gray-100">
                        <div className="flex justify-between items-end">
                            <div>
                                <h3 className="text-2xl font-black text-[#1e266d] tracking-tight">Institutional Performance</h3>
                                <p className="text-sm text-gray-400 font-medium mt-1">Cross-referencing academic growth with financial stability.</p>
                            </div>
                            <button className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-widest hover:gap-3 transition-all">
                                Full Report <ArrowUpRight size={16} />
                            </button>
                        </div>
                        <DashboardCharts />
                    </div>

                    {/* Attendance Mini Widgets */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Today Absent Students */}
                        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden group hover:border-red-100 transition-colors">
                            <div className="p-6 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center px-8">
                                <h3 className="font-black text-[#1e266d] text-xs uppercase tracking-[0.15em]">Today&apos;s Absentees</h3>
                                <div className="w-8 h-8 bg-red-50 text-red-500 rounded-xl flex items-center justify-center">
                                    <XCircle size={18} />
                                </div>
                            </div>
                            <div className="p-8">
                                {absentStudents.length > 0 ? (
                                    <div className="space-y-6">
                                        {absentStudents.map((att) => (
                                            <div key={att.id} className="flex items-center justify-between group/item">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-500/10 to-red-600/10 text-red-600 flex items-center justify-center font-black text-xs uppercase shadow-sm">
                                                        {att.student.firstName[0]}{att.student.lastName[0]}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-[#1e266d]">{att.student.firstName} {att.student.lastName}</p>
                                                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-0.5">ID: {att.student.admissionNo}</p>
                                                    </div>
                                                </div>
                                                <button className="p-2 text-gray-300 hover:text-blue-600 transition-colors opacity-0 group-hover/item:opacity-100 italic font-black text-[10px]">Contact Parent</button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-10 text-center space-y-2">
                                        <div className="w-12 h-12 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <CheckCircle2 size={24} />
                                        </div>
                                        <p className="text-sm font-black text-[#1e266d] uppercase tracking-wider">Perfect Attendance!</p>
                                        <p className="text-xs text-gray-400 font-medium italic">No students are absent today.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Today Present Employees */}
                        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden group hover:border-green-100 transition-colors">
                            <div className="p-6 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center px-8">
                                <h3 className="font-black text-[#1e266d] text-xs uppercase tracking-[0.15em]">On-Duty Staff</h3>
                                <div className="w-8 h-8 bg-green-50 text-green-500 rounded-xl flex items-center justify-center">
                                    <CheckCircle2 size={18} />
                                </div>
                            </div>
                            <div className="p-8">
                                {presentEmployees.length > 0 ? (
                                    <div className="space-y-6">
                                        {presentEmployees.map((att) => (
                                            <div key={att.id} className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-green-500/10 to-green-600/10 text-green-600 flex items-center justify-center font-black text-xs uppercase shadow-sm">
                                                    {att.employee.firstName[0]}{att.employee.lastName[0]}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-[#1e266d]">{att.employee.firstName} {att.employee.lastName}</p>
                                                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-0.5">{att.employee.designation}</p>
                                                </div>
                                                <div className="ml-auto w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-10 text-center">
                                        <p className="text-sm italic text-gray-400 font-medium">Wait, no staff has checked in yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Mini Widgets & Context */}
                <div className="space-y-10">
                    {/* Estimated Fee Card - Bento Style */}
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden group hover:shadow-2xl transition-all">
                        <div className="p-8 border-b border-gray-100 px-10">
                            <h3 className="font-black text-[#1e266d] text-xs uppercase tracking-[0.2em] italic">Revenue Projections</h3>
                        </div>
                        <div className="p-10 flex flex-col items-center">
                            <div className="relative w-48 h-48 flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="96" cy="96" r="80" fill="transparent" stroke="#f1f5f9" strokeWidth="20" />
                                    <circle cx="96" cy="96" r="80" fill="transparent" stroke="#3730a3" strokeWidth="20" strokeDasharray="502" strokeDashoffset="125" strokeLinecap="round" className="drop-shadow-xl" />
                                </svg>
                                <div className="absolute text-center">
                                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1 leading-none">Yield</p>
                                    <p className="text-3xl font-black text-[#1e266d]">75%</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 w-full mt-10">
                                <div className="bg-indigo-50/50 p-5 rounded-[2rem] border border-indigo-100 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] uppercase font-black text-indigo-400 tracking-widest">Collections</p>
                                        <p className="text-xl font-black text-indigo-800">৳ 75K</p>
                                    </div>
                                    <div className="p-3 bg-white rounded-2xl shadow-sm">
                                        <TrendingUp size={20} className="text-indigo-600" />
                                    </div>
                                </div>
                                <div className="bg-orange-50/50 p-5 rounded-[2rem] border border-orange-100 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] uppercase font-black text-orange-400 tracking-widest">Projection</p>
                                        <p className="text-xl font-black text-orange-800">৳ 100K</p>
                                    </div>
                                    <div className="p-3 bg-white rounded-2xl shadow-sm">
                                        <Clock size={20} className="text-orange-600" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Progress Monitor */}
                    <div className="bg-[#1e1b4b] rounded-[2.5rem] p-10 shadow-2xl text-white space-y-10 relative overflow-hidden group">
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">Status Report</p>
                                    <h4 className="text-xl font-black text-white">Daily Vitality</h4>
                                </div>
                                <p className="text-2xl font-black text-blue-400 italic">Excellent</p>
                            </div>
                            <div className="h-[1px] w-full bg-white/10"></div>
                        </div>

                        {[
                            { label: "Student Presence", value: "85%", color: "bg-blue-500", shadow: "shadow-blue-500/40" },
                            { label: "Staff Availability", value: "94%", color: "bg-emerald-500", shadow: "shadow-emerald-500/40" },
                            { label: "Fee Realization", value: "75%", color: "bg-orange-500", shadow: "shadow-orange-500/40" }
                        ].map((item, i) => (
                            <div key={i} className="space-y-3">
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/50">{item.label}</span>
                                    <span className="text-xs font-black tracking-tighter">{item.value}</span>
                                </div>
                                <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden p-[2px]">
                                    <div className={cn("h-full rounded-full relative transition-all duration-1000", item.color, item.shadow)} style={{ width: item.value }}>
                                        <div className="absolute inset-0 bg-white/20 blur-[1px]"></div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <div className="absolute -left-20 -bottom-20 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl"></div>
                    </div>

                    {/* Calendar - Clean Aesthetic */}
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 group transition-all hover:bg-gray-50 cursor-pointer">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex flex-col items-center justify-center text-blue-600 border border-blue-100">
                                <span className="text-[10px] font-black uppercase leading-none mb-1">Feb</span>
                                <span className="text-2xl font-black leading-none">17</span>
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-[#1e266d] uppercase tracking-wider">Academic Scheduler</h4>
                                <p className="text-xs text-gray-400 font-bold mt-0.5 mt-1 uppercase italic">Upcoming: Parent Teacher Meeting</p>
                            </div>
                            <div className="ml-auto w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-300 group-hover:text-blue-600 transition-colors">
                                <Calendar size={20} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
