import Stripe from "npm:stripe@22.0.0";
import { createClient } from "npm:@supabase/supabase-js@2.112.2";

Deno.serve(async (request) => {
  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);
  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });
  let event: Stripe.Event;
  try { event = await stripe.webhooks.constructEventAsync(await request.text(), signature, Deno.env.get("STRIPE_WEBHOOK_SECRET")!, undefined, Stripe.createSubtleCryptoProvider()); }
  catch (error) { console.error(error); return new Response("Invalid signature", { status: 400 }); }
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.order_id || session.client_reference_id;
    if (orderId) await admin.from("orders").update({ status: "paid", stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : null, email: session.customer_details?.email ?? "", total_cents: session.amount_total ?? 0, customer_details: session.customer_details ?? {} }).eq("id", orderId).neq("status", "paid");
  }
  if (event.type === "checkout.session.expired" || event.type === "checkout.session.async_payment_failed") {
    const session = event.data.object as Stripe.Checkout.Session; const orderId = session.metadata?.order_id || session.client_reference_id;
    if (orderId) await admin.from("orders").update({ status: event.type === "checkout.session.expired" ? "cancelled" : "failed" }).eq("id", orderId);
  }
  return Response.json({ received: true });
});
