import { assetStyle } from "@/lib/site-constants";
import type { GalleryItem } from "@/lib/site-content";

export function GallerySection({ gallery }: { gallery: GalleryItem[] }) {
  return (
    <section id="gallery" className="content-panel section-shell reveal">
      <div className="section-heading">
        <p className="eyebrow">Gallery</p>
      </div>
      <div className="gallery-track">
        {gallery.length
          ? gallery.map((item) => (
              <div
                key={item.id}
                className="gallery-img managed-image"
                style={assetStyle(item.image_url)}
                role="img"
                aria-label={item.alt_text || item.caption || "Gallery image"}
              />
            ))
          : [1, 2, 3, 4, 5].map((n) => <div key={n} className={`sprite gallery-img g${n}`} />)}
      </div>
    </section>
  );
}
