// src/components/settings/settings-client.tsx
"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Save, Building2, GraduationCap } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateInstitutionProfile, updateInstitutionSettings, type InstitutionProfileData, type InstitutionSettingsData } from "@/server/actions/settings";

type Institution = {
    id: string; name: string; email: string | null; phone: string | null;
    website: string | null; address: string | null; city: string | null;
    country: string | null; timezone: string; currency: string;
    plan: string; planExpiry: Date | null; logo: string | null;
} | null;

type SettingsRow = {
    academicYear: string; termsPerYear: number; workingDays: number[];
    emailNotifs: boolean; smsNotifs: boolean; lateFeePercent: number; gracePeriodDays: number;
} | null;

interface Props { institution: Institution; settings: SettingsRow }

const PLAN_COLORS: Record<string, string> = {
    STARTER: "bg-muted text-muted-foreground",
    PROFESSIONAL: "bg-blue-500/10 text-blue-600",
    ENTERPRISE: "bg-purple-500/10 text-purple-600",
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function ProfileTab({ institution }: { institution: Institution }) {
    const [pending, startTransition] = useTransition();
    const [form, setForm] = useState<InstitutionProfileData>({
        name: institution?.name ?? "",
        email: institution?.email ?? "",
        phone: institution?.phone ?? "",
        website: institution?.website ?? "",
        address: institution?.address ?? "",
        city: institution?.city ?? "",
        country: institution?.country ?? "Bangladesh",
        timezone: institution?.timezone ?? "Asia/Dhaka",
        currency: institution?.currency ?? "BDT",
    });
    const set = (k: keyof InstitutionProfileData, v: string) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            const res = await updateInstitutionProfile(form);
            if (res.success) toast.success("Institution profile updated");
            else toast.error(res.error);
        });
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
            <div className="flex items-center gap-3 mb-2">
                <h2 className="font-semibold">Institution Profile</h2>
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${PLAN_COLORS[institution?.plan ?? "STARTER"]}`}>
                    {institution?.plan ?? "STARTER"}
                </span>
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="inst-name">Institution Name *</Label>
                <Input id="inst-name" value={form.name} onChange={e => set("name", e.target.value)} required />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                    <Label htmlFor="inst-email">Contact Email</Label>
                    <Input id="inst-email" type="email" value={form.email ?? ""} onChange={e => set("email", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="inst-phone">Phone</Label>
                    <Input id="inst-phone" value={form.phone ?? ""} onChange={e => set("phone", e.target.value)} />
                </div>
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="inst-web">Website</Label>
                <Input id="inst-web" type="url" value={form.website ?? ""} onChange={e => set("website", e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="inst-addr">Address</Label>
                <Input id="inst-addr" value={form.address ?? ""} onChange={e => set("address", e.target.value)} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                    <Label htmlFor="inst-city">City</Label>
                    <Input id="inst-city" value={form.city ?? ""} onChange={e => set("city", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="inst-country">Country</Label>
                    <Input id="inst-country" value={form.country ?? ""} onChange={e => set("country", e.target.value)} placeholder="Bangladesh" />
                </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                    <Label>Timezone</Label>
                    <Select value={form.timezone} onValueChange={v => set("timezone", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {["Asia/Dhaka", "Asia/Kolkata", "Asia/Dubai", "UTC"].map(tz => (
                                <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5">
                    <Label>Currency</Label>
                    <Select value={form.currency} onValueChange={v => set("currency", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {["BDT", "USD", "INR", "AED"].map(c => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <Button type="submit" disabled={pending} className="w-full gap-2 sm:w-auto">
                <Save className="h-4 w-4" />{pending ? "Saving..." : "Save Profile"}
            </Button>
        </form>
    );
}

function AcademicTab({ settings }: { settings: SettingsRow }) {
    const [pending, startTransition] = useTransition();
    const [form, setForm] = useState<InstitutionSettingsData>({
        academicYear: settings?.academicYear ?? "2024-2025",
        termsPerYear: settings?.termsPerYear ?? 3,
        workingDays: settings?.workingDays ?? [1, 2, 3, 4, 5],
        emailNotifs: settings?.emailNotifs ?? true,
        smsNotifs: settings?.smsNotifs ?? false,
        lateFeePercent: settings?.lateFeePercent ?? 0,
        gracePeriodDays: settings?.gracePeriodDays ?? 7,
    });
    const set = (k: keyof InstitutionSettingsData, v: unknown) => setForm(f => ({ ...f, [k]: v }));

    const toggleDay = (day: number) => {
        const days = form.workingDays as number[];
        set("workingDays", days.includes(day) ? days.filter(d => d !== day) : [...days, day].sort());
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            const res = await updateInstitutionSettings(form);
            if (res.success) toast.success("Settings updated");
            else toast.error(res.error);
        });
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
            <div>
                <h2 className="font-semibold mb-4">Academic Settings</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="s-year">Academic Year</Label>
                        <Input id="s-year" value={form.academicYear} onChange={e => set("academicYear", e.target.value)} placeholder="2024-2025" />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="s-terms">Terms Per Year</Label>
                        <Select value={String(form.termsPerYear)} onValueChange={v => set("termsPerYear", Number(v))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {[1, 2, 3, 4].map(n => <SelectItem key={n} value={String(n)}>{n} term{n > 1 ? "s" : ""}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="space-y-1.5 mt-4">
                    <Label>Working Days</Label>
                    <div className="flex flex-wrap gap-2">
                        {DAYS.map((d, i) => {
                            const dayNum = i + 1;
                            const active = (form.workingDays as number[]).includes(dayNum);
                            return (
                                <button key={d} type="button" onClick={() => toggleDay(dayNum)}
                                    className={`w-10 h-10 rounded-full text-xs font-medium border transition-all ${active ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-muted-foreground"}`}>
                                    {d}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="border-t border-border pt-5">
                <h2 className="font-semibold mb-4">Finance Settings</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="s-latefee">Late Fee %</Label>
                        <Input id="s-latefee" type="number" min={0} max={100} step={0.1} value={form.lateFeePercent} onChange={e => set("lateFeePercent", Number(e.target.value))} />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="s-grace">Grace Period (days)</Label>
                        <Input id="s-grace" type="number" min={0} value={form.gracePeriodDays} onChange={e => set("gracePeriodDays", Number(e.target.value))} />
                    </div>
                </div>
            </div>

            <div className="border-t border-border pt-5">
                <h2 className="font-semibold mb-4">Notifications</h2>
                <div className="space-y-3">
                    {[
                        { key: "emailNotifs" as const, label: "Email Notifications", desc: "Send notifications via email" },
                        { key: "smsNotifs" as const, label: "SMS Notifications", desc: "Send notifications via SMS" },
                    ].map(({ key, label, desc }) => (
                        <div key={key} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                            <div>
                                <p className="text-sm font-medium">{label}</p>
                                <p className="text-xs text-muted-foreground">{desc}</p>
                            </div>
                            <button type="button" onClick={() => set(key, !form[key])}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form[key] ? "bg-primary" : "bg-muted"}`}>
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form[key] ? "translate-x-6" : "translate-x-1"}`} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <Button type="submit" disabled={pending} className="w-full gap-2 sm:w-auto">
                <Save className="h-4 w-4" />{pending ? "Saving..." : "Save Settings"}
            </Button>
        </form>
    );
}

export function SettingsClient({ institution, settings }: Props) {
    return (
        <>
            <PageHeader title="Settings" description="Manage institution profile and system preferences" />
            <Tabs defaultValue="profile">
                <TabsList className="mb-6 w-full sm:w-auto">
                    <TabsTrigger value="profile" className="gap-1.5"><Building2 className="h-3.5 w-3.5" />Profile</TabsTrigger>
                    <TabsTrigger value="academic" className="gap-1.5"><GraduationCap className="h-3.5 w-3.5" />Academic</TabsTrigger>
                </TabsList>
                <TabsContent value="profile">
                    <ProfileTab institution={institution} />
                </TabsContent>
                <TabsContent value="academic">
                    <AcademicTab settings={settings} />
                </TabsContent>
            </Tabs>
        </>
    );
}
