import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { signStorageUrl } from "@/lib/storage-url";

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price_cents: number;
  currency: string;
  image_url: string;
  inventory_quantity: number | null;
  track_inventory: boolean;
};
type Variant = {
  id: string;
  name: string;
  price_cents: number | null;
  inventory_quantity: number | null;
  is_available: boolean;
};
export const Route = createFileRoute("/shop/$slug")({ component: ProductPage });
function ProductPage() {
  const { slug } = Route.useParams();
  const cart = useCart();
  const [variantId, setVariantId] = useState<string>();
  const [quantity, setQuantity] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const productResult = await supabase
        .from("merch_items")
        .select("*")
        .eq("slug" as never, slug)
        .eq("is_published" as never, true)
        .maybeSingle();
      if (productResult.error) throw productResult.error;
      if (!productResult.data) return null;
      const variantResult = await supabase
        .from("product_variants" as never)
        .select("*")
        .eq("product_id", productResult.data.id)
        .eq("is_available", true)
        .order("display_order");
      if (variantResult.error) throw variantResult.error;
      const product = productResult.data as unknown as Product;
      return {
        product: { ...product, image_url: await signStorageUrl(product.image_url) },
        variants: variantResult.data as unknown as Variant[],
      };
    },
  });
  if (isLoading) return <main className="detail-page section-shell">Loading product…</main>;
  if (!data)
    return (
      <main className="detail-page section-shell">
        <h1>Product not found</h1>
        <Link to="/">Return home</Link>
      </main>
    );
  const variant = data.variants.find((item) => item.id === variantId);
  const price = variant?.price_cents ?? data.product.price_cents;
  const unavailable = variant
    ? variant.inventory_quantity === 0
    : data.product.track_inventory && data.product.inventory_quantity === 0;
  const add = () => {
    if (data.variants.length && !variant) return toast.error("Choose an option");
    cart.add({
      productId: data.product.id,
      variantId: variant?.id,
      name: data.product.name,
      variantName: variant?.name,
      imageUrl: data.product.image_url,
      unitPriceCents: price,
      quantity,
    });
    toast.success("Added to cart");
  };
  return (
    <main className="detail-page section-shell">
      <div className="shop-utility">
        <Link to="/">← Continue shopping</Link>
        <Link to="/cart">
          <ShoppingBag /> Cart ({cart.count})
        </Link>
      </div>
      <article className="detail-card glass">
        {data.product.image_url && <img src={data.product.image_url} alt={data.product.name} />}
        <div>
          <p className="eyebrow">Official merch</p>
          <h1>{data.product.name}</h1>
          <p className="product-price">
            ${(price / 100).toFixed(2)} {data.product.currency}
          </p>
          <p>{data.product.description}</p>
          {data.variants.length > 0 && (
            <label>
              Option
              <select
                value={variantId ?? ""}
                onChange={(e) => setVariantId(e.target.value || undefined)}
              >
                <option value="">Select an option</option>
                {data.variants.map((item) => (
                  <option key={item.id} value={item.id} disabled={item.inventory_quantity === 0}>
                    {item.name}
                    {item.inventory_quantity === 0 ? " — Sold out" : ""}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label>
            Quantity
            <input
              type="number"
              min="1"
              max="99"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
            />
          </label>
          <button className="listen-button" disabled={unavailable} onClick={add}>
            {unavailable ? "Sold out" : "Add to cart"}
          </button>
        </div>
      </article>
    </main>
  );
}
