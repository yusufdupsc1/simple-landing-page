"use client";

import { useState } from "react";
import { DataTable } from "@/components/shared/data-table";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/shared/modal";
import { StudentForm } from "@/components/dashboard/student-form";
import { useRouter } from "next/navigation";

interface StudentsTableProps {
    students: any[];
    classes: any[];
}

export function StudentsTable({ students, classes }: StudentsTableProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const router = useRouter();

    const columns = [
        {
            header: "Admission No",
            accessorKey: "admissionNo" as const,
            cell: (item: any) => (
                <span className="font-mono font-bold text-blue-600 text-xs">
                    {item.admissionNo}
                </span>
            ),
        },
        {
            header: "Student Name",
            accessorKey: "firstName" as const,
            cell: (item: any) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs uppercase">
                        {item.firstName[0]}{item.lastName[0]}
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-gray-900">{item.firstName} {item.lastName}</p>
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tight">{item.gender}</p>
                    </div>
                </div>
            ),
        },
        {
            header: "Class & Roll",
            accessorKey: "rollNo" as const,
            cell: (item: any) => (
                <div>
                    <p className="text-sm font-medium text-gray-700">{item.class.name}</p>
                    <p className="text-xs text-gray-500 font-bold">Roll: {item.rollNo}</p>
                </div>
            ),
        },
        {
            header: "Guardian",
            accessorKey: "guardianName" as const,
            cell: (item: any) => (
                <div>
                    <p className="text-sm text-gray-700">{item.guardianName}</p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">{item.guardianRelation}</p>
                </div>
            ),
        },
        {
            header: "Contact",
            accessorKey: "phone" as const,
            cell: (item: any) => (
                <span className="text-xs font-medium text-gray-600">{item.phone || "N/A"}</span>
            ),
        },
        {
            header: "Status",
            accessorKey: "status" as const,
            cell: (item: any) => (
                <span className={cn(
                    "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                    item.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                )}>
                    {item.status}
                </span>
            ),
        },
    ];

    return (
        <>
            <DataTable
                title="Student List"
                columns={columns}
                data={students}
                onAdd={() => setIsModalOpen(true)}
            />

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Register New Student"
                maxWidth="max-w-4xl"
            >
                <StudentForm
                    classes={classes}
                    onSuccess={() => {
                        setIsModalOpen(false);
                        router.refresh();
                    }}
                />
            </Modal>
        </>
    );
}
