"use client";

import { DataTable } from "@/components/shared/data-table";
import { cn } from "@/lib/utils";
import { BookMarked, FlaskConical, Library, Shapes } from "lucide-react";

export function SubjectsTable({ subjects }: { subjects: any[] }) {
    const columns = [
        {
            header: "Curriculum Code",
            accessorKey: "code" as const,
            cell: (item: any) => (
                <span className="font-mono font-black text-blue-600 text-[10px] uppercase tracking-[0.2em] bg-blue-50/50 border border-blue-100 px-3 py-1.5 rounded-xl shadow-sm">
                    {item.code}
                </span>
            ),
        },
        {
            header: "Subject Identity",
            accessorKey: "name" as const,
            cell: (item: any) => (
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100 shadow-inner group-hover:bg-white transition-colors">
                        {item.type === 'theory' ? (
                            <Library size={18} className="text-amber-500 fill-amber-50" />
                        ) : (
                            <FlaskConical size={18} className="text-purple-500 fill-purple-50" />
                        )}
                    </div>
                    <div>
                        <p className="font-black text-[#1e266d] tracking-tight">{item.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Academic Unit</p>
                    </div>
                </div>
            ),
        },
        {
            header: "Classification",
            accessorKey: "type" as const,
            cell: (item: any) => (
                <span className={cn(
                    "px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm",
                    item.type === "theory" ? "bg-amber-50 text-amber-700 border-amber-100" :
                        item.type === "practical" ? "bg-purple-50 text-purple-700 border-purple-100" :
                            "bg-indigo-50 text-indigo-700 border-indigo-100"
                )}>
                    {item.type}
                </span>
            ),
        },
        {
            header: "Distribution",
            accessorKey: "_count" as const,
            cell: (item: any) => (
                <div className="flex items-center gap-2">
                    <Shapes size={14} className="text-blue-400" />
                    <span className="text-xs font-black text-gray-500 italic">
                        {item._count?.classes || 0} Departments
                    </span>
                </div>
            ),
        },
        {
            header: "Status",
            accessorKey: "id" as const,
            cell: () => (
                <div className="h-1.5 w-12 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.4)]"></div>
            )
        }
    ];

    return <DataTable title="Curriculum Mastery: Subjects" columns={columns} data={subjects} />;
}
