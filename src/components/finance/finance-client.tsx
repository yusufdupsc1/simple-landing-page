// src/components/finance/finance-client.tsx
"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Receipt, TrendingUp, TrendingDown, DollarSign, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createFee, recordPayment, type FeeFormData, type PaymentFormData } from "@/server/actions/finance";
import { formatCurrency, formatDate } from "@/lib/utils";

type Student = { id: string; firstName: string; lastName: string; studentId: string; classId: string | null };
type Payment = {
    amount: number; paidAt: string | null; method: string; receiptNumber: string | null
};
type Fee = {
    id: string; title: string; amount: number; dueDate: string | null; status: string;
    feeType: string; term: string;
    student: { firstName: string; lastName: string; studentId: string };
    payments: Payment[];
};
type Summary = {
    totalFees: { amount: number; count: number };
    paidFees: { amount: number; count: number };
    pendingFees: { amount: number; count: number };
    overdueCount: number;
};

interface Props {
    fees: Fee[]; students: Student[]; summary: Summary;
    total: number; pages: number; currentPage: number;
}

const STATUS_COLORS: Record<string, string> = {
    PAID: "bg-green-500/10 text-green-600",
    UNPAID: "bg-yellow-500/10 text-yellow-600",
    PARTIAL: "bg-blue-500/10 text-blue-600",
    OVERDUE: "bg-red-500/10 text-red-600",
    WAIVED: "bg-muted text-muted-foreground",
};

