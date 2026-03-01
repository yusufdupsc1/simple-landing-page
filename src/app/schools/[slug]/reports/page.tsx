import Link from "next/link";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function SchoolReportsPage({ params }: PageProps) {
  const { slug } = await params;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-border bg-card p-6">
          <h1 className="text-2xl font-bold tracking-tight">Detailed Public Reports</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This section can be extended with downloadable public summaries and trend charts.
            Current public KPIs are available on the school summary page.
          </p>
          <Link href={`/schools/${slug}`} className="mt-4 inline-block text-sm text-primary underline-offset-4 hover:underline">
            Back to school summary
          </Link>
        </div>
      </div>
    </main>
  );
}
