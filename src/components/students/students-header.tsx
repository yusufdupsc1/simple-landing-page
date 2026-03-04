"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/client";

export function StudentsHeader({ total }: { total: number }) {
  const { t } = useT();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-0.5">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          {t("students")}
        </h1>
        <p className="text-sm text-muted-foreground">{total} total records</p>
      </div>
      <Link href="/dashboard/students/reports">
        <Button type="button" variant="outline">
          {t("reports")}
        </Button>
      </Link>
    </div>
  );
}
