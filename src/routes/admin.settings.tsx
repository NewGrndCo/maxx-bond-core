import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  ManagerCard,
  ManagerHeader,
  TextAreaField,
  TextField,
  Visibility,
  uploadPublicFile,
} from "@/components/admin/manager-ui";

export const Route = createFileRoute("/admin/settings")({ component: SettingsPage });
type Newsletter = { headline: string; body: string; image_url: string; cta_label: string };
type MusicPlayerSettings = { autoplay: boolean };
const defaults: Newsletter = {
  headline: "Join the Foreign Life List",
  body: "Be the first to know about new music, merch drops, tour dates, and exclusive content.",
  image_url: "",
  cta_label: "Join Now",
};
function SettingsPage() {
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Newsletter | null>(null);
  const [busy, setBusy] = useState(false);
  const [musicDraft, setMusicDraft] = useState<MusicPlayerSettings | null>(null);
  const { data } = useQuery({
    queryKey: ["site-settings", "newsletter"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .eq("key", "newsletter")
        .maybeSingle();
      if (error) throw error;
      return (data?.value ?? defaults) as Newsletter;
    },
  });
  const { data: savedMusicSettings } = useQuery({
    queryKey: ["site-settings", "music-player"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .eq("key", "music_player")
        .maybeSingle();
      if (error) throw error;
      return (data?.value ?? { autoplay: true }) as MusicPlayerSettings;
    },
  });
  const value = draft ?? data ?? defaults;
  const set = (key: keyof Newsletter, next: string) => setDraft({ ...value, [key]: next });
  const save = async () => {
    setBusy(true);
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: "newsletter", value } as never, { onConflict: "key" });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Newsletter settings saved");
    setDraft(null);
    await qc.invalidateQueries({ queryKey: ["site-settings"] });
  };
  const upload = async (file: File) => {
    setBusy(true);
    try {
      set("image_url", await uploadPublicFile("artist-images", "newsletter", file));
      toast.success("Image uploaded. Save to publish it.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };
  const musicSettings = musicDraft ?? savedMusicSettings ?? { autoplay: true };
  const saveMusicSettings = async () => {
    setBusy(true);
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: "music_player", value: musicSettings } as never, { onConflict: "key" });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Music player settings saved");
    setMusicDraft(null);
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["site-settings", "music-player"] }),
      qc.invalidateQueries({ queryKey: ["public-site-content"] }),
    ]);
  };
  return (
    <div className="space-y-6">
      <ManagerHeader
        title="Site Settings"
        description="Manage newsletter content and assets. Paste a Media Library URL to reuse an existing asset without uploading a duplicate."
      />
      <ManagerCard>
        <h2 className="text-lg font-semibold">Music player</h2>
        <p className="text-sm text-neutral-400">
          When enabled, the featured track starts automatically. If a browser blocks sound, playback
          starts muted and visitors can unmute from the player.
        </p>
        <Visibility
          checked={musicSettings.autoplay}
          onCheckedChange={(autoplay) => setMusicDraft({ autoplay })}
          label="Autoplay featured song when the site opens"
        />
        <Button
          disabled={busy}
          className="bg-amber-300 text-black"
          onClick={() => void saveMusicSettings()}
        >
          Save music settings
        </Button>
      </ManagerCard>
      <ManagerCard>
        <h2 className="text-lg font-semibold">Mailing list</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label="Headline"
            value={value.headline}
            onChange={(e) => set("headline", e.target.value)}
          />
          <TextField
            label="Button label"
            value={value.cta_label}
            onChange={(e) => set("cta_label", e.target.value)}
          />
        </div>
        <TextAreaField
          label="Description"
          value={value.body}
          onChange={(e) => set("body", e.target.value)}
        />
        <TextField
          label="Media Library / image URL"
          value={value.image_url}
          onChange={(e) => set("image_url", e.target.value)}
        />
        <label className="text-sm text-neutral-300">
          Upload replacement
          <input
            className="mt-2 block w-full"
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && void upload(e.target.files[0])}
          />
        </label>
        {value.image_url && (
          <div className="space-y-2">
            <img
              src={value.image_url}
              alt="Newsletter preview"
              className="h-48 w-full max-w-md rounded object-cover"
            />
            <Button variant="outline" onClick={() => set("image_url", "")}>
              Remove image
            </Button>
          </div>
        )}
        <Button disabled={busy} className="bg-amber-300 text-black" onClick={() => void save()}>
          Save settings
        </Button>
      </ManagerCard>
    </div>
  );
}
