"use client";

import { BarChart, FileText, PieChart, TrendingUp, Download, Printer, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ReportsPage() {
    const reports = [
        {
            title: "Student Attendance Report",
            description: "Monthly attendance analysis for all classes",
            icon: BarChart,
            color: "text-blue-600",
            bg: "bg-blue-50",
            date: "Generated: Today, 10:00 AM"
        },
        {
            title: "Fee Collection Statement",
            description: "Detailed breakdown of collected and pending fees",
            icon: TrendingUp,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            date: "Generated: Yesterday"
        },
        {
            title: "Academic Performance",
            description: "Term-wise examination results and grading",
            icon: PieChart,
            color: "text-purple-600",
            bg: "bg-purple-50",
            date: "Generated: 2 days ago"
        },
        {
            title: "Payroll Summary",
            description: "Employee salary disbursement and deductions",
            icon: FileText,
            color: "text-orange-600",
            bg: "bg-orange-50",
            date: "Quarterly Report"
        },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-[#1e266d] tracking-tight">System Reports</h1>
                    <p className="text-gray-400 text-sm font-bold mt-1 uppercase tracking-widest">Generate and download analytical data.</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
                        <Filter size={16} /> Filter
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-[#1e266d] text-white rounded-xl text-xs font-bold hover:bg-blue-900 transition-colors shadow-lg">
                        <Download size={16} /> Export All
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reports.map((report, idx) => (
                    <div key={idx} className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 group hover:shadow-xl transition-all cursor-pointer relative overflow-hidden">
                        <div className="flex items-start justify-between mb-6">
                            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500", report.bg)}>
                                <report.icon size={28} className={report.color} />
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600">
                                    <Printer size={18} />
                                </button>
                                <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600">
                                    <Download size={18} />
                                </button>
                            </div>
                        </div>

                        <h3 className="text-lg font-black text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">{report.title}</h3>
                        <p className="text-sm text-gray-500 font-medium leading-relaxed">{report.description}</p>

                        <div className="mt-6 pt-6 border-t border-gray-50 flex justify-between items-center">
                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{report.date}</span>
                            <span className="text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">View Details →</span>
                        </div>

                        <div className="absolute -right-12 -bottom-12 w-40 h-40 bg-gray-50 rounded-full blur-3xl group-hover:bg-blue-50/50 transition-colors duration-700"></div>
                    </div>
                ))}
            </div>
        </div>
    );
}
