"use client";

import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error("[DASHBOARD_ERROR_BOUNDARY]", {
    message: error.message,
    digest: error.digest,
  });

  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
      <h2 className="text-lg font-semibold text-destructive">
        Dashboard failed to load
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Please retry. If this keeps happening, share the error digest with
        support.
      </p>
      {error.digest ? (
        <p className="mt-2 text-xs font-mono text-muted-foreground">
          Digest: {error.digest}
        </p>
      ) : null}
      <Button onClick={reset} className="mt-4" size="sm">
        Retry
      </Button>
    </div>
  );
}
