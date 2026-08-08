import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ManagerCard, ManagerHeader, managerInput } from "@/components/admin/manager-ui";

export const Route = createFileRoute("/admin/links")({ component: LinksPage });
const PLATFORMS = [
  "Spotify",
  "Apple Music",
  "YouTube Music",
  "TIDAL",
  "Amazon Music",
  "SoundCloud",
  "Audiomack",
  "Deezer",
  "Pandora",
  "iHeartRadio",
  "Triller",
];
const SOCIAL_PLATFORMS = ["Instagram", "TikTok", "YouTube", "X", "Facebook", "Threads"];

function LinksPage() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["admin-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("streaming_links")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });
  const save = async (
    platform: string,
    url: string,
    is_visible: boolean,
    display_order: number,
  ) => {
    const existing = data.find((x) => x.platform === platform);
    const result = existing
      ? await supabase
          .from("streaming_links")
          .update({ url, is_visible, display_order })
          .eq("id", existing.id)
      : await supabase.from("streaming_links").insert({ platform, url, is_visible, display_order });
    if (result.error) {
      toast.error(result.error.message);
      return;
    }
    toast.success(`${platform} saved`);
    await qc.invalidateQueries({ queryKey: ["admin-links"] });
  };
  return (
    <div className="space-y-6">
      <ManagerHeader
        title="Listen Everywhere"
        description="Only visible platforms with a valid URL appear in the public modal."
      />
      <div className="space-y-3">
        {PLATFORMS.map((platform, index) => {
          const row = data.find((x) => x.platform === platform);
          return (
            <LinkRow
              key={`${platform}-${row?.updated_at ?? "new"}`}
              platform={platform}
              initialUrl={row?.url ?? ""}
              initialVisible={row?.is_visible ?? true}
              order={row?.display_order ?? index}
              onSave={save}
            />
          );
        })}
      </div>
      <SocialLinksManager />
    </div>
  );
}

function SocialLinksManager() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["admin-social-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_links" as never)
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data as unknown as Array<{
        id: string;
        platform: string;
        url: string;
        is_visible: boolean;
        display_order: number;
      }>;
    },
  });
  const save = async (
    platform: string,
    url: string,
    is_visible: boolean,
    display_order: number,
  ) => {
    const existing = data.find((item) => item.platform === platform);
    const result = existing
      ? await supabase
          .from("social_links" as never)
          .update({ url, is_visible, display_order } as never)
          .eq("id", existing.id)
      : await supabase
          .from("social_links" as never)
          .insert({ platform, url, is_visible, display_order } as never);
    if (result.error) return toast.error(result.error.message);
    toast.success(`${platform} saved`);
    await qc.invalidateQueries({ queryKey: ["admin-social-links"] });
  };
  return (
    <section className="space-y-3 pt-8">
      <ManagerHeader
        title="Social profiles"
        description="These links appear under Stay Connected and remain separate from streaming services."
      />
      {SOCIAL_PLATFORMS.map((platform, index) => {
        const row = data.find((item) => item.platform === platform);
        return (
          <LinkRow
            key={`${platform}-${row?.id ?? "new"}`}
            platform={platform}
            initialUrl={row?.url ?? ""}
            initialVisible={row?.is_visible ?? true}
            order={row?.display_order ?? index}
            onSave={save}
          />
        );
      })}
    </section>
  );
}

function LinkRow({
  platform,
  initialUrl,
  initialVisible,
  order,
  onSave,
}: {
  platform: string;
  initialUrl: string;
  initialVisible: boolean;
  order: number;
  onSave: (p: string, u: string, v: boolean, o: number) => Promise<void>;
}) {
  let url = initialUrl;
  let visible = initialVisible;
  return (
    <ManagerCard>
      <div className="grid items-center gap-3 md:grid-cols-[150px_1fr_auto_auto]">
        <strong>{platform}</strong>
        <Input
          className={managerInput}
          defaultValue={url}
          placeholder="https://…"
          onChange={(e) => {
            url = e.target.value;
          }}
        />
        <label className="flex items-center gap-2 text-xs">
          <Switch
            defaultChecked={visible}
            onCheckedChange={(v) => {
              visible = v;
            }}
          />
          Visible
        </label>
        <Button variant="outline" onClick={() => onSave(platform, url.trim(), visible, order)}>
          Save
        </Button>
      </div>
    </ManagerCard>
  );
}
