export function StudentsHeader({ total }: { total: number }) {
  return (
    <div className="space-y-0.5">
      <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Students</h1>
      <p className="text-sm text-muted-foreground">{total} total records</p>
    </div>
  );
}
