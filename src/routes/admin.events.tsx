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
} from "@/components/admin/manager-ui";
export const Route = createFileRoute("/admin/events")({ component: EventsPage });
type EventRow = Tables<"events">;
function EventsPage() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["admin-events"],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").order("event_date");
      if (error) throw error;
      return data;
    },
  });
  const [draft, setDraft] = useState<EventRow | null>(null);
  const fresh = (): EventRow => ({
    id: crypto.randomUUID(),
    event_date: new Date().toISOString().slice(0, 10),
    city: "",
    venue: "",
    ticket_url: "",
    notes: "",
    display_order: data.length,
    is_visible: true,
    created_at: "",
    updated_at: "",
  });
  const row = draft ?? fresh();
  const set = <K extends keyof EventRow>(k: K, v: EventRow[K]) => setDraft({ ...row, [k]: v });
  const save = async () => {
    const payload = {
      event_date: row.event_date,
      city: row.city,
      venue: row.venue,
      ticket_url: row.ticket_url,
      notes: row.notes,
      display_order: row.display_order,
      is_visible: row.is_visible,
    };
    const exists = data.some((x) => x.id === row.id);
    const result = exists
      ? await supabase.from("events").update(payload).eq("id", row.id)
      : await supabase.from("events").insert(payload);
    if (result.error) return toast.error(result.error.message);
    setDraft(null);
    await qc.invalidateQueries({ queryKey: ["admin-events"] });
  };
  const remove = async (id: string) => {
    if (!confirm("Delete event?")) return;
    await supabase.from("events").delete().eq("id", id);
    await qc.invalidateQueries({ queryKey: ["admin-events"] });
  };
  return (
    <div className="space-y-6">
      <ManagerHeader
        title="Events"
        description="Publish tour dates and ticket links."
        action={
          <Button className="bg-amber-300 text-black" onClick={() => setDraft(fresh())}>
            Add event
          </Button>
        }
      />
      {draft && (
        <ManagerCard>
          <div className="grid gap-4 md:grid-cols-3">
            <TextField
              label="Date"
              type="date"
              value={row.event_date}
              onChange={(e) => set("event_date", e.target.value)}
            />
            <TextField
              label="City"
              value={row.city}
              onChange={(e) => set("city", e.target.value)}
            />
            <TextField
              label="Venue"
              value={row.venue}
              onChange={(e) => set("venue", e.target.value)}
            />
          </div>
          <TextField
            label="Ticket URL"
            value={row.ticket_url ?? ""}
            onChange={(e) => set("ticket_url", e.target.value)}
          />
          <TextAreaField
            label="Notes"
            value={row.notes ?? ""}
            onChange={(e) => set("notes", e.target.value)}
          />
          <Visibility checked={row.is_visible} onCheckedChange={(v) => set("is_visible", v)} />
          <div className="flex gap-2">
            <Button className="bg-amber-300 text-black" onClick={save}>
              Save event
            </Button>
            <Button variant="outline" onClick={() => setDraft(null)}>
              Cancel
            </Button>
          </div>
        </ManagerCard>
      )}
      <div className="space-y-3">
        {data.map((event) => (
          <ManagerCard key={event.id}>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1">
                <strong>{event.city}</strong>
                <div className="text-sm text-neutral-400">
                  {event.event_date} · {event.venue}
                </div>
              </div>
              <span className="text-xs">{event.is_visible ? "Visible" : "Hidden"}</span>
              <Button variant="outline" onClick={() => setDraft(event)}>
                Edit
              </Button>
              <DeleteButton onClick={() => remove(event.id)} />
            </div>
          </ManagerCard>
        ))}
      </div>
    </div>
  );
}
