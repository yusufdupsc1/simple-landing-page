import {
  ChartSkeleton,
  StatsSkeleton,
  TableSkeleton,
} from "@/components/ui/skeletons";

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <StatsSkeleton />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartSkeleton />
        </div>
        <ChartSkeleton />
      </div>
      <TableSkeleton />
    </div>
  );
}
