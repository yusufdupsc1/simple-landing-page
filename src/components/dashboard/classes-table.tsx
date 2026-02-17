"use client";

import { DataTable } from "@/components/shared/data-table";
import { cn } from "@/lib/utils";
import { User, Users, ShieldCheck } from "lucide-react";

export function ClassesTable({ classes }: { classes: any[] }) {
    const columns = [
        {
            header: "Class Name",
            accessorKey: "name" as const,
            cell: (item: any) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-sm">
                        <ShieldCheck size={20} className="fill-blue-50" />
                    </div>
                    <div>
                        <p className="font-black text-[#1e266d] tracking-tight">{item.name}</p>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.1em]">Academic Tier</p>
                    </div>
                </div>
            ),
        },
        {
            header: "Section",
            accessorKey: "section" as const,
            cell: (item: any) => (
                <span className="px-3 py-1 bg-white rounded-xl text-[10px] font-black uppercase tracking-widest text-[#1e266d] border border-gray-100 shadow-sm">
                    Dept {item.section}
                </span>
            ),
        },
        {
            header: "Class Teacher",
            accessorKey: "classTeacher" as const,
            cell: (item: any) => (
                item.classTeacher ? (
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100">
                            <User size={14} className="text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-gray-700 leading-none">
                                {item.classTeacher.firstName} {item.classTeacher.lastName}
                            </p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Mentor</p>
                        </div>
                    </div>
                ) : (
                    <span className="text-[10px] font-black text-gray-400 uppercase italic tracking-widest">Unassigned</span>
                )
            ),
        },
        {
            header: "Allocation",
            accessorKey: "_count" as const,
            cell: (item: any) => {
                const enrollment = item._count?.students || 0;
                const percentage = Math.round((enrollment / item.capacity) * 100);
                return (
                    <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{enrollment} Students</span>
                            <span className="text-[10px] font-black text-blue-600 italic">{percentage}%</span>
                        </div>
                        <div className="h-2 w-32 bg-gray-50 rounded-full overflow-hidden p-[1px] border border-gray-100">
                            <div
                                className={cn(
                                    "h-full rounded-full transition-all duration-1000",
                                    percentage > 90 ? "bg-rose-500" : "bg-blue-600"
                                )}
                                style={{ width: `${percentage}%` }}
                            ></div>
                        </div>
                    </div>
                );
            },
        },
        {
            header: "Status",
            accessorKey: "id" as const,
            cell: () => (
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Active</span>
                </div>
            )
        }
    ];

    return <DataTable title="Infrastructure: Academic Classes" columns={columns} data={classes} />;
}
