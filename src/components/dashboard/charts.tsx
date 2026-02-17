"use client";

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
} from "recharts";

const performanceData = [
    { name: "Sep", income: 4000, expenses: 2400 },
    { name: "Oct", income: 3200, expenses: 1800 },
    { name: "Nov", income: 4500, expenses: 2800 },
    { name: "Dec", income: 5200, expenses: 3100 },
    { name: "Jan", income: 4800, expenses: 2600 },
    { name: "Feb", income: 6100, expenses: 2900 },
];

const studentData = [
    { name: "Class 1", students: 45 },
    { name: "Class 2", students: 52 },
    { name: "Class 3", students: 48 },
    { name: "Class 4", students: 61 },
    { name: "Class 5", students: 55 },
    { name: "Class 6", students: 42 },
];

export function DashboardCharts() {
    return (
        <div className="space-y-12">
            <div className="space-y-6">
                <div className="flex justify-between items-center px-4">
                    <div>
                        <h3 className="text-[#1e266d] font-black uppercase tracking-[0.2em] text-[10px]">Financial Growth</h3>
                        <p className="text-xs text-gray-400 font-bold mt-1 uppercase italic">Income vs Expenses Analysis</p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                            <span className="text-[10px] uppercase font-black text-gray-500">Income</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.5)]"></div>
                            <span className="text-[10px] uppercase font-black text-gray-500">Expenses</span>
                        </div>
                    </div>
                </div>
                <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={performanceData}>
                            <defs>
                                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }}
                            />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: '1.5rem',
                                    border: 'none',
                                    padding: '1rem',
                                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
                                    background: 'rgba(255, 255, 255, 0.95)',
                                    backdropFilter: 'blur(8px)'
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="income"
                                stroke="#3b82f6"
                                strokeWidth={4}
                                fillOpacity={1}
                                fill="url(#colorIncome)"
                            />
                            <Area
                                type="monotone"
                                dataKey="expenses"
                                stroke="#f43f5e"
                                strokeWidth={4}
                                fillOpacity={1}
                                fill="url(#colorExpenses)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="space-y-6 pt-10 border-t border-gray-100/50">
                <div className="flex justify-between items-center px-4">
                    <div>
                        <h3 className="text-[#1e266d] font-black uppercase tracking-[0.2em] text-[10px]">Enrollment Distribution</h3>
                        <p className="text-xs text-gray-400 font-bold mt-1 uppercase italic">Students per academic level</p>
                    </div>
                    <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="text-[10px] uppercase font-black text-blue-600 tracking-tighter">Live Data</span>
                    </div>
                </div>
                <div className="h-64 w-full px-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={studentData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: '#64748b', fontWeight: 800 }}
                                dy={10}
                            />
                            <YAxis hide />
                            <Tooltip
                                cursor={{ fill: '#f8fafc' }}
                                contentStyle={{
                                    borderRadius: '1.25rem',
                                    border: 'none',
                                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                                }}
                            />
                            <Bar
                                dataKey="students"
                                fill="#4f46e5"
                                radius={[10, 10, 0, 0]}
                                barSize={32}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
