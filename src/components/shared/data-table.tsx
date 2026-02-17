"use client";

import { cn } from "@/lib/utils";
import { Search, Filter, MoreVertical, Plus } from "lucide-react";

interface DataTableProps<T> {
    columns: {
        header: string;
        accessorKey: keyof T;
        cell?: (item: T) => React.ReactNode;
    }[];
    data: T[];
    title: string;
    onAdd?: () => void;
    addButtonText?: string;
}

export function DataTable<T extends { id: string | number }>({
    columns,
    data,
    title,
    onAdd,
    addButtonText = "Add New"
}: DataTableProps<T>) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage and view your school records</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search records..."
                            className="bg-gray-50 border border-gray-200 rounded-lg py-2 pl-9 pr-4 text-xs focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-64"
                        />
                    </div>
                    <button className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                        <Filter size={18} />
                    </button>
                    {onAdd && (
                        <button
                            onClick={onAdd}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shrink-0"
                        >
                            <Plus size={18} />
                            <span>{addButtonText}</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                            {columns.map((col, idx) => (
                                <th key={idx} className="px-6 py-4">{col.header}</th>
                            ))}
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {data.length > 0 ? data.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                                {columns.map((col, idx) => (
                                    <td key={idx} className="px-6 py-4">
                                        {col.cell ? col.cell(item) : (
                                            <span className="text-sm text-gray-600">
                                                {String(item[col.accessorKey] || "")}
                                            </span>
                                        )}
                                    </td>
                                ))}
                                <td className="px-6 py-4 text-right">
                                    <button className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors">
                                        <MoreVertical size={16} />
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={columns.length + 1} className="px-6 py-12 text-center text-gray-400 italic">
                                    No records found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between px-6">
                <p className="text-xs text-gray-500 font-medium">Showing {data.length} records</p>
                <div className="flex items-center gap-2">
                    <button className="px-3 py-1 border border-gray-200 rounded text-xs font-bold text-gray-400 bg-white" disabled>Previous</button>
                    <button className="px-3 py-1 border border-gray-200 rounded text-xs font-bold text-gray-600 bg-white hover:bg-gray-50">Next</button>
                </div>
            </div>
        </div>
    );
}
