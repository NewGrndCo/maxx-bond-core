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
    slug: string;
    sku: string;
    inventory_quantity: string;
    display_order: string;
    track_inventory: boolean;
    is_published: boolean;
    is_visible: boolean;
  } | null>(null);
  const edit = draft ?? {
    name: "",
    description: "",
    price: "0.00",
    image_url: "",
    external_url: "",
    slug: "",
    sku: "",
    inventory_quantity: "",
    display_order: String(data.length),
    track_inventory: false,
    is_published: false,
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
      slug: (edit.slug || edit.name)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, ""),
      sku: edit.sku,
      inventory_quantity: edit.inventory_quantity === "" ? null : Number(edit.inventory_quantity),
      track_inventory: edit.track_inventory,
      is_published: edit.is_published,
      display_order: Number(edit.display_order),
      is_visible: edit.is_visible,
    };
    const result = edit.id
      ? await supabase
          .from("merch_items")
          .update(payload as never)
          .eq("id", edit.id)
      : await supabase.from("merch_items").insert(payload as never);
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
                slug: "",
                sku: "",
                inventory_quantity: "",
                display_order: String(data.length),
                track_inventory: false,
                is_published: false,
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
          <div className="grid gap-4 sm:grid-cols-4">
            <TextField
              label="URL slug"
              value={edit.slug}
              onChange={(e) => set("slug", e.target.value)}
            />
            <TextField label="SKU" value={edit.sku} onChange={(e) => set("sku", e.target.value)} />
            <TextField
              label="Inventory"
              type="number"
              value={edit.inventory_quantity}
              onChange={(e) => set("inventory_quantity", e.target.value)}
            />
            <TextField
              label="Display order"
              type="number"
              value={edit.display_order}
              onChange={(e) => set("display_order", e.target.value)}
            />
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
          />
          {edit.image_url && (
            <img className="h-32 w-32 rounded object-cover" src={edit.image_url} alt="" />
          )}
          <Visibility checked={edit.is_visible} onCheckedChange={(v) => set("is_visible", v)} />
          <Visibility
            checked={edit.is_published}
            onCheckedChange={(v) => set("is_published", v)}
            label="Published"
          />
          <Visibility
            checked={edit.track_inventory}
            onCheckedChange={(v) => set("track_inventory", v)}
            label="Track inventory"
          />
          <div className="flex gap-2">
            <Button className="bg-amber-300 text-black" onClick={save}>
              Save product
            </Button>
            <Button variant="outline" onClick={() => setDraft(null)}>
              Cancel
            </Button>
          </div>
          {edit.id && <VariantsEditor productId={edit.id} />}
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
                    slug: (item as unknown as { slug?: string }).slug ?? "",
                    sku: (item as unknown as { sku?: string }).sku ?? "",
                    inventory_quantity: String(
                      (item as unknown as { inventory_quantity?: number | null })
                        .inventory_quantity ?? "",
                    ),
                    display_order: String(item.display_order),
                    track_inventory:
                      (item as unknown as { track_inventory?: boolean }).track_inventory ?? false,
                    is_published:
                      (item as unknown as { is_published?: boolean }).is_published ?? true,
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

function VariantsEditor({ productId }: { productId: string }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [inventory, setInventory] = useState("");
  const { data = [] } = useQuery({
    queryKey: ["product-variants", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_variants" as never)
        .select("*")
        .eq("product_id", productId)
        .order("display_order");
      if (error) throw error;
      return data as unknown as Array<{
        id: string;
        name: string;
        price_cents: number | null;
        inventory_quantity: number | null;
        is_available: boolean;
      }>;
    },
  });
  const add = async () => {
    if (!name.trim()) return;
    const { error } = await supabase.from("product_variants" as never).insert({
      product_id: productId,
      name: name.trim(),
      price_cents: price ? Math.round(Number(price) * 100) : null,
      inventory_quantity: inventory ? Number(inventory) : null,
      display_order: data.length,
      is_available: true,
    } as never);
    if (error) return toast.error(error.message);
    setName("");
    setPrice("");
    setInventory("");
    await qc.invalidateQueries({ queryKey: ["product-variants", productId] });
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this product option?")) return;
    const { error } = await supabase
      .from("product_variants" as never)
      .delete()
      .eq("id", id);
    if (error) return toast.error(error.message);
    await qc.invalidateQueries({ queryKey: ["product-variants", productId] });
  };
  return (
    <section className="space-y-3 border-t border-white/10 pt-5">
      <h3 className="font-medium">Sizes / colors / variants</h3>
      <div className="grid gap-3 md:grid-cols-4">
        <TextField
          label="Option name"
          value={name}
          placeholder="Large / Black"
          onChange={(e) => setName(e.target.value)}
        />
        <TextField
          label="Override price"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <TextField
          label="Inventory"
          type="number"
          value={inventory}
          onChange={(e) => setInventory(e.target.value)}
        />
        <Button className="self-end" onClick={() => void add()}>
          Add option
        </Button>
      </div>
      {data.map((variant) => (
        <div
          key={variant.id}
          className="flex items-center gap-3 rounded border border-white/10 p-3"
        >
          <strong className="flex-1">{variant.name}</strong>
          <span className="text-xs text-neutral-400">
            {variant.price_cents === null
              ? "Base price"
              : `$${(variant.price_cents / 100).toFixed(2)}`}{" "}
            · Stock {variant.inventory_quantity ?? "unlimited"}
          </span>
          <DeleteButton onClick={() => void remove(variant.id)} />
        </div>
      ))}
    </section>
  );
}
