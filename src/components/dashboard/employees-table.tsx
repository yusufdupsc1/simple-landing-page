"use client";

import { useState } from "react";
import { DataTable } from "@/components/shared/data-table";
import { cn } from "@/lib/utils";
import { Mail, Phone } from "lucide-react";
import { Modal } from "@/components/shared/modal";
import { EmployeeForm } from "@/components/dashboard/employee-form";
import { useRouter } from "next/navigation";

export function EmployeesTable({ employees }: { employees: any[] }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const router = useRouter();

    const columns = [
        {
            header: "Employee ID",
            accessorKey: "employeeId" as const,
            cell: (item: any) => (
                <span className="font-mono font-bold text-indigo-600 text-xs uppercase tracking-wider">
                    {item.employeeId}
                </span>
            ),
        },
        {
            header: "Basic Info",
            accessorKey: "firstName" as const,
            cell: (item: any) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm border border-indigo-100 uppercase">
                        {item.firstName[0]}{item.lastName[0]}
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-gray-900">{item.firstName} {item.lastName}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{item.gender}</p>
                    </div>
                </div>
            ),
        },
        {
            header: "Role & Dept",
            accessorKey: "designation" as const,
            cell: (item: any) => (
                <div>
                    <p className="text-sm font-bold text-gray-700">{item.designation}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{item.department}</p>
                </div>
            ),
        },
        {
            header: "Contact Details",
            accessorKey: "email" as const,
            cell: (item: any) => (
                <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Mail size={12} className="text-gray-400" />
                        <span>{item.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Phone size={12} className="text-gray-400" />
                        <span>{item.phone}</span>
                    </div>
                </div>
            ),
        },
        {
            header: "Joining Date",
            accessorKey: "joiningDate" as const,
            cell: (item: any) => (
                <span className="text-xs font-medium text-gray-600">
                    {new Date(item.joiningDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
            ),
        },
        {
            header: "Status",
            accessorKey: "status" as const,
            cell: (item: any) => (
                <span className={cn(
                    "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                    item.status === "active" ? "bg-green-100 text-green-700 font-bold border border-green-200" : "bg-gray-100 text-gray-600 border border-gray-200"
                )}>
                    {item.status}
                </span>
            ),
        },
    ];

    return (
        <>
            <DataTable
                title="Staff & Administration"
                columns={columns}
                data={employees}
                onAdd={() => setIsModalOpen(true)}
            />

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Register New Employee"
                maxWidth="max-w-4xl"
            >
                <EmployeeForm
                    onSuccess={() => {
                        setIsModalOpen(false);
                        router.refresh();
                    }}
                />
            </Modal>
        </>
    );
}
