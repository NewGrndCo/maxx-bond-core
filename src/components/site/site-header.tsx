import { Link } from "@tanstack/react-router";
import { NAV } from "@/lib/site-constants";

export function SiteHeader({
  navOpen,
  onToggleNav,
  onCloseNav,
}: {
  navOpen: boolean;
  onToggleNav: () => void;
  onCloseNav: () => void;
}) {
  return (
    <header className="site-header">
      <Link className="wordmark" to="/admin" aria-label="Admin dashboard">
        MAXX BOND
      </Link>
      <nav className={`desktop-nav${navOpen ? " open" : ""}`} aria-label="Main navigation">
        {NAV.map(([label, href], i) => (
          <a key={href} className={i === 0 ? "active" : undefined} href={href} onClick={onCloseNav}>
            {label}
          </a>
        ))}
      </nav>
      <div className="header-actions">
        <button
          className="menu-toggle"
          aria-label="Open navigation"
          aria-expanded={navOpen}
          onClick={onToggleNav}
        >
          <i />
          <i />
          <i />
        </button>
      </div>
    </header>
  );
}
