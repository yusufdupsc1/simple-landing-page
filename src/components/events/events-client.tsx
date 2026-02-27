// src/components/events/events-client.tsx
"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, MapPin, Calendar } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createEvent, updateEvent, deleteEvent, type EventFormData } from "@/server/actions/events";
import { formatDate } from "@/lib/utils";

type Event = {
    id: string; title: string; description: string | null;
    startDate: string | null; endDate: string | null; location: string | null; type: string;
};

interface Props {
    events: Event[]; total: number; pages: number; currentPage: number;
}

const TYPE_COLORS: Record<string, string> = {
    ACADEMIC: "bg-blue-500/10 text-blue-600",
    SPORTS: "bg-green-500/10 text-green-600",
    CULTURAL: "bg-purple-500/10 text-purple-600",
    HOLIDAY: "bg-orange-500/10 text-orange-600",
    EXAM: "bg-red-500/10 text-red-600",
    GENERAL: "bg-muted text-muted-foreground",
};

function EventForm({ initial, onSuccess }: { initial?: Event; onSuccess: () => void }) {
    const [pending, startTransition] = useTransition();
    const [form, setForm] = useState<EventFormData>({
        title: initial?.title ?? "",
        description: initial?.description ?? "",
        startDate: initial?.startDate ? new Date(initial.startDate).toISOString().slice(0, 16) : "",
        endDate: initial?.endDate ? new Date(initial.endDate).toISOString().slice(0, 16) : "",
        location: initial?.location ?? "",
        type: (initial?.type as EventFormData["type"]) ?? "GENERAL",
    });
    const set = (k: keyof EventFormData, v: unknown) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            const res = initial ? await updateEvent(initial.id, form) : await createEvent(form);
            if (res.success) { toast.success(initial ? "Event updated" : "Event created"); onSuccess(); }
            else toast.error(res.error);
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
                <Label htmlFor="ev-title">Title *</Label>
                <Input id="ev-title" value={form.title} onChange={e => set("title", e.target.value)} required />
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="ev-desc">Description</Label>
                <Textarea id="ev-desc" value={form.description ?? ""} onChange={e => set("description", e.target.value)} rows={3} />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                    <Label htmlFor="ev-start">Start Date/Time *</Label>
                    <Input id="ev-start" type="datetime-local" value={form.startDate} onChange={e => set("startDate", e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="ev-end">End Date/Time</Label>
                    <Input id="ev-end" type="datetime-local" value={form.endDate ?? ""} onChange={e => set("endDate", e.target.value)} />
                </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                    <Label htmlFor="ev-loc">Location</Label>
                    <Input id="ev-loc" value={form.location ?? ""} onChange={e => set("location", e.target.value)} placeholder="e.g. Main Hall" />
                </div>
                <div className="space-y-1.5">
                    <Label>Event Type</Label>
                    <Select value={form.type} onValueChange={v => set("type", v as EventFormData["type"])}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {["ACADEMIC", "SPORTS", "CULTURAL", "HOLIDAY", "EXAM", "GENERAL"].map(t => (
                                <SelectItem key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <Button type="submit" disabled={pending} className="w-full">
                {pending ? "Saving..." : initial ? "Update Event" : "Create Event"}
            </Button>
        </form>
    );
}

export function EventsClient({ events, total, pages, currentPage }: Props) {
    const [open, setOpen] = useState(false);
    const [editEvent, setEditEvent] = useState<Event | null>(null);
    const [, startTransition] = useTransition();

    const handleDelete = (id: string, title: string) => {
        if (!confirm(`Delete event "${title}"?`)) return;
        startTransition(async () => {
            const res = await deleteEvent(id);
            if (res.success) toast.success("Event deleted");
            else toast.error(res.error);
        });
    };

    return (
        <>
            <PageHeader title="Events" total={total} totalLabel="events">
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="w-full sm:w-auto" onClick={() => setEditEvent(null)}>
                            <Plus className="h-4 w-4 mr-1.5" /> Add Event
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>{editEvent ? "Edit Event" : "Add New Event"}</DialogTitle></DialogHeader>
                        <EventForm initial={editEvent ?? undefined} onSuccess={() => setOpen(false)} />
                    </DialogContent>
                </Dialog>
            </PageHeader>

            <SearchInput placeholder="Search events..." className="w-full sm:max-w-sm" />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {events.length === 0 ? (
                    <div className="col-span-full rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
                        No events scheduled. Click &ldquo;Add Event&rdquo; to create one.
                    </div>
                ) : events.map(e => (
                    <div key={e.id} className="rounded-xl border border-border bg-card p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between gap-2 mb-3">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[e.type] ?? ""}`}>
                                {e.type.charAt(0) + e.type.slice(1).toLowerCase()}
                            </span>
                            <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setEditEvent(e); setOpen(true); }}>
                                    <Pencil className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => handleDelete(e.id, e.title)}>
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                        <h3 className="text-pretty font-semibold text-sm mb-1">{e.title}</h3>
                        {e.description && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{e.description}</p>}
                        <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3 flex-shrink-0" />
                                {e.startDate ? formatDate(e.startDate) : "—"}
                                {e.endDate && ` → ${formatDate(e.endDate)}`}
                            </div>
                            {e.location && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <MapPin className="h-3 w-3 flex-shrink-0" />{e.location}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            <DataTablePagination currentPage={currentPage} totalPages={pages} total={total} />
        </>
    );
}
