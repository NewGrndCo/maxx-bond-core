import { DEFAULT_EMAIL } from "@/lib/site-constants";
import type { ArtistProfile } from "@/lib/site-content";

export function SiteFooter({
  profile,
  onOpenLegal,
}: {
  profile: ArtistProfile | null | undefined;
  onOpenLegal: (slug: string) => void;
}) {
  const email = profile?.management_email || DEFAULT_EMAIL;
  return (
    <footer className="footer section-shell">
      <div className="footer-brand">
        <div className="sprite logo-crop" />
        <span>MAXX BOND</span>
      </div>
      <div>
        <strong>Management</strong>
        <a href={`mailto:${email}`}>{email}</a>
        <span>{profile?.management_phone}</span>
      </div>
      <div>
        <span>© {new Date().getFullYear()} The Foreign Life Records</span>
        <span>All rights reserved.</span>
        <a
          className="developer-credit"
          href="https://newgrnd.media"
          target="_blank"
          rel="noreferrer"
        >
          Website developed by New Ground Solutions
        </a>
      </div>
      <div className="legal">
        <button onClick={() => onOpenLegal("privacy")}>Privacy Policy</button>
        <button onClick={() => onOpenLegal("terms")}>Terms of Service</button>
      </div>
    </footer>
  );
}
