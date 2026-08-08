import { STREAM_STYLE, streamStyle } from "@/lib/site-constants";
import type { StreamingLink } from "@/lib/site-content";

export function StreamingStrip({ links }: { links: StreamingLink[] }) {
  const items = links.length
    ? links.map((link) => ({ id: link.id, platform: link.platform }))
    : Object.keys(STREAM_STYLE)
        .slice(0, 8)
        .map((platform) => ({ id: platform, platform }));

  return (
    <section
      className="platform-strip section-shell glass reveal"
      aria-label="Available streaming services"
    >
      <span className="strip-label">Streaming on all platforms</span>
      <div className="platform-logos">
        {items.map((item) => (
          <b key={item.id}>
            {streamStyle(item.platform).glyph} {item.platform}
          </b>
        ))}
      </div>
    </section>
  );
}
