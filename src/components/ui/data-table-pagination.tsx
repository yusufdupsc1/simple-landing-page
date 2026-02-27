// src/components/ui/data-table-pagination.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DataTablePaginationProps {
    currentPage: number;
    totalPages: number;
    total: number;
    limit?: number;
}

export function DataTablePagination({
    currentPage,
    totalPages,
    total,
    limit = 20,
}: DataTablePaginationProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const goToPage = (page: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", String(page));
        router.push(`?${params.toString()}`);
    };

    const start = (currentPage - 1) * limit + 1;
    const end = Math.min(currentPage * limit, total);

    if (total === 0) return null;

    return (
        <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
                Showing <span className="font-medium">{start}–{end}</span> of{" "}
                <span className="font-medium">{total}</span>
            </p>
            <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
                <Button
                    variant="outline"
                    size="sm"
                    className="min-w-24 sm:min-w-0"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage <= 1}
                >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                </Button>
                <span className="min-w-20 text-center text-sm text-muted-foreground">
                    {currentPage} / {totalPages}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    className="min-w-24 sm:min-w-0"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                >
                    Next
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
