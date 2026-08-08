import type { RefObject } from "react";
import { ModalBackdrop } from "@/components/site/modal-backdrop";
import { DEFAULT_ARTIST, assetStyle, managedClass, streamStyle } from "@/lib/site-constants";
import type { ArtistProfile, StreamingLink, Track } from "@/lib/site-content";

export function ListenModal({
  open,
  onClose,
  closeRef,
  links,
  activeTrack,
  profile,
}: {
  open: boolean;
  onClose: () => void;
  closeRef: RefObject<HTMLButtonElement | null>;
  links: StreamingLink[];
  activeTrack: Track | undefined;
  profile: ArtistProfile | null | undefined;
}) {
  const coverUrl = activeTrack?.cover_url || profile?.album_cover_url;
  return (
    <ModalBackdrop open={open} onClose={onClose}>
      <section
        className="listen-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="listen-title"
      >
        <button className="modal-close" aria-label="Close" ref={closeRef} onClick={onClose}>
          ×
        </button>
        <header>
          <h2 id="listen-title">
            <span>◎</span> Listen Everywhere
          </h2>
          <p>Choose your platform to listen to {activeTrack?.title || DEFAULT_ARTIST}</p>
        </header>
        <div className="modal-content">
          <div className="modal-album">
            <div className={managedClass(coverUrl, "modal-cover")} style={assetStyle(coverUrl)} />
            <p>
              Thank you for supporting real music.
              <br />
              <span>Add it to your library.</span>
            </p>
          </div>
          <div className="streaming-grid">
            {links
              .filter((link) => link.url)
              .map((link) => {
                const style = streamStyle(link.platform);
                return (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className={link.platform === "Triller" ? "triller" : undefined}
                  >
                    <b className={style.cls || undefined}>{style.glyph}</b>
                    <span>{link.platform}</span>
                    <i>↗</i>
                  </a>
                );
              })}
          </div>
        </div>
        <footer>
          ♢{" "}
          <span>
            By using these links, you are leaving Maxx Bond&apos;s site and entering a third-party
            platform.
          </span>
        </footer>
      </section>
    </ModalBackdrop>
  );
}
