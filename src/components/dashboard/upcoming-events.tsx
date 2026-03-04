import { formatDate } from "@/lib/utils";
import { CalendarDays, ArrowRight } from "lucide-react";
import Link from "next/link";

interface EventItem {
  id: string;
  title: string;
  startDate: Date;
  type: string;
}

interface UpcomingEventsProps {
  events: EventItem[];
  isBangla: boolean;
}

export function UpcomingEvents({ events, isBangla }: UpcomingEventsProps) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <CalendarDays className="h-5 w-5 text-violet-500" />
          {isBangla ? "আসন্ন ইভেন্ট" : "Upcoming Events"}
        </h2>
        <Link
          href="/dashboard/events"
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          {isBangla ? "সব দেখুন" : "View all"}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {events.length ? (
        <div className="space-y-2">
          {events.map((event) => (
            <div
              key={event.id}
              className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-3 py-2.5"
            >
              <div>
                <p className="text-sm font-semibold">{event.title}</p>
                <p className="text-xs text-muted-foreground">{event.type}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDate(event.startDate)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex min-h-44 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/10 text-center">
          <CalendarDays className="mb-3 h-8 w-8 text-muted-foreground/60" />
          <p className="text-sm font-medium text-muted-foreground">
            {isBangla ? "কোনো আসন্ন ইভেন্ট নেই" : "No upcoming events"}
          </p>
          <Link
            href="/dashboard/events"
            className="mt-4 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-muted"
          >
            {isBangla ? "ইভেন্ট যোগ করুন" : "Add Event"}
          </Link>
        </div>
      )}
    </section>
  );
}
