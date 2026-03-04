import type { DomainEventType } from "@/server/events/types";
import {
  getRecentDomainEvents,
  subscribeDomainEvents,
} from "@/server/events/publish";

const encoder = new TextEncoder();

function toSseFrame(payload: string) {
  return encoder.encode(`${payload}\n\n`);
}

function eventFrame(event: unknown) {
  return toSseFrame(`data: ${JSON.stringify(event)}`);
}

export function createEventStream({
  institutionId,
  types,
  since,
  pollIntervalMs = 30000,
  signal,
}: {
  institutionId: string;
  types: DomainEventType[];
  since?: string;
  pollIntervalMs?: number;
  signal?: AbortSignal;
}) {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(
        toSseFrame(`event: ready\ndata: ${JSON.stringify({ types })}`),
      );

      const initialEvents = getRecentDomainEvents(
        institutionId,
        types,
        since,
        50,
      );
      for (const event of initialEvents) {
        controller.enqueue(eventFrame(event));
      }

      const unsubscribe = subscribeDomainEvents(types, (event) => {
        if (event.institutionId !== institutionId) return;
        controller.enqueue(eventFrame(event));
      });

      const heartbeat = setInterval(
        () => {
          controller.enqueue(toSseFrame(`event: ping\ndata: ${Date.now()}`));
        },
        Math.max(10000, pollIntervalMs),
      );

      const onAbort = () => {
        clearInterval(heartbeat);
        unsubscribe();
        controller.close();
      };

      signal?.addEventListener("abort", onAbort, { once: true });
    },
    cancel() {
      return;
    },
  });
}

export function isSseRequest(acceptHeader: string | null) {
  return Boolean(acceptHeader?.includes("text/event-stream"));
}
