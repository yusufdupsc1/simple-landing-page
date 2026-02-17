import { prisma } from "@/lib/prisma";
import { Building, Mail, Phone, MapPin, Calendar, Globe, Pencil } from "lucide-react";

export default async function SettingsPage() {
    const school = await prisma.schoolSettings.findFirst();

    if (!school) return <div className="p-8 text-center text-gray-500 font-bold">No school settings found. Please run seed.</div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-[#1e266d] tracking-tight">Institutional Configuration</h1>
                    <p className="text-gray-400 text-sm font-bold mt-1 uppercase tracking-widest">Update profile, branding, and contact details.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Card - Bento ID */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 flex flex-col items-center text-center relative overflow-hidden group">
                        <div className="w-24 h-24 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mb-6 relative shadow-lg shadow-blue-200 group-hover:rotate-3 transition-transform duration-500">
                            <span className="text-3xl font-black text-white">S</span>
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white/20 rounded-xl backdrop-blur-md flex items-center justify-center">
                                <Pencil size={12} className="text-white" />
                            </div>
                        </div>
                        <h2 className="text-lg font-black text-[#1e266d] px-4">{school.schoolName}</h2>
                        <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-[0.2em] font-black">{school.city}, {school.country}</p>

                        <div className="mt-8 w-full space-y-3">
                            <button className="w-full py-3 bg-[#1e266d] hover:bg-blue-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                                Update Brand Assets
                            </button>
                            <button className="w-full py-3 bg-white border border-gray-100 hover:bg-gray-50 text-gray-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                                Reset Preferences
                            </button>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2rem] p-8 text-white shadow-xl shadow-indigo-200 relative overflow-hidden group">
                        <div className="relative z-10 space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                                    <Globe size={20} className="text-blue-200" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-black text-blue-200 tracking-widest mb-1">Public Portal</p>
                                    <p className="text-sm font-bold tracking-tight">www.eskooly.com</p>
                                </div>
                            </div>
                            <div className="h-[1px] w-full bg-white/10"></div>
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                                    <Calendar size={20} className="text-orange-200" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-black text-orange-200 tracking-widest mb-1">System Time</p>
                                    <p className="text-sm font-bold tracking-tight">{school.timezone}</p>
                                </div>
                            </div>
                        </div>
                        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                    </div>
                </div>

                {/* Detailed Settings Forms */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-8 py-8 border-b border-gray-100 bg-gray-50/30">
                            <h3 className="font-black text-[#1e266d] text-sm uppercase tracking-widest flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                School Profile Details
                            </h3>
                        </div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3 group">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-focus-within:text-blue-600 transition-colors">Institute Name</label>
                                <div className="relative">
                                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-500 transition-colors" size={18} />
                                    <input type="text" defaultValue={school.schoolName} className="w-full bg-gray-50 border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all shadow-inner" />
                                </div>
                            </div>

                            <div className="space-y-3 group">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-focus-within:text-blue-600 transition-colors">Official Tagline</label>
                                <input type="text" defaultValue={school.tagline || ''} className="w-full bg-gray-50 border-none rounded-2xl py-3.5 px-6 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all shadow-inner" />
                            </div>

                            <div className="space-y-3 group">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-focus-within:text-blue-600 transition-colors">Contact Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-500 transition-colors" size={18} />
                                    <input type="email" defaultValue={school.email || ''} className="w-full bg-gray-50 border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all shadow-inner" />
                                </div>
                            </div>

                            <div className="space-y-3 group">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-focus-within:text-blue-600 transition-colors">Phone Support</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-500 transition-colors" size={18} />
                                    <input type="text" defaultValue={school.phone || ''} className="w-full bg-gray-50 border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all shadow-inner" />
                                </div>
                            </div>

                            <div className="space-y-3 md:col-span-2 group">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-focus-within:text-blue-600 transition-colors">Physical Campus Address</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-4 text-gray-300 group-focus-within:text-blue-500 transition-colors" size={18} />
                                    <textarea defaultValue={school.address || ''} rows={3} className="w-full bg-gray-50 border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all shadow-inner resize-none" />
                                </div>
                            </div>
                        </div>
                        <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-100 flex justify-end">
                            <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300 transform active:scale-95">
                                Save Configuration
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
