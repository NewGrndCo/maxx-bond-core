import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useSignedUrl } from "@/hooks/use-signed-url";
import {
  DeleteButton,
  ManagerCard,
  ManagerHeader,
  TextField,
  Visibility,
  uploadPublicFile,
} from "@/components/admin/manager-ui";


export const Route = createFileRoute("/admin/music")({ component: MusicPage });
type Track = Tables<"tracks">;

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const isBrowserImage = (file: File) => {
  const name = file.name.toLowerCase();
  if (name.endsWith(".heic") || name.endsWith(".heif")) return false;
  if (file.type && !IMAGE_TYPES.includes(file.type)) {
    // allow when browser reported no type but extension is a common web image
    return /\.(jpe?g|png|webp|gif|avif)$/i.test(name);
  }
  return true;
};

// "01 - The Arrival.mp3" -> "The Arrival"; "1. THE ARRIVAL.mp3" -> "The Arrival"
function titleFromFilename(filename: string): string {
  let name = filename.replace(/\.[^.]+$/, "");
  name = name.replace(/^\s*\d+\s*[.\-_)]\s*/, "");
  name = name.replace(/[_\-]+/g, " ").replace(/\s+/g, " ").trim();
  if (name === name.toUpperCase()) {
    name = name
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return name;
}

async function probeDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const a = new Audio();
    a.preload = "metadata";
    a.onloadedmetadata = () => {
      const d = Number.isFinite(a.duration) ? a.duration : 0;
      URL.revokeObjectURL(url);
      resolve(Math.round(d));
    };
    a.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };
    a.src = url;
  });
}

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
      await qc.invalidateQueries({ queryKey: ["admin-tracks"] });
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
    await qc.invalidateQueries({ queryKey: ["admin-tracks"] });
  };
  const edit = draft ?? blank();
  const set = <K extends keyof Track>(key: K, value: Track[K]) =>
    setDraft({ ...edit, [key]: value });

  const upload = async (kind: "audio" | "cover", file: File) => {
    if (kind === "cover" && !isBrowserImage(file)) {
      toast.error("Cover must be JPG, PNG, WebP, GIF, or AVIF. HEIC is not supported by browsers.");
      return;
    }
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

      <BulkAlbumUploader
        existingCount={data.length}
        onDone={() => qc.invalidateQueries({ queryKey: ["admin-tracks"] })}
      />

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
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                onChange={(e) => e.target.files?.[0] && upload("cover", e.target.files[0])}
              />
              <span className="mt-1 block text-[11px] text-neutral-500">
                JPG / PNG / WebP / GIF / AVIF. HEIC not supported.
              </span>
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
            <ManagerCard key={track.id}>
              <div className="flex flex-wrap items-center gap-4">
                {track.cover_url ? (
                  <SignedImage url={track.cover_url} alt="" className="h-16 w-16 rounded object-cover" />
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
          ))}
        </div>
      )}
    </div>
  );
}

type BulkRow = {
  file: File;
  title: string;
  status: "pending" | "uploading" | "done" | "error";
  message?: string;
};

