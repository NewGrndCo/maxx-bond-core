import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  DeleteButton,
  ManagerCard,
  ManagerHeader,
  TextAreaField,
  TextField,
  Visibility,
  uploadPublicFile,
} from "@/components/admin/manager-ui";

export const Route = createFileRoute("/admin/events")({ component: EventsPage });
type EventRow = Tables<"events"> & {
  title: string;
  slug: string;
  event_time: string | null;
  description: string;
  image_url: string;
  additional_url: string;
  cta_label: string;
  is_published: boolean;
};
const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

function EventsPage() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-events"],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").order("event_date");
      if (error) throw error;
      return data as EventRow[];
    },
  });
  const [draft, setDraft] = useState<EventRow | null>(null);
  const [busy, setBusy] = useState(false);
  const fresh = (): EventRow => ({
    id: crypto.randomUUID(),
    title: "",
    slug: "",
    event_date: new Date().toISOString().slice(0, 10),
    event_time: null,
    city: "",
    venue: "",
    ticket_url: "",
    additional_url: "",
    cta_label: "More Info",
    description: "",
    image_url: "",
    notes: "",
    display_order: data.length,
    is_visible: true,
    is_published: false,
    created_at: "",
    updated_at: "",
  });
  const row = draft ?? fresh();
  const set = <K extends keyof EventRow>(key: K, value: EventRow[K]) =>
    setDraft({ ...row, [key]: value });
  const save = async () => {
    if (!row.title.trim() || !row.venue.trim() || !row.city.trim())
      return toast.error("Event name, venue, and location are required");
    const payload = {
      title: row.title.trim(),
      slug: slugify(row.slug || row.title),
      event_date: row.event_date,
      event_time: row.event_time || null,
      city: row.city,
      venue: row.venue,
      ticket_url: row.ticket_url,
      additional_url: row.additional_url,
      cta_label: row.cta_label,
      description: row.description,
      image_url: row.image_url,
      notes: row.notes,
      display_order: row.display_order,
      is_visible: row.is_visible,
      is_published: row.is_published,
    };
    setBusy(true);
    const exists = data.some((item) => item.id === row.id);
    const result = exists
      ? await supabase
          .from("events")
          .update(payload as never)
          .eq("id", row.id)
      : await supabase.from("events").insert(payload as never);
    setBusy(false);
    if (result.error) return toast.error(result.error.message);
    toast.success("Event saved");
    setDraft(null);
    await qc.invalidateQueries({ queryKey: ["admin-events"] });
  };
  const upload = async (file: File) => {
    setBusy(true);
    try {
      set("image_url", await uploadPublicFile("artist-images", "events", file));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };
  const remove = async (id: string) => {
    if (!confirm("Permanently delete this event?")) return;
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Event deleted");
    await qc.invalidateQueries({ queryKey: ["admin-events"] });
  };
  return (
    <div className="space-y-6">
      <ManagerHeader
        title="Events"
        description="Create event pages, artwork, schedules, locations, and ticket CTAs."
        action={
          <Button className="bg-amber-300 text-black" onClick={() => setDraft(fresh())}>
            Add event
          </Button>
        }
      />
      {draft && (
        <ManagerCard>
          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              label="Event name"
              value={row.title}
              onChange={(e) => set("title", e.target.value)}
            />
            <TextField
              label="URL slug"
              value={row.slug}
              placeholder={slugify(row.title)}
              onChange={(e) => set("slug", e.target.value)}
            />
            <TextField
              label="Date"
              type="date"
              value={row.event_date}
              onChange={(e) => set("event_date", e.target.value)}
            />
            <TextField
              label="Time"
              type="time"
              value={row.event_time ?? ""}
              onChange={(e) => set("event_time", e.target.value || null)}
            />
            <TextField
              label="Venue"
              value={row.venue}
              onChange={(e) => set("venue", e.target.value)}
            />
            <TextField
              label="City / location"
              value={row.city}
              onChange={(e) => set("city", e.target.value)}
            />
            <TextField
              label="Ticket URL"
              value={row.ticket_url ?? ""}
              onChange={(e) => set("ticket_url", e.target.value)}
            />
            <TextField
              label="Additional URL"
              value={row.additional_url}
              onChange={(e) => set("additional_url", e.target.value)}
            />
            <TextField
              label="Additional CTA label"
              value={row.cta_label}
              onChange={(e) => set("cta_label", e.target.value)}
            />
          </div>
          <TextAreaField
            label="Description"
            value={row.description}
            onChange={(e) => set("description", e.target.value)}
          />
          <label className="text-sm text-neutral-300">
            Event artwork
            <input
              className="mt-2 block w-full"
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && void upload(e.target.files[0])}
            />
          </label>
          {row.image_url && (
            <img
              src={row.image_url}
              alt="Event artwork preview"
              className="h-40 w-40 rounded object-cover"
            />
          )}
          <div className="flex flex-wrap gap-6">
            <Visibility
              checked={row.is_published}
              onCheckedChange={(value) => set("is_published", value)}
              label="Published"
            />
            <Visibility
              checked={row.is_visible}
              onCheckedChange={(value) => set("is_visible", value)}
              label="Visible in tour list"
            />
          </div>
          <div className="flex gap-2">
            <Button disabled={busy} className="bg-amber-300 text-black" onClick={() => void save()}>
              Save event
            </Button>
            <Button variant="outline" onClick={() => setDraft(null)}>
              Cancel
            </Button>
          </div>
        </ManagerCard>
      )}
      {isLoading ? (
        <p>Loading…</p>
      ) : (
        <div className="space-y-3">
          {data.map((event) => (
            <ManagerCard key={event.id}>
              <div className="flex flex-wrap items-center gap-4">
                {event.image_url && (
                  <img src={event.image_url} alt="" className="h-16 w-16 rounded object-cover" />
                )}
                <div className="flex-1">
                  <strong>{event.title}</strong>
                  <div className="text-sm text-neutral-400">
                    {event.event_date}
                    {event.event_time ? ` at ${event.event_time}` : ""} · {event.venue},{" "}
                    {event.city}
                  </div>
                </div>
                <span className="text-xs">{event.is_published ? "Published" : "Draft"}</span>
                <Button variant="outline" onClick={() => setDraft(event)}>
                  Edit
                </Button>
                <DeleteButton onClick={() => void remove(event.id)} />
              </div>
            </ManagerCard>
          ))}
        </div>
      )}
    </div>
  );
}