function FeeForm({ students, onSuccess }: { students: Student[]; onSuccess: () => void }) {
    const [pending, startTransition] = useTransition();
    const [form, setForm] = useState<FeeFormData>({
        title: "", amount: 0, dueDate: "", term: "Term 1 2025",
        academicYear: "2024-2025", feeType: "TUITION", studentId: "", isRecurring: false,
    });
    const set = (k: keyof FeeFormData, v: unknown) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            const res = await createFee(form);
            if (res.success) { toast.success("Fee created"); onSuccess(); }
            else toast.error(res.error);
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
                <Label>Student *</Label>
                <Select value={form.studentId} onValueChange={v => set("studentId", v)} required>
                    <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                    <SelectContent className="max-h-48">
                        {students.map(s => <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.studentId})</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="fee-title">Title *</Label>
                <Input id="fee-title" value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Tuition Fee — Term 1" required />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                    <Label htmlFor="fee-amt">Amount *</Label>
                    <Input id="fee-amt" type="number" step="0.01" min={0.01} value={form.amount || ""} onChange={e => set("amount", e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                    <Label>Type</Label>
                    <Select value={form.feeType} onValueChange={v => set("feeType", v as FeeFormData["feeType"])}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {["TUITION", "TRANSPORT", "LIBRARY", "LABORATORY", "SPORTS", "EXAMINATION", "UNIFORM", "MISC"].map(t => (
                                <SelectItem key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                    <Label htmlFor="fee-due">Due Date *</Label>
                    <Input id="fee-due" type="date" value={form.dueDate} onChange={e => set("dueDate", e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                    <Label>Term</Label>
                    <Select value={form.term} onValueChange={v => set("term", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {["Term 1 2025", "Term 2 2025", "Term 3 2025", "Term 1 2026"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <Button type="submit" disabled={pending} className="w-full">
                {pending ? "Creating..." : "Create Fee"}
            </Button>
        </form>
    );
}

function PaymentForm({ fee, onSuccess }: { fee: Fee; onSuccess: () => void }) {
    const [pending, startTransition] = useTransition();
    const totalPaid = fee.payments.reduce((s, p) => s + p.amount, 0);
    const remaining = fee.amount - totalPaid;
    const [form, setForm] = useState<PaymentFormData>({ feeId: fee.id, amount: remaining, method: "CASH" });
    const set = (k: keyof PaymentFormData, v: unknown) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            const res = await recordPayment(form);
            if (res.success) { toast.success(`Payment recorded. Receipt: ${res.data?.receiptNumber}`); onSuccess(); }
            else toast.error(res.error);
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Total Amount:</span><span className="font-medium">{formatCurrency(fee.amount)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Paid:</span><span className="font-medium text-green-600">{formatCurrency(totalPaid)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Remaining:</span><span className="font-bold">{formatCurrency(remaining)}</span></div>
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="pay-amt">Amount *</Label>
                <Input id="pay-amt" type="number" step="0.01" min={0.01} max={remaining} value={form.amount} onChange={e => set("amount", Number(e.target.value))} required />
            </div>
            <div className="space-y-1.5">
                <Label>Payment Method</Label>
                <Select value={form.method} onValueChange={v => set("method", v as PaymentFormData["method"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {["CASH", "CARD", "BANK_TRANSFER", "CHEQUE", "ONLINE"].map(m => (
                            <SelectItem key={m} value={m}>{m.replace("_", " ")}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="pay-ref">Transaction Reference</Label>
                <Input id="pay-ref" value={form.transactionRef ?? ""} onChange={e => set("transactionRef", e.target.value)} placeholder="Optional ref number" />
            </div>
            <Button type="submit" disabled={pending} className="w-full">
                {pending ? "Recording..." : "Record Payment"}
            </Button>
        </form>
    );
}

export function FinanceClient({ fees, students, summary, total, pages, currentPage }: Props) {
    const [feeOpen, setFeeOpen] = useState(false);
    const [payOpen, setPayOpen] = useState(false);
    const [selectedFee, setSelectedFee] = useState<Fee | null>(null);

    const summaryCards = [
        { label: "Total Billed", value: summary.totalFees.amount, icon: DollarSign, color: "text-foreground", count: summary.totalFees.count },
        { label: "Collected", value: summary.paidFees.amount, icon: TrendingUp, color: "text-green-600", count: summary.paidFees.count },
        { label: "Outstanding", value: summary.pendingFees.amount, icon: TrendingDown, color: "text-yellow-600", count: summary.pendingFees.count },
        { label: "Overdue", value: summary.overdueCount, icon: AlertCircle, color: "text-destructive", isCount: true },
    ];

    return (
        <>
            <PageHeader title="Finance" description="Manage fees and payments">
                <Dialog open={feeOpen} onOpenChange={setFeeOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="w-full sm:w-auto"><Plus className="h-4 w-4 mr-1.5" /> Create Fee</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Create New Fee</DialogTitle></DialogHeader>
                        <FeeForm students={students} onSuccess={() => setFeeOpen(false)} />
                    </DialogContent>
                </Dialog>
            </PageHeader>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
                {summaryCards.map(({ label, value, icon: Icon, color, count, isCount }) => (
                    <div key={label} className="rounded-xl border border-border bg-card p-3 sm:p-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
                            <Icon className={`h-4 w-4 ${color}`} />
                        </div>
                        <p className={`text-lg font-bold sm:text-xl ${color}`}>
                            {isCount ? value : formatCurrency(value)}
                        </p>
                        {count !== undefined && <p className="text-xs text-muted-foreground mt-0.5">{count} fees</p>}
                    </div>
                ))}
            </div>

            <div className="flex w-full flex-wrap gap-3">
                <SearchInput placeholder="Search fees..." className="w-full sm:w-64" />
            </div>

            {/* Fees Table */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                    <table className="w-full min-w-[680px] text-sm">
                        <thead className="border-b border-border bg-muted/30">
                            <tr>
                                {["Student", "Fee", "Amount", "Paid", "Due Date", "Status", ""].map(h => (
                                    <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {fees.length === 0 ? (
                                <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No fees found.</td></tr>
                            ) : fees.map(f => {
                                const paid = f.payments.reduce((s, p) => s + p.amount, 0);
                                return (
                                    <tr key={f.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3">
                                            <p className="font-medium">{f.student.firstName} {f.student.lastName}</p>
                                            <p className="text-xs font-mono text-muted-foreground">{f.student.studentId}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p>{f.title}</p>
                                            <p className="text-xs text-muted-foreground">{f.term}</p>
                                        </td>
                                        <td className="px-4 py-3 font-medium">{formatCurrency(f.amount)}</td>
                                        <td className="px-4 py-3 text-green-600">{formatCurrency(paid)}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{f.dueDate ? formatDate(f.dueDate) : "—"}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[f.status] ?? ""}`}>{f.status}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {f.status !== "PAID" && f.status !== "WAIVED" && (
                                                <Button variant="outline" size="sm" className="h-7 text-xs gap-1"
                                                    onClick={() => { setSelectedFee(f); setPayOpen(true); }}>
                                                    <Receipt className="h-3 w-3" /> Pay
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
            <DataTablePagination currentPage={currentPage} totalPages={pages} total={total} />

            <Dialog open={payOpen} onOpenChange={setPayOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Record Payment</DialogTitle>
                    </DialogHeader>
                    {selectedFee && <PaymentForm fee={selectedFee} onSuccess={() => setPayOpen(false)} />}
                </DialogContent>
            </Dialog>
        </>
    );
}
