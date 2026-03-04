"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, UserRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface StudentSearchItem {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  class: { name: string } | null;
}

interface StudentSearchSelectProps {
  classId: string;
  selectedStudent: StudentSearchItem | null;
  onSelect: (student: StudentSearchItem | null) => void;
}

export function StudentSearchSelect({
  classId,
  selectedStudent,
  onSelect,
}: StudentSearchSelectProps) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<StudentSearchItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          limit: "25",
          status: "ACTIVE",
          q: query,
        });
        if (classId !== "ALL_CLASSES") {
          params.set("classId", classId);
        }

        const res = await fetch(`/api/v1/students?${params.toString()}`, {
          signal: controller.signal,
        });
        const json = await res.json();
        const rows = Array.isArray(json?.data)
          ? (json.data as StudentSearchItem[])
          : [];
        setItems(rows);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [classId, query]);

  const hasItems = useMemo(() => items.length > 0, [items.length]);

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">Student</label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by ID or name"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      {selectedStudent ? (
        <div className="flex items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
          <div className="flex min-w-0 items-center gap-2">
            <UserRound className="h-4 w-4 text-muted-foreground" />
            <p className="truncate font-medium">
              {selectedStudent.firstName} {selectedStudent.lastName} (
              {selectedStudent.studentId})
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onSelect(null)}
          >
            Clear
          </Button>
        </div>
      ) : null}

      <div className="max-h-56 overflow-y-auto rounded-md border border-border">
        {loading ? (
          <p className="px-3 py-2 text-sm text-muted-foreground">
            Searching students...
          </p>
        ) : !hasItems ? (
          <p className="px-3 py-2 text-sm text-muted-foreground">
            No students found
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((item) => {
              const active = selectedStudent?.id === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-muted/40",
                      active ? "bg-primary/10" : "",
                    )}
                    onClick={() => onSelect(item)}
                  >
                    <span className="font-medium">
                      {item.firstName} {item.lastName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {item.studentId} · {item.class?.name ?? "Unassigned"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
