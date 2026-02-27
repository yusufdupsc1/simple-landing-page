// src/components/ui/page-header.tsx
import React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
    title: string;
    description?: string;
    total?: number;
    totalLabel?: string;
    children?: React.ReactNode;
    className?: string;
}

export function PageHeader({ title, description, total, totalLabel = "total", children, className }: PageHeaderProps) {
    return (
        <div className={cn("flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between", className)}>
            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <h1 className="text-balance text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
                    {total !== undefined && (
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary sm:text-sm">
                            {total.toLocaleString()} {totalLabel}
                        </span>
                    )}
                </div>
                {description && (
                    <p className="mt-0.5 text-pretty text-sm text-muted-foreground">{description}</p>
                )}
            </div>
            {children && <div className="flex w-full flex-wrap items-center gap-2 sm:gap-2.5 lg:w-auto lg:justify-end">{children}</div>}
        </div>
    );
}
