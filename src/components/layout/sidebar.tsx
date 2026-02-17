"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Settings,
    GraduationCap,
    BookOpen,
    CreditCard,
    Banknote,
    ClipboardCheck,
    Calendar,
    Home,
    UserRound,
    MessageSquare,
    Smartphone,
    Video,
    FileQuestion,
    FileText,
    FileBadge,
    PieChart,
    ShoppingBag,
    ChevronRight,
    Menu,
    Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion } from "framer-motion";

const menuItems = [
    {
        group: "CORE", items: [
            { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
        ]
    },
    {
        group: "ACADEMIC", items: [
            { name: "Classes", icon: Home, href: "/dashboard/classes" },
            { name: "Subjects", icon: BookOpen, href: "/dashboard/subjects" },
            { name: "Students", icon: GraduationCap, href: "/dashboard/students" },
            { name: "Employees", icon: UserRound, href: "/dashboard/employees" },
            { name: "Attendance", icon: ClipboardCheck, href: "/dashboard/attendance" },
            { name: "Timetable", icon: Calendar, href: "/dashboard/timetable" },
        ]
    },
    {
        group: "FINANCE", items: [
            { name: "Fees", icon: Banknote, href: "/dashboard/fees" },
            { name: "Salary", icon: ShoppingBag, href: "/dashboard/salary" },
        ]
    },
    {
        group: "RESULTS", items: [
            { name: "Exams", icon: FileText, href: "/dashboard/exams" },
            { name: "Reports", icon: PieChart, href: "/dashboard/reports" },
            { name: "Certificates", icon: FileBadge, href: "/dashboard/certificates" },
        ]
    }
];

export function Sidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <aside className={cn(
            "fixed left-0 top-0 h-screen bg-[#0f172a] text-white transition-all duration-500 z-50 flex flex-col shadow-2xl",
            collapsed ? "w-24" : "w-72"
        )}>
            {/* Logo Section */}
            <div className="p-8 flex items-center justify-between shrink-0">
                {!collapsed && (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3"
                    >
                        <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-blue-500/20">S</div>
                        <span className="font-black text-2xl tracking-tighter uppercase italic">Skooly</span>
                    </motion.div>
                )}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/50 hover:text-white"
                >
                    {collapsed ? <ChevronRight size={20} /> : <Menu size={20} />}
                </button>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto no-scrollbar py-2 px-4 space-y-8">
                {menuItems.map((group, idx) => (
                    <div key={idx} className="space-y-2">
                        {!collapsed && (
                            <h3 className="text-[10px] font-black text-white/30 px-4 tracking-[0.2em] uppercase mb-4">
                                {group.group}
                            </h3>
                        )}
                        <div className="space-y-1">
                            {group.items.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative",
                                            isActive
                                                ? "bg-blue-600 shadow-lg shadow-blue-500/25 text-white"
                                                : "text-white/50 hover:bg-white/5 hover:text-white"
                                        )}
                                    >
                                        <item.icon size={22} className={cn(
                                            "shrink-0 transition-transform duration-300 group-hover:scale-110",
                                            isActive ? "text-white" : "text-white/40 group-hover:text-white"
                                        )} />
                                        {!collapsed && (
                                            <span className="text-[15px] font-bold tracking-tight">{item.name}</span>
                                        )}
                                        {isActive && !collapsed && (
                                            <motion.div
                                                layoutId="active-pill"
                                                className="absolute right-2 w-1.5 h-1.5 bg-white rounded-full"
                                            />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Bottom Upgrade Card */}
            {!collapsed && (
                <div className="p-6 mt-auto">
                    <div className="p-6 bg-gradient-to-br from-indigo-500/20 to-blue-500/20 rounded-[2rem] border border-white/10 backdrop-blur-md relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
                                <Sparkles size={20} className="text-white" />
                            </div>
                            <p className="text-sm font-black text-white mb-1 uppercase tracking-wider">Premium Plus</p>
                            <p className="text-[11px] text-white/50 mb-4 font-medium">Unlock advanced analytics and bulk operations.</p>
                            <button className="w-full py-3 bg-white text-[#0f172a] rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-transform active:scale-95 shadow-xl shadow-white/5">
                                Upgrade Now
                            </button>
                        </div>
                        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                    </div>
                </div>
            )}
        </aside>
    );
}
