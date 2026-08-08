import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type EventDetail = { id: string; title: string; slug: string; event_date: string; event_time: string | null; venue: string; city: string; description: string; image_url: string; ticket_url: string; additional_url: string; cta_label: string };
export const Route = createFileRoute("/events/$slug")({ component: EventDetailPage });

function EventDetailPage() {
  const { slug } = Route.useParams();
  const { data, isLoading, error } = useQuery({ queryKey: ["event", slug], queryFn: async () => {
    const { data, error } = await supabase.from("events").select("*").eq("slug" as never, slug).eq("is_published" as never, true).maybeSingle();
    if (error) throw error;
    return data as unknown as EventDetail | null;
  }});
  if (isLoading) return <main className="detail-page section-shell"><p>Loading event…</p></main>;
  if (error || !data) return <main className="detail-page section-shell"><h1>Event not found</h1><Link to="/">Return home</Link></main>;
  const date = new Date(`${data.event_date}T00:00:00`);
  return <main className="detail-page section-shell"><Link to="/">← Back to Maxx Bond</Link><article className="detail-card glass">{data.image_url && <img src={data.image_url} alt={`${data.title} artwork`} />}<div><p className="eyebrow">Event</p><h1>{data.title}</h1><p><Calendar /> {date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>{data.event_time && <p><Clock /> {data.event_time.slice(0, 5)}</p>}<p><MapPin /> {data.venue} · {data.city}</p><div className="detail-description">{data.description}</div><div className="detail-actions">{data.ticket_url && <a className="listen-button" href={data.ticket_url} target="_blank" rel="noreferrer">Tickets</a>}{data.additional_url && <a className="tour-ticket" href={data.additional_url} target="_blank" rel="noreferrer">{data.cta_label || "More Info"}</a>}</div></div></article></main>;
}
