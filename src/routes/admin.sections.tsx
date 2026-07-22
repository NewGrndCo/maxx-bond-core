import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ManagerCard, ManagerHeader, Visibility } from "@/components/admin/manager-ui";

export const Route = createFileRoute("/admin/sections")({ component: SectionsPage });
const DEFAULTS = ["hero", "streaming", "about", "gallery", "merch", "events", "newsletter"];

function SectionsPage() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
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
  const rows = DEFAULTS.map(
    (key, i) =>
      data.find((x) => x.key === key) ?? {
        id: "",
        key,
        title: key[0].toUpperCase() + key.slice(1),
        subtitle: "",
        body: "",
        display_order: i,
        is_visible: true,
        created_at: "",
        updated_at: "",
      },
  );
  const update = async (
    row: (typeof rows)[number],
    patch: { is_visible?: boolean; display_order?: number },
  ) => {
    const payload = {
      key: row.key,
      title: row.title,
      subtitle: row.subtitle,
      body: row.body,
      is_visible: patch.is_visible ?? row.is_visible,
      display_order: patch.display_order ?? row.display_order,
    };
    const result = row.id
      ? await supabase.from("site_sections").update(payload).eq("id", row.id)
      : await supabase.from("site_sections").insert(payload);
    if (result.error) return toast.error(result.error.message);
    await qc.invalidateQueries({ queryKey: ["admin-sections"] });
  };
  const move = async (index: number, amount: number) => {
    const other = rows[index + amount];
    if (!other) return;
    await Promise.all([
      update(rows[index], { display_order: other.display_order }),
      update(other, { display_order: rows[index].display_order }),
    ]);
  };
  return (
    <div className="space-y-6">
      <ManagerHeader
        title="Site Sections"
        description="Hide sections or change the order they appear on the public homepage."
      />
      <div className="space-y-3">
        {rows.map((row, index) => (
          <ManagerCard key={row.key}>
            <div className="flex items-center gap-4">
              <div className="w-8 text-center text-neutral-500">{index + 1}</div>
              <div className="flex-1 font-medium capitalize">{row.key}</div>
              <Visibility
                checked={row.is_visible}
                onCheckedChange={(v) => update(row, { is_visible: v })}
              />
              <Button
                variant="outline"
                size="sm"
                disabled={index === 0}
                onClick={() => move(index, -1)}
              >
                ↑
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={index === rows.length - 1}
                onClick={() => move(index, 1)}
              >
                ↓
              </Button>
            </div>
          </ManagerCard>
        ))}
      </div>
    </div>
  );
}
