import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import { useCart } from "@/lib/cart";
export const Route = createFileRoute("/checkout/success")({ component: SuccessPage });
function SuccessPage() { const cart = useCart(); useEffect(() => cart.clear(), []); return <main className="detail-page section-shell"><div className="detail-card glass checkout-state"><CheckCircle2 /><h1>Payment received</h1><p>Thank you. Stripe has securely processed your order. A receipt will be sent to the email used at checkout.</p><Link className="listen-button" to="/">Return home</Link></div></main>; }
