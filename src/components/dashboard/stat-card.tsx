import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
    label: string;
    value: string | number;
    subValue: string | number;
    icon: LucideIcon;
    variant: "blue" | "indigo" | "pink" | "orange";
}

const variants = {
    blue: "from-blue-600 to-blue-700 shadow-blue-100",
    indigo: "from-indigo-600 to-indigo-700 shadow-indigo-100",
    pink: "from-fuchsia-600 to-pink-600 shadow-pink-100",
    orange: "from-orange-500 to-amber-600 shadow-orange-100"
};

export function StatCard({ label, value, subValue, icon: Icon, variant }: StatCardProps) {
    return (
        <div className={cn(
            "relative overflow-hidden rounded-[2rem] p-8 text-white shadow-2xl transition-all duration-500 hover:scale-[1.03] hover:-translate-y-1 bg-gradient-to-br",
            variants[variant]
        )}>
            <div className="flex justify-between items-start relative z-10">
                <div className="space-y-2">
                    <p className="text-white/70 font-bold text-xs tracking-[0.2em] uppercase">{label}</p>
                    <h3 className="text-4xl lg:text-5xl font-black tracking-tight">{value}</h3>
                </div>
                <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-inner">
                    <Icon size={32} className="text-white drop-shadow-md" />
                </div>
            </div>

            <div className="mt-10 flex items-center justify-between pt-5 border-t border-white/10 uppercase tracking-widest text-[11px] font-black relative z-10">
                <span className="text-white/50">Current Period</span>
                <span className="text-white bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">{subValue}</span>
            </div>

            {/* Premium decorative elements */}
            <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-black/10 rounded-full blur-2xl"></div>

            {/* Glossy overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-50"></div>
        </div>
    );
}
