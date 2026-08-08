import { useEffect, type RefObject } from "react";

/** Adds `visible` to `.reveal` descendants as they scroll into view. */
export function useRevealOnScroll(rootRef: RefObject<HTMLElement | null>, deps: unknown) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("visible")),
      { threshold: 0.12 },
    );
    root.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [rootRef, deps]);
}
