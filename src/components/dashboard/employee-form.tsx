"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { Loader2 } from "lucide-react";

const employeeSchema = z.object({
    firstName: z.string().min(2, "First name is required"),
    lastName: z.string().min(2, "Last name is required"),
    employeeId: z.string().min(3, "Employee ID is required"),
    designation: z.string().min(2, "Designation is required"),
    department: z.string().min(2, "Department is required"),
    gender: z.enum(["male", "female", "other"]),
    dateOfBirth: z.string().min(1, "Date of birth is required"),
    phone: z.string().min(5, "Phone is required"),
    email: z.string().email("Invalid email"),
    baseSalary: z.string().min(1, "Salary is required"),
    joiningDate: z.string().min(1, "Joining date is required"),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

interface EmployeeFormProps {
    onSuccess: () => void;
}

export function EmployeeForm({ onSuccess }: EmployeeFormProps) {
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<EmployeeFormValues>({
        resolver: zodResolver(employeeSchema),
        defaultValues: {
            gender: "male",
            baseSalary: "",
        },
    });

    const onSubmit = async (values: EmployeeFormValues) => {
        setLoading(true);
        try {
            const response = await fetch("/api/employees", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...values,
                    baseSalary: parseFloat(values.baseSalary)
                }),
            });

            if (response.ok) {
                onSuccess();
            } else {
                alert("Failed to create employee");
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
                                    placeholder="Jane"
                                />
                                {errors.firstName && <p className="text-[10px] text-red-500 font-bold">{errors.firstName.message}</p>}
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-700 uppercase">Last Name</label>
                                <input
                                    {...register("lastName")}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="Smith"
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

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-700 uppercase">Phone</label>
                                <input
                                    {...register("phone")}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="+880..."
                                />
                                {errors.phone && <p className="text-[10px] text-red-500 font-bold">{errors.phone.message}</p>}
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-700 uppercase">Email</label>
                                <input
                                    {...register("email")}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="jane@school.com"
                                />
                                {errors.email && <p className="text-[10px] text-red-500 font-bold">{errors.email.message}</p>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Professional Information */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Professional Details</h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-700 uppercase">Employee ID</label>
                                <input
                                    {...register("employeeId")}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="EMP-101"
                                />
                                {errors.employeeId && <p className="text-[10px] text-red-500 font-bold">{errors.employeeId.message}</p>}
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-700 uppercase">Base Salary</label>
                                <input
                                    type="text"
                                    {...register("baseSalary")}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="50000"
                                />
                                {errors.baseSalary && <p className="text-[10px] text-red-500 font-bold">{errors.baseSalary.message}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-700 uppercase">Designation</label>
                                <input
                                    {...register("designation")}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="Senior Teacher"
                                />
                                {errors.designation && <p className="text-[10px] text-red-500 font-bold">{errors.designation.message}</p>}
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-700 uppercase">Department</label>
                                <input
                                    {...register("department")}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="Academic"
                                />
                                {errors.department && <p className="text-[10px] text-red-500 font-bold">{errors.department.message}</p>}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-700 uppercase">Joining Date</label>
                            <input
                                type="date"
                                {...register("joiningDate")}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                            {errors.joiningDate && <p className="text-[10px] text-red-500 font-bold">{errors.joiningDate.message}</p>}
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
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-8 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                >
                    {loading && <Loader2 size={18} className="animate-spin" />}
                    {loading ? "Saving..." : "Register Employee"}
                </button>
            </div>
        </form>
    );
}
