import type { EventItem } from "@/lib/site-content";

export function EventsSection({ events }: { events: EventItem[] }) {
  return (
    <section id="tour" className="content-panel tour section-shell reveal">
      <div className="section-heading">
        <p className="eyebrow">Tour dates</p>
      </div>
      <div className="tour-list">
        {events.length ? (
          events.map((event) => {
            const date = new Date(`${event.event_date}T00:00:00`);
            return (
              <article key={event.id}>
                <time>
                  <b>{date.toLocaleString("en", { month: "short" })}</b>
                  {String(date.getDate()).padStart(2, "0")}
                </time>
                <p>
                  <strong>{event.city}</strong>
                  <span>{event.venue}</span>
                </p>
                {event.ticket_url ? (
                  <a className="tour-ticket" href={event.ticket_url} target="_blank" rel="noreferrer">
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
