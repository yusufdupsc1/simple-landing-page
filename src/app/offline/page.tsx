import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <h1 className="text-2xl font-bold">You are offline</h1>
      <p className="text-sm text-muted-foreground">
        Dhadash could not reach the network. Reconnect to sync your latest
        school data.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
      >
        Retry
      </Link>
    </main>
  );
}
