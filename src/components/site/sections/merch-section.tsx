import { assetStyle } from "@/lib/site-constants";
import type { MerchItem } from "@/lib/site-content";

export function MerchSection({ merch }: { merch: MerchItem[] }) {
  return (
    <section id="merch" className="content-panel section-shell reveal">
      <div className="section-heading">
        <p className="eyebrow">Official merch</p>
      </div>
      <div className="merch-grid">
        {merch.length ? (
          merch.map((item) => (
            <article key={item.id}>
              <div className="merch-img managed-image" style={assetStyle(item.image_url)} />
              <h3>{item.name}</h3>
              <p>
                ${(item.price_cents / 100).toFixed(2)}{" "}
                {item.external_url && (
                  <a
                    href={item.external_url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`View ${item.name}`}
                  >
                    ↗
                  </a>
                )}
              </p>
            </article>
          ))
        ) : (
          <p className="empty-content">Merch coming soon.</p>
        )}
      </div>
    </section>
  );
}
