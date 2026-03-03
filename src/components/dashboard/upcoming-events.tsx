import { formatDate, cn } from "@/lib/utils";
import { CalendarDays, ArrowRight } from "lucide-react";
import Link from "next/link";

interface EventItem {
  id: string;
  title: string;
  startDate: Date;
  type: string;
}

export function UpcomingEvents({ events }: { events: EventItem[] }) {
  return (
    <section className="group relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-border/40 bg-card/60 backdrop-blur-xl p-6 shadow-sm shadow-black/5 transition-premium hover:border-primary/20 premium-shadow">
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col">
          <h2 className="text-lg font-black tracking-tight text-foreground/90 flex items-center gap-2">
            Academic Calendar
          </h2>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Scheduled Events</p>
        </div>
        <Link href="/dashboard/events" className="text-[11px] font-bold text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors uppercase tracking-widest leading-none">
          Full Schedule <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="space-y-4 flex-1 relative z-10">
        {events.length ? (
          events.map((event, i) => (
            <div
              key={event.id}
              className="group/item relative overflow-hidden rounded-2xl border border-border/40 bg-muted/20 px-4 py-4 hover:bg-card hover:border-border hover:shadow-md transition-premium"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-bold text-sm text-foreground/90 group-hover/item:text-primary transition-colors leading-tight">
                    {event.title}
                  </p>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-widest text-[9px]">
                      {event.type}
                    </span>
                    <span className="text-muted-foreground/60">•</span>
                    <span className="text-muted-foreground font-medium">{formatDate(event.startDate)}</span>
                  </div>
                </div>
                <div className="h-10 w-10 rounded-xl bg-background/50 flex flex-col items-center justify-center border border-border/40 shadow-sm">
                  <span className="text-[10px] font-black text-primary leading-none">
                    {new Date(event.startDate).getDate()}
                  </span>
                  <span className="text-[8px] font-bold text-muted-foreground uppercase">
                    {new Date(event.startDate).toLocaleString('default', { month: 'short' })}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="h-40 flex flex-col items-center justify-center p-6 border-2 border-dashed border-border/60 rounded-[1.5rem] bg-muted/10">
            <CalendarDays className="h-10 w-10 text-muted-foreground/20 mb-3" />
            <p className="text-sm font-bold text-muted-foreground/60">No scheduled events</p>
            <p className="text-[10px] text-muted-foreground/40 mt-1 uppercase tracking-widest">Calendar is clear</p>
          </div>
        )}
      </div>
    </section>
  );
}
