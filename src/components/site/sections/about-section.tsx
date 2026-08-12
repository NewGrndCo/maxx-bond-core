import { DEFAULT_ARTIST, DEFAULT_EMAIL } from "@/lib/site-constants";
import type { ArtistProfile, SocialLink } from "@/lib/site-content";
import { ManagedImage } from "@/components/site/managed-image";

const DEFAULT_BIO =
  "Uniondale raised. World focused. Maxx Bond brings raw storytelling and real-life experiences over hard-hitting production.";

export function AboutSection({
  profile,
  links,
}: {
  profile: ArtistProfile | null | undefined;
  links: SocialLink[];
}) {
  const name = profile?.artist_name || DEFAULT_ARTIST;
  return (
    <section id="about" className="about section-shell reveal">
      <ManagedImage className="portrait" url={profile?.portrait_url} alt={`Portrait of ${name}`} />
      <div className="about-copy">
        <p className="eyebrow">About</p>
        <h2>{name}</h2>
        <p>{profile?.biography || DEFAULT_BIO}</p>
      </div>
      <div className="social glass">
        <p className="eyebrow">Stay connected</p>
        <div>
          {links.slice(0, 6).map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              aria-label={link.platform}
            >
              {link.icon || link.platform.slice(0, 1).toUpperCase()}
            </a>
          ))}
          <a href={`mailto:${profile?.management_email || DEFAULT_EMAIL}`} aria-label="Email">
            ✉
          </a>
        </div>
      </div>
    </section>
  );
}
