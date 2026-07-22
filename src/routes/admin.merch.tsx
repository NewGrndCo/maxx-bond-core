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
  TextAreaField,
  TextField,
  Visibility,
  uploadPublicFile,
} from "@/components/admin/manager-ui";
export const Route = createFileRoute("/admin/merch")({ component: MerchPage });
function MerchPage() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["admin-merch"],
    queryFn: async () => {
      const { data, error } = await supabase.from("merch_items").select("*").order("display_order");
      if (error) throw error;
      return data;
    },
  });
  const [draft, setDraft] = useState<{
    id?: string;
    name: string;
    description: string;
    price: string;
    image_url: string;
    external_url: string;
    is_visible: boolean;
  } | null>(null);
  const edit = draft ?? {
    name: "",
    description: "",
    price: "0.00",
    image_url: "",
    external_url: "",
    is_visible: true,
  };
  const set = (k: keyof typeof edit, v: string | boolean) => setDraft({ ...edit, [k]: v });
  const save = async () => {
    const payload = {
      name: edit.name,
      description: edit.description,
      price_cents: Math.round(Number(edit.price) * 100),
      image_url: edit.image_url,
      external_url: edit.external_url,
      display_order: edit.id
        ? (data.find((x) => x.id === edit.id)?.display_order ?? 0)
        : data.length,
      is_visible: edit.is_visible,
    };
    const result = edit.id
      ? await supabase.from("merch_items").update(payload).eq("id", edit.id)
      : await supabase.from("merch_items").insert(payload);
    if (result.error) return toast.error(result.error.message);
    setDraft(null);
    await qc.invalidateQueries({ queryKey: ["admin-merch"] });
  };
  const upload = async (f: File) => {
    try {
      set("image_url", await uploadPublicFile("merch", "products", f));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    }
  };
  const remove = async (id: string) => {
    if (!confirm("Delete product?")) return;
    await supabase.from("merch_items").delete().eq("id", id);
    await qc.invalidateQueries({ queryKey: ["admin-merch"] });
  };
  return (
    <div className="space-y-6">
      <ManagerHeader
        title="Merch"
        description="Display products with optional external purchase links. Payments remain disabled."
        action={
          <Button
            className="bg-amber-300 text-black"
            onClick={() =>
              setDraft({
                name: "",
                description: "",
                price: "0.00",
                image_url: "",
                external_url: "",
                is_visible: true,
              })
            }
          >
            Add product
          </Button>
        }
      />
      {draft && (
        <ManagerCard>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Name"
              value={edit.name}
              onChange={(e) => set("name", e.target.value)}
            />
            <TextField
              label="Price"
              type="number"
              step="0.01"
              value={edit.price}
              onChange={(e) => set("price", e.target.value)}
            />
          </div>
          <TextAreaField
            label="Description"
            value={edit.description}
            onChange={(e) => set("description", e.target.value)}
          />
          <TextField
            label="External product URL"
            value={edit.external_url}
            onChange={(e) => set("external_url", e.target.value)}
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
          />
          {edit.image_url && (
            <img className="h-32 w-32 rounded object-cover" src={edit.image_url} alt="" />
          )}
          <Visibility checked={edit.is_visible} onCheckedChange={(v) => set("is_visible", v)} />
          <div className="flex gap-2">
            <Button className="bg-amber-300 text-black" onClick={save}>
              Save product
            </Button>
            <Button variant="outline" onClick={() => setDraft(null)}>
              Cancel
            </Button>
          </div>
        </ManagerCard>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {data.map((item) => (
          <ManagerCard key={item.id}>
            <div className="flex gap-4">
              {item.image_url && (
                <img src={item.image_url} alt="" className="h-20 w-20 rounded object-cover" />
              )}
              <div className="flex-1">
                <strong>{item.name}</strong>
                <div className="text-sm text-amber-200">${(item.price_cents / 100).toFixed(2)}</div>
              </div>
              <Button
                variant="outline"
                onClick={() =>
                  setDraft({
                    id: item.id,
                    name: item.name,
                    description: item.description ?? "",
                    price: (item.price_cents / 100).toFixed(2),
                    image_url: item.image_url ?? "",
                    external_url: item.external_url ?? "",
                    is_visible: item.is_visible,
                  })
                }
              >
                Edit
              </Button>
              <DeleteButton onClick={() => remove(item.id)} />
            </div>
          </ManagerCard>
        ))}
      </div>
    </div>
  );
}
