import Stripe from "npm:stripe@22.0.0";
import { createClient } from "npm:@supabase/supabase-js@2.112.2";
import { corsHeaders } from "../_shared/cors.ts";

type RequestedLine = { productId: string; variantId?: string; quantity: number };
Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("Stripe is not configured");
    const { lines, origin } = (await request.json()) as { lines: RequestedLine[]; origin: string };
    if (!Array.isArray(lines) || lines.length === 0 || lines.length > 50)
      return Response.json({ error: "Invalid cart" }, { status: 400, headers: corsHeaders });
    const allowedOrigin = new URL(Deno.env.get("SITE_URL") || origin).origin;
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const productIds = [...new Set(lines.map((line) => line.productId))];
    const variantIds = [
      ...new Set(lines.flatMap((line) => (line.variantId ? [line.variantId] : []))),
    ];
    const [{ data: products, error: productError }, { data: variants, error: variantError }] =
      await Promise.all([
        admin
          .from("merch_items")
          .select(
            "id,name,price_cents,currency,sku,track_inventory,inventory_quantity,is_published,is_visible",
          )
          .in("id", productIds),
        variantIds.length
          ? admin
              .from("product_variants")
              .select("id,product_id,name,price_cents,sku,inventory_quantity,is_available")
              .in("id", variantIds)
          : Promise.resolve({ data: [], error: null }),
      ]);
    if (productError || variantError) throw productError || variantError;
    const snapshots = lines.map((line) => {
      const quantity = Math.max(1, Math.min(99, Math.floor(line.quantity)));
      const product = products?.find((item) => item.id === line.productId);
      const variant = line.variantId
        ? variants?.find((item) => item.id === line.variantId && item.product_id === line.productId)
        : undefined;
      if (!product?.is_published || !product.is_visible)
        throw new Error("A product is no longer available");
      if (line.variantId && (!variant || !variant.is_available))
        throw new Error("A selected option is no longer available");
      const stock = variant ? variant.inventory_quantity : product.inventory_quantity;
      if ((variant || product.track_inventory) && stock !== null && stock < quantity)
        throw new Error(`Insufficient inventory for ${product.name}`);
      return { product, variant, quantity, unitPrice: variant?.price_cents ?? product.price_cents };
    });
    const currency = snapshots[0].product.currency.toLowerCase();
    if (snapshots.some((item) => item.product.currency.toLowerCase() !== currency))
      throw new Error("Mixed currencies are not supported");
    const subtotal = snapshots.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert({ currency: currency.toUpperCase(), subtotal_cents: subtotal, total_cents: subtotal })
      .select("id")
      .single();
    if (orderError) throw orderError;
    await admin
      .from("order_items")
      .insert(
        snapshots.map((item) => ({
          order_id: order.id,
          product_id: item.product.id,
          variant_id: item.variant?.id ?? null,
          product_name: item.product.name,
          variant_name: item.variant?.name ?? "",
          sku: item.variant?.sku || item.product.sku,
          quantity: item.quantity,
          unit_price_cents: item.unitPrice,
        })),
      );
    const stripe = new Stripe(stripeKey);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${allowedOrigin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${allowedOrigin}/checkout/cancelled`,
      client_reference_id: order.id,
      metadata: { order_id: order.id },
      billing_address_collection: "auto",
      shipping_address_collection: { allowed_countries: ["US", "CA"] },
      automatic_tax: { enabled: true },
      line_items: snapshots.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency,
          unit_amount: item.unitPrice,
          product_data: {
            name: item.product.name,
            description: item.variant?.name || undefined,
            metadata: { product_id: item.product.id, variant_id: item.variant?.id ?? "" },
          },
        },
      })),
    });
    await admin
      .from("orders")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", order.id);
    return Response.json(
      { url: session.url },
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Checkout failed" },
      { status: 400, headers: corsHeaders },
    );
  }
});
