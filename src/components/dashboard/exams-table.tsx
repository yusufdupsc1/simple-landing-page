"use client";

import { DataTable } from "@/components/shared/data-table";
import { cn } from "@/lib/utils";
import { FileText, Calendar, Trophy, Percent, Clock, Target } from "lucide-react";

export function ExamsTable({ exams }: { exams: any[] }) {
  const columns = [
    {
      header: "Examination",
      accessorKey: "name" as const,
      cell: (item: any) => (
        <div className="flex items-center gap-4 group cursor-pointer">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100 shadow-sm transition-transform group-hover:scale-110">
            <Trophy size={20} className="fill-orange-100" />
          </div>
          <div>
            <p className="font-black text-[#1e266d] group-hover:text-orange-600 transition-colors tracking-tight">{item.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-black uppercase tracking-widest bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{item.type}</span>
              <span className="text-[10px] font-bold text-gray-400">| Academic Year 2025-26</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Grade Level",
      accessorKey: "class" as const,
      cell: (item: any) => (
        <span className="text-xs font-black text-gray-600 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
          {item.class.name}
        </span>
      ),
    },
    {
      header: "Schedule",
      accessorKey: "startDate" as const,
      cell: (item: any) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-600">
            <Calendar size={12} className="text-blue-500" />
            <span>{new Date(item.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            <span className="text-gray-300">-</span>
            <span>{new Date(item.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-wider">
            <Clock size={10} />
            <span>Upcoming</span>
          </div>
        </div>
      ),
    },
    {
      header: "Participation",
      accessorKey: "_count" as const,
      cell: (item: any) => (
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[8px] font-bold text-gray-500">
                S{i}
              </div>
            ))}
          </div>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            +{item._count?.results || 0} Students
          </span>
        </div>
      ),
    },
    {
      header: "Performance",
      accessorKey: "results" as const,
      cell: (item: any) => {
        const results = item.results || [];
        const avg = results.length > 0
          ? (results.reduce((acc: number, curr: any) => acc + curr.marksObtained, 0) / (results.length * 100)) * 100
          : 0;

        return (
          <div className="space-y-2 w-32">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Avg. Score</span>
              <span className={cn(
                "text-xs font-black",
                avg > 80 ? "text-green-600" : avg > 50 ? "text-blue-600" : "text-amber-600"
              )}>{Math.round(avg)}%</span>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden p-[1px]">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-1000 relative",
                  avg > 80 ? "bg-green-500" : avg > 50 ? "bg-blue-500" : "bg-amber-500"
                )}
                style={{ width: `${avg}%` }}
              >
                <div className="absolute inset-0 bg-white/20 blur-[1px]"></div>
              </div>
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      title="Examination Management"
      columns={columns}
      data={exams}
      onAdd={() => alert("Exam scheduling wizard coming soon!")}
    />
  );
}
