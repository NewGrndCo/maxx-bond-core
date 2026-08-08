import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Image, Search, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ManagerCard, ManagerHeader, TextField, Visibility } from "@/components/admin/manager-ui";

export const Route = createFileRoute("/admin/media")({ component: MediaLibraryPage });
type Asset = { id: string; bucket: string; object_path: string; public_url: string; label: string; alt_text: string; mime_type: string; size_bytes: number; folder: string; is_published: boolean; created_at: string; updated_at: string };

function MediaLibraryPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [folder, setFolder] = useState("general");
  const [editing, setEditing] = useState<Asset | null>(null);
  const [busy, setBusy] = useState(false);
  const { data = [], isLoading } = useQuery({ queryKey: ["media-assets"], queryFn: async () => {
    const { data, error } = await supabase.from("media_assets" as never).select("*").order("created_at", { ascending: false });
    if (error) throw error; return data as unknown as Asset[];
  }});
  const visible = useMemo(() => data.filter((asset) => `${asset.label} ${asset.folder} ${asset.object_path}`.toLowerCase().includes(search.toLowerCase())), [data, search]);
  const upload = async (file: File) => {
    setBusy(true);
    try {
      const safe = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
      const objectPath = `${folder || "general"}/${crypto.randomUUID()}-${safe}`;
      const { error: uploadError } = await supabase.storage.from("artist-images").upload(objectPath, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;
      const publicUrl = supabase.storage.from("artist-images").getPublicUrl(objectPath).data.publicUrl;
      const { error } = await supabase.from("media_assets" as never).insert({ bucket: "artist-images", object_path: objectPath, public_url: publicUrl, label: file.name.replace(/\.[^.]+$/, ""), mime_type: file.type, size_bytes: file.size, folder: folder || "general", is_published: true } as never);
      if (error) throw error;
      toast.success("Asset uploaded"); await qc.invalidateQueries({ queryKey: ["media-assets"] });
    } catch (error) { toast.error(error instanceof Error ? error.message : "Upload failed"); } finally { setBusy(false); }
  };
  const save = async () => { if (!editing) return; const { error } = await supabase.from("media_assets" as never).update({ label: editing.label, alt_text: editing.alt_text, folder: editing.folder, is_published: editing.is_published } as never).eq("id", editing.id); if (error) return toast.error(error.message); toast.success("Asset updated"); setEditing(null); await qc.invalidateQueries({ queryKey: ["media-assets"] }); };
  const remove = async (asset: Asset) => {
    const checks = await Promise.all([supabase.from("artist_profile").select("id").or(`portrait_url.eq.${asset.public_url},hero_artwork_url.eq.${asset.public_url},album_cover_url.eq.${asset.public_url}`), supabase.from("tracks").select("id").or(`cover_url.eq.${asset.public_url},audio_url.eq.${asset.public_url}`), supabase.from("events").select("id").eq("image_url" as never, asset.public_url), supabase.from("merch_items").select("id").eq("image_url", asset.public_url)]);
    const usage = checks.reduce((count, result) => count + (result.data?.length ?? 0), 0);
    if (usage > 0 && !confirm(`This asset is used in ${usage} content record(s). Delete it anyway? Broken images may result.`)) return;
    if (usage === 0 && !confirm("Permanently delete this asset?")) return;
    const { error: storageError } = await supabase.storage.from(asset.bucket).remove([asset.object_path]);
    if (storageError) return toast.error(storageError.message);
    const { error } = await supabase.from("media_assets" as never).delete().eq("id", asset.id);
    if (error) return toast.error(error.message);
    toast.success("Asset deleted"); await qc.invalidateQueries({ queryKey: ["media-assets"] });
  };
  return <div className="space-y-6"><ManagerHeader title="Media Library" description="Upload once, organize assets, preview them, and reuse their managed URLs throughout the CMS." />
    <ManagerCard><div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]"><label className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-neutral-500" /><Input className="pl-9" placeholder="Search assets" value={search} onChange={(e) => setSearch(e.target.value)} /></label><Input placeholder="Upload folder" value={folder} onChange={(e) => setFolder(e.target.value)} /><label><Button asChild disabled={busy}><span><Upload /> Upload media</span></Button><input hidden type="file" accept="image/*,video/*,audio/*" onChange={(e) => e.target.files?.[0] && void upload(e.target.files[0])} /></label></div></ManagerCard>
    {editing && <ManagerCard><div className="grid gap-4 md:grid-cols-2"><TextField label="Label" value={editing.label} onChange={(e) => setEditing({ ...editing, label: e.target.value })} /><TextField label="Folder" value={editing.folder} onChange={(e) => setEditing({ ...editing, folder: e.target.value })} /><TextField label="Alt text" value={editing.alt_text} onChange={(e) => setEditing({ ...editing, alt_text: e.target.value })} /></div><Visibility checked={editing.is_published} onCheckedChange={(value) => setEditing({ ...editing, is_published: value })} label="Published" /><div className="flex gap-2"><Button onClick={() => void save()}>Save</Button><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button></div></ManagerCard>}
    {isLoading ? <p>Loading media…</p> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{visible.map((asset) => <ManagerCard key={asset.id}><div className="aspect-square overflow-hidden rounded bg-white/5">{asset.mime_type.startsWith("image/") ? <img src={asset.public_url} alt={asset.alt_text || asset.label} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center"><Image /></div>}</div><div><strong>{asset.label || asset.object_path}</strong><p className="text-xs text-neutral-500">{asset.folder} · {(asset.size_bytes / 1024 / 1024).toFixed(1)} MB</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => setEditing(asset)}>Edit</Button><Button size="sm" variant="destructive" onClick={() => void remove(asset)}>Delete</Button></div></ManagerCard>)}</div>}
  </div>;
}
