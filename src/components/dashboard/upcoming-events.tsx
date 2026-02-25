import { formatDate } from "@/lib/utils";

interface EventItem {
  id: string;
  title: string;
  startDate: Date;
  type: string;
}

import { CalendarDays } from "lucide-react";

export function UpcomingEvents({ events }: { events: EventItem[] }) {
  return (
    <section className="group h-full rounded-3xl border border-border/50 bg-card p-6 shadow-sm hover:border-border transition-colors relative overflow-hidden flex flex-col">
      <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <h2 className="mb-6 text-lg font-semibold tracking-tight relative z-10 flex items-center justify-between">
        Upcoming Events
        <CalendarDays className="h-5 w-5 text-purple-500/70" />
      </h2>
      <div className="space-y-3 flex-1 relative z-10">
        {events.length ? (
          events.map((event) => (
            <div key={event.id} className="relative overflow-hidden rounded-2xl border border-border/40 bg-muted/20 px-4 py-3 hover:bg-muted/50 transition-colors">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500/50" />
              <p className="font-semibold text-sm mb-0.5">{event.title}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium text-purple-600 dark:text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">{event.type}</span>
                <span>•</span>
                <span>{formatDate(event.startDate)}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-6 border border-dashed border-border rounded-xl bg-muted/10">
            <p className="text-sm font-medium text-muted-foreground">No upcoming events.</p>
            <p className="text-xs text-muted-foreground mt-1">Check back later for updates.</p>
          </div>
        )}
      </div>
    </section>
  );
}
