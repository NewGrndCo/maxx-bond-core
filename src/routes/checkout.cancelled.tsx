import { createFileRoute, Link } from "@tanstack/react-router";
export const Route = createFileRoute("/checkout/cancelled")({ component: CancelledPage });
function CancelledPage() { return <main className="detail-page section-shell"><div className="detail-card glass checkout-state"><h1>Checkout cancelled</h1><p>Your cart is still here and you have not been charged.</p><Link className="listen-button" to="/cart">Return to cart</Link></div></main>; }
