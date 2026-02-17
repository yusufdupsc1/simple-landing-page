"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { Loader2 } from "lucide-react";

// Mock student search (in real app, this would be an async select)
const students = [
    { id: "STU00001", name: "Abir Ahmed - Class One" },
    { id: "STU00002", name: "Farhana Akter - Class Two" },
    { id: "STU00003", name: "Tanvir Islam - Class Two" },
];

const paymentSchema = z.object({
    studentId: z.string().min(1, "Student is required"),
    feeType: z.string().min(1, "Fee type is required"),
    amount: z.string().min(1, "Amount is required"),
    paymentMethod: z.enum(["cash", "bank", "card"]),
    remarks: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

interface PaymentFormProps {
    onSuccess: () => void;
}

export function PaymentForm({ onSuccess }: PaymentFormProps) {
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<PaymentFormValues>({
        resolver: zodResolver(paymentSchema),
        defaultValues: {
            paymentMethod: "cash",
        },
    });

    const onSubmit = async (data: PaymentFormValues) => {
        setLoading(true);
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setLoading(false);
        onSuccess();
        alert("Payment Recorded Successfully! Receipt Generated.");
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 uppercase">Select Student</label>
                    <select
                        {...register("studentId")}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    >
                        <option value="">Search Student...</option>
                        {students.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                    {errors.studentId && <p className="text-[10px] text-red-500 font-bold">{errors.studentId.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700 uppercase">Fee Type</label>
                        <select
                            {...register("feeType")}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        >
                            <option value="">Select Type...</option>
                            <option value="tuition">Tuition Fee</option>
                            <option value="exam">Exam Fee</option>
                            <option value="transport">Transport Fee</option>
                            <option value="library">Library Fine</option>
                        </select>
                        {errors.feeType && <p className="text-[10px] text-red-500 font-bold">{errors.feeType.message}</p>}
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700 uppercase">Amount (BDT)</label>
                        <input
                            type="number"
                            {...register("amount")}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="5000"
                        />
                        {errors.amount && <p className="text-[10px] text-red-500 font-bold">{errors.amount.message}</p>}
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 uppercase">Payment Method</label>
                    <div className="grid grid-cols-3 gap-4">
                        {["Cash", "Bank", "Card"].map((method) => (
                            <label key={method} className="cursor-pointer">
                                <input
                                    type="radio"
                                    value={method.toLowerCase()}
                                    {...register("paymentMethod")}
                                    className="peer sr-only"
                                />
                                <div className="text-center py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-500 peer-checked:bg-blue-50 peer-checked:text-blue-600 peer-checked:border-blue-200 transition-all hover:bg-gray-50">
                                    {method}
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 uppercase">Remarks (Optional)</label>
                    <textarea
                        {...register("remarks")}
                        rows={3}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                        placeholder="Any additional notes..."
                    />
                </div>
            </div>

            <div className="pt-4 flex justify-end">
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-8 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 w-full md:w-auto"
                >
                    {loading && <Loader2 size={18} className="animate-spin" />}
                    {loading ? "Processing..." : "Confirm Payment"}
                </button>
            </div>
        </form>
    );
}