function BulkAlbumUploader({
  existingCount,
  onDone,
}: {
  existingCount: number;
  onDone: () => void;
}) {
  const [rows, setRows] = useState<BulkRow[]>([]);
  const [artist, setArtist] = useState("Maxx Bond");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [publish, setPublish] = useState(true);
  const [startOrder, setStartOrder] = useState(existingCount + 1);
  const [busy, setBusy] = useState(false);
  const audioInput = useRef<HTMLInputElement | null>(null);
  const coverInput = useRef<HTMLInputElement | null>(null);

  const pickAudio = (files: FileList | null) => {
    if (!files?.length) return;
    const next: BulkRow[] = Array.from(files)
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
      .map((file) => ({ file, title: titleFromFilename(file.name), status: "pending" }));
    setRows(next);
  };

  const pickCover = (file: File | null) => {
    if (!file) return setCoverFile(null);
    if (!isBrowserImage(file)) {
      toast.error("Cover must be JPG, PNG, WebP, GIF, or AVIF. HEIC is not supported.");
      return;
    }
    setCoverFile(file);
  };

  const reset = () => {
    setRows([]);
    setCoverFile(null);
    if (audioInput.current) audioInput.current.value = "";
    if (coverInput.current) coverInput.current.value = "";
  };

  const uploadAll = async () => {
    if (!rows.length) return toast.error("Choose audio files first");
    setBusy(true);
    let coverUrl = "";
    try {
      if (coverFile) {
        coverUrl = await uploadPublicFile("artist-images", "tracks", coverFile);
      }
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, status: "uploading" } : r)));
        try {
          const audioUrl = await uploadPublicFile("audio", "tracks", row.file);
          const duration = await probeDuration(row.file);
          const { error } = await supabase.from("tracks").insert({
            title: row.title.trim() || titleFromFilename(row.file.name),
            artist,
            audio_url: audioUrl,
            cover_url: coverUrl,
            duration_seconds: duration,
            display_order: startOrder + i,
            is_published: publish,
          });
          if (error) throw error;
          setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, status: "done" } : r)));
        } catch (e) {
          const message = e instanceof Error ? e.message : "Failed";
          setRows((rs) =>
            rs.map((r, idx) => (idx === i ? { ...r, status: "error", message } : r)),
          );
        }
      }
      toast.success("Album upload complete");
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Cover upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ManagerCard>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Bulk album uploader</h2>
          <p className="text-xs text-neutral-400">
            Drop the whole album at once. Titles come from the filenames; one shared cover applies
            to all tracks.
          </p>
        </div>
        {rows.length > 0 && (
          <Button variant="outline" onClick={reset} disabled={busy}>
            Clear
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm text-neutral-300">
          Audio files (multi-select)
          <input
            ref={audioInput}
            className="mt-2 block w-full text-xs"
            type="file"
            multiple
            accept="audio/*,.mp3,.wav,.m4a,.flac,.aac,.ogg"
            onChange={(e) => pickAudio(e.target.files)}
          />
        </label>
        <label className="text-sm text-neutral-300">
          Shared album cover
          <input
            ref={coverInput}
            className="mt-2 block w-full text-xs"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            onChange={(e) => pickCover(e.target.files?.[0] ?? null)}
          />
          {coverFile && <span className="mt-1 block text-[11px] text-neutral-500">{coverFile.name}</span>}
        </label>
        <TextField label="Artist" value={artist} onChange={(e) => setArtist(e.target.value)} />
        <TextField
          label="Starting display order"
          type="number"
          value={startOrder}
          onChange={(e) => setStartOrder(Number(e.target.value))}
        />
      </div>

      {rows.length > 0 && (
        <div className="space-y-2">
          {rows.map((row, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded border border-white/10 bg-black/30 px-3 py-2 text-sm"
            >
              <span className="w-6 text-neutral-500">{i + 1}</span>
              <input
                className="flex-1 rounded bg-transparent px-2 py-1 text-neutral-100 outline-none focus:bg-black/40"
                value={row.title}
                onChange={(e) =>
                  setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, title: e.target.value } : r)))
                }
              />
              <span className="hidden text-xs text-neutral-500 md:inline">{row.file.name}</span>
              <span
                className={
                  row.status === "done"
                    ? "text-emerald-400"
                    : row.status === "error"
                      ? "text-red-400"
                      : row.status === "uploading"
                        ? "text-amber-300"
                        : "text-neutral-500"
                }
              >
                {row.status === "done"
                  ? "✓"
                  : row.status === "error"
                    ? row.message ?? "error"
                    : row.status === "uploading"
                      ? "…"
                      : "pending"}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4">
        <Visibility checked={publish} onCheckedChange={setPublish} label="Publish immediately" />
        <Button
          disabled={busy || !rows.length}
          className="bg-amber-300 text-black"
          onClick={uploadAll}
        >
          {busy ? "Uploading…" : `Upload ${rows.length || ""} track${rows.length === 1 ? "" : "s"}`}
        </Button>
      </div>
    </ManagerCard>
  );
}
