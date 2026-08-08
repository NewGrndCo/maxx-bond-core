import { ModalBackdrop } from "@/components/site/modal-backdrop";
import type { LegalDocument } from "@/lib/site-content";

export function LegalModal({
  slug,
  doc,
  onClose,
}: {
  slug: string | null;
  doc: LegalDocument | undefined;
  onClose: () => void;
}) {
  const fallbackTitle = slug === "privacy" ? "Privacy Policy" : "Terms of Service";
  return (
    <ModalBackdrop open={Boolean(slug)} onClose={onClose}>
      <section
        className="listen-modal legal-document-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-title"
      >
        <button className="modal-close" aria-label="Close" onClick={onClose}>
          ×
        </button>
        <header>
          <h2 id="legal-title">{doc?.title || fallbackTitle}</h2>
        </header>
        <div className="legal-document-body">
          {(doc?.body_md || "This document will be available soon.").split("\n").map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      </section>
    </ModalBackdrop>
  );
}
