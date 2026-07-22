import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  DeleteButton,
  ManagerCard,
  ManagerHeader,
  TextField,
  Visibility,
  uploadPublicFile,
} from "@/components/admin/manager-ui";
export const Route = createFileRoute("/admin/gallery")({ component: GalleryPage });
function GalleryPage() {
  const qc = useQueryClient();
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const { data = [] } = useQuery({
    queryKey: ["admin-gallery"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_items")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });
  const add = async () => {
    if (!file) return toast.error("Choose an image");
    try {
      const image_url = await uploadPublicFile("gallery", "photos", file);
      const { error } = await supabase.from("gallery_items").insert({
        image_url,
        caption,
        alt_text: caption || "Maxx Bond gallery image",
        display_order: data.length,
        is_visible: true,
      });
      if (error) throw error;
      setCaption("");
      setFile(null);
      toast.success("Gallery image added");
      await qc.invalidateQueries({ queryKey: ["admin-gallery"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    }
  };
  const patch = async (id: string, value: boolean) => {
    await supabase.from("gallery_items").update({ is_visible: value }).eq("id", id);
    await qc.invalidateQueries({ queryKey: ["admin-gallery"] });
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this image?")) return;
    await supabase.from("gallery_items").delete().eq("id", id);
    await qc.invalidateQueries({ queryKey: ["admin-gallery"] });
  };
  return (
    <div className="space-y-6">
      <ManagerHeader
        title="Gallery"
        description="Upload real artist photography for the public gallery."
      />
      <ManagerCard>
        <TextField
          label="Caption / alt text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <Button className="bg-amber-300 text-black" onClick={add}>
          Upload image
        </Button>
      </ManagerCard>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((item) => (
          <ManagerCard key={item.id}>
            <img
              className="aspect-video w-full rounded object-cover"
              src={item.image_url}
              alt={item.alt_text ?? ""}
            />
            <div className="text-sm">{item.caption}</div>
            <div className="flex items-center justify-between">
              <Visibility checked={item.is_visible} onCheckedChange={(v) => patch(item.id, v)} />
              <DeleteButton onClick={() => remove(item.id)} />
            </div>
          </ManagerCard>
        ))}
      </div>
    </div>
  );
}
