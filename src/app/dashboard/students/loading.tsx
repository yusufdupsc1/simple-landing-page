import { TableSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 w-48 rounded bg-muted" />
      <TableSkeleton />
    </div>
  );
}
