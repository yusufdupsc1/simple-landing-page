"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { Loader2 } from "lucide-react";

const studentSchema = z.object({
    firstName: z.string().min(2, "First name is required"),
    lastName: z.string().min(2, "Last name is required"),
    admissionNo: z.string().min(3, "Admission number is required"),
    rollNo: z.string().optional(),
    classId: z.string().min(1, "Class is required"),
    gender: z.enum(["male", "female", "other"]),
    dateOfBirth: z.string().min(1, "Date of birth is required"),
    phone: z.string().optional(),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    guardianName: z.string().min(2, "Guardian name is required"),
    guardianPhone: z.string().min(5, "Guardian phone is required"),
    guardianRelation: z.string().min(2, "Relation is required"),
});

type StudentFormValues = z.infer<typeof studentSchema>;

interface StudentFormProps {
    classes: { id: string; name: string; section: string }[];
    onSuccess: () => void;
}

export function StudentForm({ classes, onSuccess }: StudentFormProps) {
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<StudentFormValues>({
        resolver: zodResolver(studentSchema),
        defaultValues: {
            gender: "male",
        },
    });

    const onSubmit = async (data: StudentFormValues) => {
        setLoading(true);
        try {
            const response = await fetch("/api/students", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                onSuccess();
            } else {
                alert("Failed to create student");
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Personal Details</h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-700 uppercase">First Name</label>
                                <input
                                    {...register("firstName")}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="John"
                                />
                                {errors.firstName && <p className="text-[10px] text-red-500 font-bold">{errors.firstName.message}</p>}
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-700 uppercase">Last Name</label>
                                <input
                                    {...register("lastName")}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="Doe"
                                />
                                {errors.lastName && <p className="text-[10px] text-red-500 font-bold">{errors.lastName.message}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-700 uppercase">Gender</label>
                                <select
                                    {...register("gender")}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                >
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-700 uppercase">Date of Birth</label>
                                <input
                                    type="date"
                                    {...register("dateOfBirth")}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                                {errors.dateOfBirth && <p className="text-[10px] text-red-500 font-bold">{errors.dateOfBirth.message}</p>}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-700 uppercase">Email Address</label>
                            <input
                                {...register("email")}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="john.doe@example.com"
                            />
                            {errors.email && <p className="text-[10px] text-red-500 font-bold">{errors.email.message}</p>}
                        </div>
                    </div>
                </div>

                {/* Academic & Guardian Information */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Academic & Guardian</h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-700 uppercase">Admission No</label>
                                <input
                                    {...register("admissionNo")}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="ADM-001"
                                />
                                {errors.admissionNo && <p className="text-[10px] text-red-500 font-bold">{errors.admissionNo.message}</p>}
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-700 uppercase">Class</label>
                                <select
                                    {...register("classId")}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                >
                                    <option value="">Select Class</option>
                                    {classes.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} - {c.section}
                                        </option>
                                    ))}
                                </select>
                                {errors.classId && <p className="text-[10px] text-red-500 font-bold">{errors.classId.message}</p>}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-700 uppercase">Guardian Name</label>
                            <input
                                {...register("guardianName")}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="Parent Name"
                            />
                            {errors.guardianName && <p className="text-[10px] text-red-500 font-bold">{errors.guardianName.message}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-700 uppercase">Guardian Phone</label>
                                <input
                                    {...register("guardianPhone")}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="+880..."
                                />
                                {errors.guardianPhone && <p className="text-[10px] text-red-500 font-bold">{errors.guardianPhone.message}</p>}
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-700 uppercase">Relation</label>
                                <input
                                    {...register("guardianRelation")}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="Father/Mother"
                                />
                                {errors.guardianRelation && <p className="text-[10px] text-red-500 font-bold">{errors.guardianRelation.message}</p>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
                <button
                    type="button"
                    onClick={() => onSuccess()}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-8 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
                >
                    {loading && <Loader2 size={18} className="animate-spin" />}
                    {loading ? "Saving..." : "Register Student"}
                </button>
            </div>
        </form>
    );
}
