"use client";

import {
    Bell,
    Search,
    Maximize2,
    Smartphone,
    Mail,
    ShoppingBag
} from "lucide-react";

export function Header() {
    return (
        <header className="h-20 bg-white/70 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-8 fixed top-0 right-0 left-0 transition-all z-40 ml-0 lg:ml-64">
            <div className="flex items-center gap-6 w-full max-w-2xl">
                <div className="relative w-full group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Search for students, staff or records..."
                        className="w-full bg-gray-50 border-none rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:bg-white outline-none transition-all shadow-inner"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-gray-200 shadow-sm">
                        <span className="text-[10px] font-black text-gray-400">⌘K</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="hidden xl:flex items-center gap-2 mr-6">
                    {[
                        { icon: Mail, notify: true, color: "bg-orange-500" },
                        { icon: ShoppingBag, notify: false },
                        { icon: Smartphone, notify: false },
                        { icon: Bell, notify: true, color: "bg-rose-500" }
                    ].map((item, i) => (
                        <button key={i} className="p-2.5 hover:bg-gray-50 rounded-xl text-gray-500 transition-all hover:scale-110 active:scale-95 relative group">
                            <item.icon size={20} className="group-hover:text-gray-900 transition-colors" />
                            {item.notify && (
                                <span className={`absolute top-2.5 right-2.5 w-2.5 h-2.5 ${item.color} rounded-full border-2 border-white shadow-sm ring-4 ring-transparent group-hover:ring-blue-50 transition-all animate-pulse`}></span>
                            )}
                        </button>
                    ))}
                    <div className="h-6 w-[1px] bg-gray-200 mx-2"></div>
                    <button className="p-2.5 hover:bg-gray-50 rounded-xl text-gray-500 transition-all hover:scale-110">
                        <Maximize2 size={20} />
                    </button>
                </div>

                <div className="flex items-center gap-4 bg-gray-50/50 p-1.5 pr-4 rounded-2xl border border-gray-100/50 hover:bg-white transition-all group cursor-pointer shadow-sm">
                    <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-blue-100 group-hover:rotate-6 transition-transform">
                        SA
                    </div>
                    <div className="text-left hidden sm:block">
                        <p className="text-sm font-black text-[#1e266d] leading-none">System Admin</p>
                        <p className="text-[10px] text-blue-600 mt-1 uppercase tracking-[0.15em] font-black">Super Control</p>
                    </div>
                </div>
            </div>
        </header>
    );
}
