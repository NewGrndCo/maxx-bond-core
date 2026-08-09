import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type DragEvent } from "react";
import { ArrowDown, ArrowUp, GripVertical, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ManagerCard, ManagerHeader, Visibility } from "@/components/admin/manager-ui";

export const Route = createFileRoute("/admin/sections")({ component: SectionsPage });
const DEFAULTS = ["hero", "about", "merch", "events", "newsletter"] as const;
type SectionRow = Tables<"site_sections">;

function normalizeRows(data: SectionRow[]): SectionRow[] {
  const known = DEFAULTS.map((key, index) => {
    const existing = data.find((row) => row.key === key);
    return (
      existing ?? {
        id: "",
        key,
        title: key[0].toUpperCase() + key.slice(1),
        subtitle: "",
        body: "",
        display_order: index,
        is_visible: true,
        created_at: "",
        updated_at: "",
      }
    );
  });
  return known
    .sort(
      (a, b) =>
        a.display_order - b.display_order ||
        DEFAULTS.indexOf(a.key as never) - DEFAULTS.indexOf(b.key as never),
    )
    .map((row, display_order) => ({ ...row, display_order }));
}

function SectionsPage() {
  const qc = useQueryClient();
  const [rows, setRows] = useState<SectionRow[]>([]);
  const [draggedKey, setDraggedKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-sections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_sections")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => setRows(normalizeRows(data)), [data]);

  const persist = async (next: SectionRow[], successMessage = "Section order saved") => {
    setRows(next);
    setSaving(true);
    const payload = next.map((row, display_order) => ({
      key: row.key,
      title: row.title,
      subtitle: row.subtitle,
      body: row.body,
      is_visible: row.is_visible,
      display_order,
    }));
    const { error } = await supabase.from("site_sections").upsert(payload, { onConflict: "key" });
    setSaving(false);
    if (error) {
      setRows(normalizeRows(data));
      return toast.error(error.message);
    }
    toast.success(successMessage);
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["admin-sections"] }),
      qc.invalidateQueries({ queryKey: ["public-site-content"] }),
    ]);
  };

  const reorder = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0 || to >= rows.length || saving) return;
    const next = [...rows];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    void persist(next.map((row, display_order) => ({ ...row, display_order })));
  };

  const drop = (event: DragEvent, targetKey: string) => {
    event.preventDefault();
    const sourceKey = draggedKey || event.dataTransfer.getData("text/plain");
    setDraggedKey(null);
    reorder(
      rows.findIndex((row) => row.key === sourceKey),
      rows.findIndex((row) => row.key === targetKey),
    );
  };

  const setVisibility = (key: string, is_visible: boolean) => {
    const next = rows.map((row) => (row.key === key ? { ...row, is_visible } : row));
    void persist(next, `${key[0].toUpperCase() + key.slice(1)} visibility saved`);
  };

  return (
    <div className="space-y-6">
      <ManagerHeader
        title="Site Sections"
        description="Drag sections into the exact homepage order. Changes save automatically."
        action={
          saving ? (
            <span className="flex items-center gap-2 text-sm text-amber-200">
              <Loader2 className="h-4 w-4 animate-spin" /> Saving
            </span>
          ) : null
        }
      />
      {isLoading ? (
        <p className="text-neutral-400">Loading sections…</p>
      ) : (
        <div className="space-y-3">
          {rows.map((row, index) => (
            <div
              key={row.key}
              draggable={!saving}
              onDragStart={(event) => {
                setDraggedKey(row.key);
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", row.key);
              }}
              onDragEnd={() => setDraggedKey(null)}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
              }}
              onDrop={(event) => drop(event, row.key)}
              className={draggedKey === row.key ? "opacity-45" : ""}
            >
              <ManagerCard>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="cursor-grab touch-none text-neutral-500 active:cursor-grabbing"
                    aria-label={`Drag ${row.title || row.key} section`}
                  >
                    <GripVertical className="h-5 w-5" />
                  </button>
                  <div className="w-7 text-center text-sm text-neutral-500">{index + 1}</div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium capitalize">{row.title || row.key}</div>
                    <div className="text-xs text-neutral-500">Homepage section</div>
                  </div>
                  <Visibility
                    checked={row.is_visible}
                    onCheckedChange={(value) => setVisibility(row.key, value)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={saving || index === 0}
                    aria-label={`Move ${row.key} up`}
                    onClick={() => reorder(index, index - 1)}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={saving || index === rows.length - 1}
                    aria-label={`Move ${row.key} down`}
                    onClick={() => reorder(index, index + 1)}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>
              </ManagerCard>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
