import type { EventItem } from "@/lib/site-content";
import { Link } from "@tanstack/react-router";

type PublicEvent = EventItem & { title?: string; slug?: string; event_time?: string | null };

export function EventsSection({ events }: { events: EventItem[] }) {
  return (
    <section id="tour" className="content-panel tour section-shell reveal">
      <div className="section-heading">
        <p className="eyebrow">Tour dates</p>
      </div>
      <div className="tour-list">
        {events.length ? (
          (events as PublicEvent[]).map((event) => {
            const date = new Date(`${event.event_date}T00:00:00`);
            return (
              <article key={event.id}>
                <time>
                  <b>{date.toLocaleString("en", { month: "short" })}</b>
                  {String(date.getDate()).padStart(2, "0")}
                </time>
                <p>
                  <strong>{event.title || event.venue}</strong>
                  <span>
                    {event.venue} · {event.city}
                    {event.event_time ? ` · ${event.event_time.slice(0, 5)}` : ""}
                  </span>
                </p>
                {event.slug ? (
                  <Link className="tour-ticket" to="/events/$slug" params={{ slug: event.slug }}>
                    Details
                  </Link>
                ) : null}
                {event.ticket_url ? (
                  <a
                    className="tour-ticket"
                    href={event.ticket_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Tickets
                  </a>
                ) : (
                  <span />
                )}
              </article>
            );
          })
        ) : (
          <p className="empty-content">No upcoming dates.</p>
        )}
      </div>
    </section>
  );
}
