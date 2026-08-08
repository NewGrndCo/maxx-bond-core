import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartLine = { productId: string; variantId?: string; name: string; variantName?: string; imageUrl?: string; unitPriceCents: number; quantity: number };
type CartValue = { lines: CartLine[]; count: number; subtotal: number; add: (line: CartLine) => void; setQuantity: (productId: string, variantId: string | undefined, quantity: number) => void; remove: (productId: string, variantId?: string) => void; clear: () => void };
const CartContext = createContext<CartValue | null>(null);
const keyOf = (line: Pick<CartLine, "productId" | "variantId">) => `${line.productId}:${line.variantId ?? "default"}`;

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  useEffect(() => { try { const saved = localStorage.getItem("maxx-bond-cart"); if (saved) setLines(JSON.parse(saved) as CartLine[]); } catch { /* ignore corrupt browser state */ } }, []);
  useEffect(() => { localStorage.setItem("maxx-bond-cart", JSON.stringify(lines)); }, [lines]);
  const value = useMemo<CartValue>(() => ({ lines, count: lines.reduce((sum, line) => sum + line.quantity, 0), subtotal: lines.reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0), add: (next) => setLines((current) => { const key = keyOf(next); const found = current.find((line) => keyOf(line) === key); return found ? current.map((line) => keyOf(line) === key ? { ...line, quantity: Math.min(99, line.quantity + next.quantity) } : line) : [...current, next]; }), setQuantity: (productId, variantId, quantity) => setLines((current) => current.map((line) => keyOf(line) === keyOf({ productId, variantId }) ? { ...line, quantity: Math.max(1, Math.min(99, quantity)) } : line)), remove: (productId, variantId) => setLines((current) => current.filter((line) => keyOf(line) !== keyOf({ productId, variantId }))), clear: () => setLines([]) }), [lines]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
export function useCart() { const value = useContext(CartContext); if (!value) throw new Error("useCart must be used inside CartProvider"); return value; }
