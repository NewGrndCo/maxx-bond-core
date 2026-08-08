import { useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  ManagerCard,
  TextField,
  Visibility,
  uploadPublicFile,
} from "@/components/admin/manager-ui";
import {
  IMAGE_ACCEPT,
  IMAGE_ERROR,
  isBrowserImage,
  probeDuration,
  titleFromFilename,
} from "@/lib/media-file";

type BulkRow = {
  file: File;
  title: string;
  status: "pending" | "uploading" | "done" | "error";
  message?: string;
};

const STATUS_CLASS: Record<BulkRow["status"], string> = {
  done: "text-emerald-400",
  error: "text-red-400",
  uploading: "text-amber-300",
  pending: "text-neutral-500",
};

export function BulkAlbumUploader({
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

  const patchRow = (index: number, patch: Partial<BulkRow>) =>
    setRows((rs) => rs.map((r, i) => (i === index ? { ...r, ...patch } : r)));

  const pickAudio = (files: FileList | null) => {
    if (!files?.length) return;
    setRows(
      Array.from(files)
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
        .map((file) => ({ file, title: titleFromFilename(file.name), status: "pending" })),
    );
  };

  const pickCover = (file: File | null) => {
    if (!file) return setCoverFile(null);
    if (!isBrowserImage(file)) return toast.error(IMAGE_ERROR);
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
    try {
      const coverUrl = coverFile
        ? await uploadPublicFile("artist-images", "tracks", coverFile)
        : "";
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        patchRow(i, { status: "uploading" });
        try {
          const audioUrl = await uploadPublicFile("audio", "tracks", row.file);
          const { error } = await supabase.from("tracks").insert({
            title: row.title.trim() || titleFromFilename(row.file.name),
            artist,
            audio_url: audioUrl,
            cover_url: coverUrl,
            duration_seconds: await probeDuration(row.file),
            display_order: startOrder + i,
            is_published: publish,
          });
          if (error) throw error;
          patchRow(i, { status: "done" });
        } catch (e) {
          patchRow(i, { status: "error", message: e instanceof Error ? e.message : "Failed" });
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
            accept={IMAGE_ACCEPT}
            onChange={(e) => pickCover(e.target.files?.[0] ?? null)}
          />
          {coverFile && (
            <span className="mt-1 block text-[11px] text-neutral-500">{coverFile.name}</span>
          )}
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
                onChange={(e) => patchRow(i, { title: e.target.value })}
              />
              <span className="hidden text-xs text-neutral-500 md:inline">{row.file.name}</span>
              <span className={STATUS_CLASS[row.status]}>
                {row.status === "done"
                  ? "✓"
                  : row.status === "error"
                    ? (row.message ?? "error")
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
