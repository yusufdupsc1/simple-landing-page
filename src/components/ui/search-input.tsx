// src/components/ui/search-input.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchInputProps {
    placeholder?: string;
    className?: string;
}

export function SearchInput({ placeholder = "Search...", className }: SearchInputProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [, startTransition] = useTransition();

    const value = searchParams.get("search") ?? "";

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const params = new URLSearchParams(searchParams.toString());
            if (e.target.value) {
                params.set("search", e.target.value);
            } else {
                params.delete("search");
            }
            params.delete("page");
            startTransition(() => router.push(`?${params.toString()}`));
        },
        [router, searchParams]
    );

    const handleClear = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("search");
        params.delete("page");
        router.push(`?${params.toString()}`);
    };

    return (
        <div className={`relative ${className}`}>
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
                type="search"
                placeholder={placeholder}
                className="h-10 rounded-xl pl-9 pr-10"
                defaultValue={value}
                onChange={handleChange}
            />
            {value && (
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 h-8 w-8"
                    onClick={handleClear}
                >
                    <X className="h-3.5 w-3.5" />
                </Button>
            )}
        </div>
    );
}
