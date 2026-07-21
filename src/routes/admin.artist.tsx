import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload } from "lucide-react";

export const Route = createFileRoute("/admin/artist")({
  component: ArtistProfilePage,
});

type ArtistProfile = {
  id: string;
  artist_name: string;
  biography: string | null;
  management_email: string | null;
  management_phone: string | null;
  hero_headline: string | null;
  hero_subheading: string | null;
  portrait_url: string | null;
  hero_artwork_url: string | null;
  album_cover_url: string | null;
};

type ImageField = "portrait_url" | "hero_artwork_url" | "album_cover_url";

function ArtistProfilePage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["artist-profile"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artist_profile")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as ArtistProfile | null;
    },
  });

  const [form, setForm] = useState<ArtistProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<ImageField | null>(null);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  if (isLoading || !form) {
    return <div className="text-neutral-400">Loading artist profile…</div>;
  }

  const set = <K extends keyof ArtistProfile>(k: K, v: ArtistProfile[K]) =>
    setForm((f) => (f ? { ...f, [k]: v } : f));

  const save = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("artist_profile")
        .update({
          artist_name: form.artist_name,
          biography: form.biography ?? "",
          management_email: form.management_email ?? "",
          management_phone: form.management_phone ?? "",
          hero_headline: form.hero_headline ?? "",
          hero_subheading: form.hero_subheading ?? "",
          portrait_url: form.portrait_url ?? "",
          hero_artwork_url: form.hero_artwork_url ?? "",
          album_cover_url: form.album_cover_url ?? "",
        })
        .eq("id", form.id);
      if (error) throw error;
      toast.success("Artist profile saved");
      qc.invalidateQueries({ queryKey: ["artist-profile"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const uploadImage = async (field: ImageField, file: File) => {
    setUploading(field);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${field}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("artist-images")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("artist-images").getPublicUrl(path);
      set(field, pub.publicUrl);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Artist Profile</h1>
          <p className="text-neutral-400 mt-1 text-sm">
            Core artist information shown across the public site.
          </p>
        </div>
        <Button
          onClick={save}
          disabled={saving}
          className="bg-amber-300 text-black hover:bg-amber-200 font-semibold"
        >
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>

      <Card className="bg-white/[0.03] border-white/10 text-neutral-100">
        <CardHeader>
          <CardTitle>Identity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Artist name">
            <Input
              value={form.artist_name ?? ""}
              onChange={(e) => set("artist_name", e.target.value)}
              className="bg-black/40 border-white/10"
            />
          </Field>
          <Field label="Biography">
            <Textarea
              rows={6}
              value={form.biography ?? ""}
              onChange={(e) => set("biography", e.target.value)}
              className="bg-black/40 border-white/10"
            />
          </Field>
        </CardContent>
      </Card>

      <Card className="bg-white/[0.03] border-white/10 text-neutral-100">
        <CardHeader>
          <CardTitle>Management contact</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Management email">
            <Input
              type="email"
              value={form.management_email ?? ""}
              onChange={(e) => set("management_email", e.target.value)}
              className="bg-black/40 border-white/10"
            />
          </Field>
          <Field label="Management phone">
            <Input
              value={form.management_phone ?? ""}
              onChange={(e) => set("management_phone", e.target.value)}
              className="bg-black/40 border-white/10"
            />
          </Field>
        </CardContent>
      </Card>

      <Card className="bg-white/[0.03] border-white/10 text-neutral-100">
        <CardHeader>
          <CardTitle>Hero copy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Hero headline">
            <Input
              value={form.hero_headline ?? ""}
              onChange={(e) => set("hero_headline", e.target.value)}
              className="bg-black/40 border-white/10"
            />
          </Field>
          <Field label="Hero subheading">
            <Input
              value={form.hero_subheading ?? ""}
              onChange={(e) => set("hero_subheading", e.target.value)}
              className="bg-black/40 border-white/10"
            />
          </Field>
        </CardContent>
      </Card>

      <Card className="bg-white/[0.03] border-white/10 text-neutral-100">
        <CardHeader>
          <CardTitle>Images</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-3">
          <ImagePicker
            label="Portrait"
            value={form.portrait_url ?? ""}
            uploading={uploading === "portrait_url"}
            onFile={(f) => uploadImage("portrait_url", f)}
            onClear={() => set("portrait_url", "")}
          />
          <ImagePicker
            label="Hero artwork"
            value={form.hero_artwork_url ?? ""}
            uploading={uploading === "hero_artwork_url"}
            onFile={(f) => uploadImage("hero_artwork_url", f)}
            onClear={() => set("hero_artwork_url", "")}
          />
          <ImagePicker
            label="Album cover"
            value={form.album_cover_url ?? ""}
            uploading={uploading === "album_cover_url"}
            onFile={(f) => uploadImage("album_cover_url", f)}
            onClear={() => set("album_cover_url", "")}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-neutral-300">{label}</Label>
      {children}
    </div>
  );
}

function ImagePicker({
  label,
  value,
  uploading,
  onFile,
  onClear,
}: {
  label: string;
  value: string;
  uploading: boolean;
  onFile: (f: File) => void;
  onClear: () => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-neutral-300">{label}</Label>
      <div className="aspect-square rounded-md border border-white/10 bg-black/40 overflow-hidden flex items-center justify-center">
        {value ? (
          <img src={value} alt={label} className="w-full h-full object-cover" />
        ) : (
          <div className="text-neutral-600 text-xs">No image</div>
        )}
      </div>
      <div className="flex gap-2">
        <label className="flex-1">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
              e.target.value = "";
            }}
          />
          <span className="inline-flex items-center justify-center gap-2 w-full h-9 rounded-md border border-white/10 text-xs hover:bg-white/5 cursor-pointer">
            <Upload className="h-3.5 w-3.5" />
            {uploading ? "Uploading…" : "Upload"}
          </span>
        </label>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-neutral-400 hover:text-neutral-100"
          >
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
