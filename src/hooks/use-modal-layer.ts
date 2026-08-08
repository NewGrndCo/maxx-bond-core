import { useEffect, type RefObject } from "react";

/** Locks body scroll while a modal is open and focuses its close button. */
export function useModalLayer(open: boolean, closeRef: RefObject<HTMLButtonElement | null>) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    if (open) closeRef.current?.focus();
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, closeRef]);
}

/** Calls `onEscape` on the Escape key for the lifetime of the component. */
export function useEscapeKey(onEscape: () => void) {
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onEscape();
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
