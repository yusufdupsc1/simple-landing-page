"use client";

import { DataTable } from "@/components/shared/data-table";
import { cn, formatCurrency } from "@/lib/utils";
import { Banknote, Clock, CheckCircle, AlertCircle, TrendingUp, DollarSign, Wallet } from "lucide-react";
import { useState } from "react";
import { Modal } from "@/components/shared/modal";
import { PaymentForm } from "@/components/dashboard/payment-form";

export function FeesTable({ payments }: { payments: any[] }) {
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    const columns = [
        {
            header: "Receipt #",
            accessorKey: "receiptNo" as const,
            cell: (item: any) => (
                <span className="font-mono font-black text-xs text-gray-400 uppercase tracking-widest">
                    #{item.receiptNo ? item.receiptNo.replace('RCP', '') : 'N/A'}
                </span>
            ),
        },
        {
            header: "Student Details",
            accessorKey: "student" as const,
            cell: (item: any) => (
                <div className="flex items-center gap-4 group cursor-pointer">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 text-indigo-600 flex items-center justify-center font-black text-xs border border-indigo-100 shadow-sm transition-transform group-hover:scale-105">
                        {item.student.firstName[0]}{item.student.lastName[0]}
                    </div>
                    <div>
                        <p className="font-black text-[#1e266d] group-hover:text-blue-600 transition-colors">{item.student.firstName} {item.student.lastName}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{item.student.class.name}</p>
                    </div>
                </div>
            ),
        },
        {
            header: "Type",
            accessorKey: "feeStructure" as const,
            cell: (item: any) => (
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                    <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                        {item.feeStructure.name}
                    </span>
                </div>
            ),
        },
        {
            header: "Billing Period",
            accessorKey: "month" as const,
            cell: (item: any) => (
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                    {new Date(0, item.month - 1).toLocaleString('default', { month: 'short' }).toUpperCase()} '{item.year.toString().slice(-2)}
                </span>
            ),
        },
        {
            header: "Amount",
            accessorKey: "amount" as const,
            cell: (item: any) => (
                <span className="font-black text-[#1e266d] text-sm tracking-tight">
                    {formatCurrency(item.amount)}
                </span>
            ),
        },
        {
            header: "Status",
            accessorKey: "status" as const,
            cell: (item: any) => (
                <span className={cn(
                    "px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit border shadow-sm",
                    item.status === "paid" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                        item.status === "pending" ? "bg-amber-50 text-amber-600 border-amber-100" :
                            "bg-rose-50 text-rose-600 border-rose-100"
                )}>
                    {item.status === "paid" ? <CheckCircle size={10} className="fill-emerald-200" /> : <AlertCircle size={10} className="fill-amber-200" />}
                    {item.status}
                </span>
            ),
        },
    ];

    return (
        <div className="space-y-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#1e266d] rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden group">
                    <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-2">Total Collections</p>
                        <h3 className="text-3xl font-black">৳ 1.2M</h3>
                        <p className="text-xs text-green-400 font-bold mt-2 flex items-center gap-1">
                            <TrendingUp size={14} /> +12% this month
                        </p>
                    </div>
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                </div>

                <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm relative overflow-hidden group hover:border-blue-100 transition-colors">
                    <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Pending Dues</p>
                        <h3 className="text-3xl font-black text-amber-500">৳ 450K</h3>
                        <p className="text-xs text-gray-400 font-bold mt-2 flex items-center gap-1">
                            <Clock size={14} /> 125 invoices overdue
                        </p>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[2rem] p-6 text-white shadow-lg shadow-blue-200 relative overflow-hidden cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all active:scale-95" onClick={() => setIsPaymentModalOpen(true)}>
                    <div className="h-full flex flex-col items-center justify-center text-center relative z-10 gap-2">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm mb-1">
                            <DollarSign size={24} className="text-white" />
                        </div>
                        <h3 className="font-black uppercase tracking-widest text-sm">Record New Payment</h3>
                        <p className="text-[10px] text-white/70 font-medium max-w-[150px]">Accept cash, bank transfer or manual entry.</p>
                    </div>
                </div>
            </div>

            <DataTable
                title="Recent Transactions"
                columns={columns}
                data={payments}
                onAdd={() => setIsPaymentModalOpen(true)}
                addButtonText="New Payment"
            />

            <Modal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                title="Process Fee Payment"
                maxWidth="max-w-lg"
            >
                <PaymentForm onSuccess={() => setIsPaymentModalOpen(false)} />
            </Modal>
        </div>
    );
}
