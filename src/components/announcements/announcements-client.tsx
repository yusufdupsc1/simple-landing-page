// src/components/announcements/announcements-client.tsx
"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Bell, AlertTriangle, Info } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createAnnouncement, updateAnnouncement, deleteAnnouncement, type AnnouncementFormData } from "@/server/actions/announcements";
import { formatDate } from "@/lib/utils";

type Announcement = {
    id: string; title: string; content: string; priority: string;
    targetAudience: string[]; publishedAt: string | null; expiresAt: string | null;
};

interface Props {
    announcements: Announcement[]; total: number; pages: number; currentPage: number;
}

const PRIORITY_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
    LOW: { label: "Low", icon: Info, color: "text-muted-foreground", bg: "bg-muted" },
    NORMAL: { label: "Normal", icon: Bell, color: "text-blue-600", bg: "bg-blue-500/10" },
    HIGH: { label: "High", icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-500/10" },
    URGENT: { label: "Urgent", icon: AlertTriangle, color: "text-red-600", bg: "bg-red-500/10" },
};

function AnnouncementForm({ initial, onSuccess }: { initial?: Announcement; onSuccess: () => void }) {
    const [pending, startTransition] = useTransition();
    const [form, setForm] = useState<AnnouncementFormData>({
        title: initial?.title ?? "",
        content: initial?.content ?? "",
        priority: (initial?.priority as AnnouncementFormData["priority"]) ?? "NORMAL",
        targetAudience: initial?.targetAudience ?? ["ALL"],
        expiresAt: initial?.expiresAt ? new Date(initial.expiresAt).toISOString().slice(0, 10) : "",
    });
    const set = (k: keyof AnnouncementFormData, v: unknown) => setForm(f => ({ ...f, [k]: v }));

    const toggleAudience = (audience: string) => {
        if (audience === "ALL") { set("targetAudience", ["ALL"]); return; }
        const current = form.targetAudience.filter(a => a !== "ALL");
        if (current.includes(audience)) {
            const next = current.filter(a => a !== audience);
            set("targetAudience", next.length ? next : ["ALL"]);
        } else {
            set("targetAudience", [...current, audience]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            const res = initial ? await updateAnnouncement(initial.id, form) : await createAnnouncement(form);
            if (res.success) { toast.success(initial ? "Announcement updated" : "Announcement published"); onSuccess(); }
            else toast.error(res.error);
        });
    };

    const audiences = ["ALL", "STUDENTS", "TEACHERS", "PARENTS"];

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
                <Label htmlFor="an-title">Title *</Label>
                <Input id="an-title" value={form.title} onChange={e => set("title", e.target.value)} required />
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="an-content">Content *</Label>
                <Textarea id="an-content" value={form.content} onChange={e => set("content", e.target.value)} rows={5} required />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                    <Label>Priority</Label>
                    <Select value={form.priority} onValueChange={v => set("priority", v as AnnouncementFormData["priority"])}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {["LOW", "NORMAL", "HIGH", "URGENT"].map(p => <SelectItem key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="an-exp">Expires On</Label>
                    <Input id="an-exp" type="date" value={form.expiresAt ?? ""} onChange={e => set("expiresAt", e.target.value)} />
                </div>
            </div>
            <div className="space-y-1.5">
                <Label>Target Audience</Label>
                <div className="flex flex-wrap gap-2">
                    {audiences.map(a => (
                        <button key={a} type="button"
                            onClick={() => toggleAudience(a)}
                            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${form.targetAudience.includes(a) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-muted-foreground"}`}>
                            {a}
                        </button>
                    ))}
                </div>
            </div>
            <Button type="submit" disabled={pending} className="w-full">
                {pending ? "Publishing..." : initial ? "Update" : "Publish Announcement"}
            </Button>
        </form>
    );
}

export function AnnouncementsClient({ announcements, total, pages, currentPage }: Props) {
    const [open, setOpen] = useState(false);
    const [editItem, setEditItem] = useState<Announcement | null>(null);
    const [, startTransition] = useTransition();

    const handleDelete = (id: string, title: string) => {
        if (!confirm(`Delete "${title}"?`)) return;
        startTransition(async () => {
            const res = await deleteAnnouncement(id);
            if (res.success) toast.success("Announcement deleted");
            else toast.error(res.error);
        });
    };

    return (
        <>
            <PageHeader title="Announcements" total={total} totalLabel="announcements">
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="w-full sm:w-auto" onClick={() => setEditItem(null)}>
                            <Plus className="h-4 w-4 mr-1.5" /> New Announcement
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>{editItem ? "Edit Announcement" : "New Announcement"}</DialogTitle></DialogHeader>
                        <AnnouncementForm initial={editItem ?? undefined} onSuccess={() => setOpen(false)} />
                    </DialogContent>
                </Dialog>
            </PageHeader>

            <SearchInput placeholder="Search announcements..." className="w-full sm:max-w-sm" />

            <div className="space-y-3">
                {announcements.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
                        No announcements yet. Click &ldquo;New Announcement&rdquo; to publish one.
                    </div>
                ) : announcements.map(a => {
                    const cfg = PRIORITY_CONFIG[a.priority] ?? PRIORITY_CONFIG.NORMAL;
                    const Icon = cfg.icon;
                    const isExpired = a.expiresAt && new Date(a.expiresAt) < new Date();
                    return (
                        <div key={a.id} className={`rounded-xl border bg-card p-4 transition-shadow hover:shadow-sm ${isExpired ? "opacity-60" : ""}`}>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                                <div className={`mt-0.5 rounded-full p-1.5 ${cfg.bg}`}>
                                    <Icon className={`h-4 w-4 ${cfg.color}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="mb-1 flex flex-wrap items-center gap-2">
                                        <h3 className="font-semibold text-sm">{a.title}</h3>
                                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                                        {isExpired && <span className="text-xs text-destructive">Expired</span>}
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{a.content}</p>
                                    <div className="flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground">
                                        <span>Published {a.publishedAt ? formatDate(a.publishedAt) : "—"}</span>
                                        {a.expiresAt && <span>Expires {formatDate(a.expiresAt)}</span>}
                                        <div className="flex flex-wrap gap-1">
                                            {a.targetAudience.map(t => (
                                                <span key={t} className="rounded bg-muted px-1.5 py-0.5">{t}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-1 self-end sm:self-start flex-shrink-0">
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditItem(a); setOpen(true); }}>
                                        <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(a.id, a.title)}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            <DataTablePagination currentPage={currentPage} totalPages={pages} total={total} />
        </>
    );
}
