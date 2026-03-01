"use client";

import { CheckCircle2, CircleOff, Trash2, X } from "lucide-react";
import { toast } from "sonner";

interface MacDeleteToastInput {
  entity: "Student" | "Teacher" | "Subject" | "Class";
  name?: string;
}

interface MacStatusToastInput {
  entity: "Student" | "Teacher" | "Subject" | "Class";
  status: "ACTIVE" | "INACTIVE";
  name?: string;
}

export function showMacDeleteToast({ entity, name }: MacDeleteToastInput) {
  toast.custom(
    (id) => (
      <div className="relative w-[320px] rounded-2xl border border-white/30 bg-gradient-to-b from-zinc-900/90 via-zinc-900/85 to-zinc-950/90 p-3 text-zinc-50 shadow-2xl backdrop-blur-xl">
        <button
          type="button"
          aria-label="Close notification"
          onClick={() => toast.dismiss(id)}
          className="absolute right-2 top-2 rounded-md p-1 text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        <div className="mb-2 flex items-center gap-2">
          <div className="rounded-xl border border-red-400/35 bg-red-500/20 p-1.5">
            <Trash2 className="h-3.5 w-3.5 text-red-300" />
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wide text-zinc-200">scholaOps</p>
            <p className="text-[10px] text-zinc-400">Archive Notification</p>
          </div>
        </div>

        <p className="text-sm font-medium">
          {entity} moved to inactive
          {name ? ":" : "."}
        </p>
        {name ? <p className="truncate text-xs text-zinc-300">{name}</p> : null}

        <div className="mt-2 text-[10px] uppercase tracking-wide text-zinc-500">
          Action can be reverted via edit or status toggle
        </div>
      </div>
    ),
    {
      duration: 4200,
      position: "bottom-right",
    },
  );
}

export function showMacStatusToast({
  entity,
  status,
  name,
}: MacStatusToastInput) {
  const isActive = status === "ACTIVE";
  toast.custom(
    (id) => (
      <div className="relative w-[320px] rounded-2xl border border-white/30 bg-gradient-to-b from-zinc-900/90 via-zinc-900/85 to-zinc-950/90 p-3 text-zinc-50 shadow-2xl backdrop-blur-xl">
        <button
          type="button"
          aria-label="Close notification"
          onClick={() => toast.dismiss(id)}
          className="absolute right-2 top-2 rounded-md p-1 text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        <div className="mb-2 flex items-center gap-2">
          <div
            className={
              isActive
                ? "rounded-xl border border-emerald-400/35 bg-emerald-500/20 p-1.5"
                : "rounded-xl border border-amber-400/35 bg-amber-500/20 p-1.5"
            }
          >
            {isActive ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
            ) : (
              <CircleOff className="h-3.5 w-3.5 text-amber-300" />
            )}
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wide text-zinc-200">scholaOps</p>
            <p className="text-[10px] text-zinc-400">Status Update</p>
          </div>
        </div>

        <p className="text-sm font-medium">
          {entity} marked {isActive ? "active" : "inactive"}
          {name ? ":" : "."}
        </p>
        {name ? <p className="truncate text-xs text-zinc-300">{name}</p> : null}

        <div className="mt-2 text-[10px] uppercase tracking-wide text-zinc-500">
          Tenant-scoped status applied
        </div>
      </div>
    ),
    {
      duration: 4200,
      position: "bottom-right",
    },
  );
}
