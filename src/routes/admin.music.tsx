import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { BulkAlbumUploader } from "@/components/admin/bulk-album-uploader";
import { SignedAudio, SignedImage } from "@/components/admin/signed-media";
import {
  DeleteButton,
  ManagerCard,
  ManagerHeader,
  TextField,
  Visibility,
  uploadPublicFile,
} from "@/components/admin/manager-ui";
import {
  IMAGE_ACCEPT,
  IMAGE_ERROR,
  IMAGE_HINT,
  isBrowserImage,
  probeDuration,
  titleFromFilename,
} from "@/lib/media-file";

export const Route = createFileRoute("/admin/music")({ component: MusicPage });

type Track = Tables<"tracks">;

const blank = (): Track => ({
  id: crypto.randomUUID(),
  title: "",
  artist: "Maxx Bond",
  audio_url: "",
  cover_url: "",
  duration_seconds: 0,
  display_order: 0,
  is_published: false,
  created_at: "",
  updated_at: "",
});

function MusicPage() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-tracks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tracks").select("*").order("display_order");
      if (error) throw error;
      return data;
    },
  });
  const [draft, setDraft] = useState<Track | null>(null);
  const [busy, setBusy] = useState(false);
  const draggedId = useRef<string | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-tracks"] });
  const edit = draft ?? blank();
  const set = <K extends keyof Track>(key: K, value: Track[K]) =>
    setDraft({ ...edit, [key]: value });

  const save = async (track: Track) => {
    setBusy(true);
    try {
      const payload = {
        title: track.title,
        artist: track.artist,
        audio_url: track.audio_url,
        cover_url: track.cover_url,
        duration_seconds: track.duration_seconds,
        display_order: track.display_order,
        is_published: track.is_published,
      };
      const exists = data.some((x) => x.id === track.id);
      const result = exists
        ? await supabase.from("tracks").update(payload).eq("id", track.id)
        : await supabase.from("tracks").insert(payload);
      if (result.error) throw result.error;
      toast.success("Track saved");
      setDraft(null);
      await invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this track?")) return;
    const { error } = await supabase.from("tracks").delete().eq("id", id);
    if (error) return toast.error(error.message);
    await invalidate();
  };

  const reorder = async (targetId: string) => {
    const sourceId = draggedId.current;
    draggedId.current = null;
    if (!sourceId || sourceId === targetId) return;
    const next = [...data];
    const sourceIndex = next.findIndex((track) => track.id === sourceId);
    const targetIndex = next.findIndex((track) => track.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;
    const [moved] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, moved);
    setBusy(true);
    const results = await Promise.all(
      next.map((track, display_order) =>
        supabase.from("tracks").update({ display_order }).eq("id", track.id),
      ),
    );
    setBusy(false);
    const failed = results.find((result) => result.error);
    if (failed?.error) return toast.error(failed.error.message);
    toast.success("Track order saved");
    await invalidate();
  };

  const upload = async (kind: "audio" | "cover", file: File) => {
    if (kind === "cover" && !isBrowserImage(file)) return toast.error(IMAGE_ERROR);
    setBusy(true);
    try {
      const url = await uploadPublicFile(
        kind === "audio" ? "audio" : "artist-images",
        "tracks",
        file,
      );
      const next: Track = { ...edit, [kind === "audio" ? "audio_url" : "cover_url"]: url };
      if (kind === "audio") {
        if (!next.title.trim()) next.title = titleFromFilename(file.name);
        if (!next.duration_seconds) next.duration_seconds = await probeDuration(file);
      }
      setDraft(next);
      toast.success(`${kind === "audio" ? "Audio" : "Cover"} uploaded`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <ManagerHeader
        title="Music"
        description="Upload, preview, publish and order the tracks used by the public player."
        action={
          <Button className="bg-amber-300 text-black" onClick={() => setDraft(blank())}>
            Add track
          </Button>
        }
      />

      <BulkAlbumUploader existingCount={data.length} onDone={invalidate} />

      {draft && (
        <ManagerCard>
          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              label="Track title"
              value={edit.title}
              onChange={(e) => set("title", e.target.value)}
            />
            <TextField
              label="Artist"
              value={edit.artist ?? ""}
              onChange={(e) => set("artist", e.target.value)}
            />
            <TextField
              label="Display order"
              type="number"
              value={edit.display_order}
              onChange={(e) => set("display_order", Number(e.target.value))}
            />
            <TextField
              label="Duration (seconds)"
              type="number"
              value={edit.duration_seconds ?? 0}
              onChange={(e) => set("duration_seconds", Number(e.target.value))}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm text-neutral-300">
              Audio file
              <input
                className="mt-2 block w-full text-xs"
                type="file"
                accept="audio/*,.mp3,.wav,.m4a"
                onChange={(e) => e.target.files?.[0] && upload("audio", e.target.files[0])}
              />
              <span className="mt-1 block text-[11px] text-neutral-500">
                Title auto-fills from filename if left blank.
              </span>
            </label>
            <label className="text-sm text-neutral-300">
              Cover image
              <input
                className="mt-2 block w-full text-xs"
                type="file"
                accept={IMAGE_ACCEPT}
                onChange={(e) => e.target.files?.[0] && upload("cover", e.target.files[0])}
              />
              <span className="mt-1 block text-[11px] text-neutral-500">{IMAGE_HINT}</span>
            </label>
          </div>
          {edit.audio_url && <SignedAudio url={edit.audio_url} className="w-full" />}
          {edit.cover_url && (
            <SignedImage
              url={edit.cover_url}
              className="h-32 w-32 rounded object-cover"
              alt="Cover preview"
            />
          )}
          <Visibility
            checked={edit.is_published}
            onCheckedChange={(v) => set("is_published", v)}
            label="Published"
          />
          <div className="flex gap-2">
            <Button
              disabled={busy || !edit.title.trim() || !edit.audio_url}
              className="bg-amber-300 text-black"
              onClick={() => save(edit)}
            >
              Save track
            </Button>
            <Button variant="outline" onClick={() => setDraft(null)}>
              Cancel
            </Button>
          </div>
        </ManagerCard>
      )}

      {isLoading ? (
        <p className="text-neutral-400">Loading…</p>
      ) : (
        <div className="space-y-3">
          {data.map((track) => (
            <div
              key={track.id}
              draggable={!busy}
              onDragStart={() => {
                draggedId.current = track.id;
              }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => void reorder(track.id)}
              className="cursor-grab active:cursor-grabbing"
            >
              <ManagerCard>
                <div className="flex flex-wrap items-center gap-4">
                  <span aria-hidden="true" className="select-none text-xl text-neutral-500">
                    ⠿
                  </span>
                  {track.cover_url ? (
                    <SignedImage
                      url={track.cover_url}
                      alt=""
                      className="h-16 w-16 rounded object-cover"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded bg-white/5" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{track.title}</div>
                    <div className="text-xs text-neutral-400">
                      {track.artist} · Order {track.display_order} ·{" "}
                      {track.is_published ? "Published" : "Draft"}
                    </div>
                  </div>
                  {track.audio_url && (
                    <SignedAudio url={track.audio_url} className="h-10 max-w-xs" preload="none" />
                  )}
                  <Button variant="outline" onClick={() => setDraft(track)}>
                    Edit
                  </Button>
                  <DeleteButton onClick={() => remove(track.id)} />
                </div>
              </ManagerCard>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
