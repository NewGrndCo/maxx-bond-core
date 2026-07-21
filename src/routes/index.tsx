import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/")({
  component: Index,
});


type NavId = "home" | "music" | "merch" | "tour" | "gallery" | "about";

const NAV: { id: NavId; label: string; href: string }[] = [
  { id: "home", label: "Home", href: "#home" },
  { id: "music", label: "Music", href: "#music" },
  { id: "merch", label: "Merch", href: "#merch" },
  { id: "tour", label: "Tour", href: "#tour" },
  { id: "gallery", label: "Gallery", href: "#gallery" },
  { id: "about", label: "About", href: "#about" },
];

const MERCH = [
  { key: "m1", name: "Foreign Life Hoodie", price: "$65.00", label: "hoodie" },
  { key: "m2", name: "TFL Logo Tee", price: "$30.00", label: "tee" },
  { key: "m3", name: "Uniondale Tee", price: "$30.00", label: "Uniondale tee" },
  { key: "m4", name: "Foreign Life Snapback", price: "$35.00", label: "snapback" },
];

const TOUR = [
  { m: "Jun", d: "07", city: "Brooklyn, NY", venue: "Knitting Factory" },
  { m: "Jun", d: "21", city: "Philadelphia, PA", venue: "Underground Arts" },
  { m: "Jul", d: "03", city: "Atlanta, GA", venue: "The Masquerade" },
  { m: "Jul", d: "18", city: "Chicago, IL", venue: "The Bottom Lounge" },
];

const STREAMING = [
  { cls: "spotify", glyph: "●", name: "Spotify" },
  { cls: "apple", glyph: "♫", name: "Apple Music" },
  { cls: "youtube", glyph: "▶", name: "YouTube Music" },
  { cls: "", glyph: "◆", name: "TIDAL" },
  { cls: "amazon", glyph: "a", name: "amazon music" },
  { cls: "soundcloud", glyph: "☁", name: "SoundCloud" },
  { cls: "audio", glyph: "⌁", name: "audiomack" },
  { cls: "deezer", glyph: "▥", name: "deezer" },
  { cls: "pandora", glyph: "p", name: "pandora" },
  { cls: "heart", glyph: "♥", name: "iHeartRADIO" },
];

function Index() {
  const [modalOpen, setModalOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [liked, setLiked] = useState(false);
  const [cart, setCart] = useState(2);
  const [added, setAdded] = useState<Record<string, boolean>>({});
  const [subscribed, setSubscribed] = useState(false);
  const [email, setEmail] = useState("");
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Body scroll lock + focus close when modal opens
  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = "hidden";
      closeBtnRef.current?.focus();
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalOpen]);

  // Escape to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // IntersectionObserver reveal
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const els = root.querySelectorAll(".reveal");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("visible");
        });
      },
      { threshold: 0.12 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const addToCart = (key: string) => {
    setCart((c) => c + 1);
    setAdded((a) => ({ ...a, [key]: true }));
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setSubscribed(true);
    setEmail("");
  };

  const onBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) setModalOpen(false);
  };

  return (
    <div ref={rootRef}>
      <div className="noise" aria-hidden="true" />
      <header className="site-header">
        <a className="wordmark" href="#home" aria-label="Maxx Bond home">
          MAXX BOND
        </a>
        <nav
          className={`desktop-nav${navOpen ? " open" : ""}`}
          aria-label="Main navigation"
        >
          {NAV.map((n, i) => (
            <a
              key={n.id}
              className={i === 0 ? "active" : undefined}
              href={n.href}
              onClick={() => setNavOpen(false)}
            >
              {n.label}
            </a>
          ))}
        </nav>
        <div className="header-actions">
          <button className="cart" aria-label="Shopping cart">
            ⌑<span>{cart}</span>
          </button>
          <button
            className="menu-toggle"
            aria-label="Open navigation"
            aria-expanded={navOpen}
            onClick={() => setNavOpen((v) => !v)}
          >
            <i />
            <i />
            <i />
          </button>
        </div>
      </header>

      <main>
        <section id="home" className="hero section-shell">
          <div className="side-labels" aria-hidden="true">
            <span>THE Q.A.L.E. NY</span>
            <span>UNIONDALE, LIFE</span>
            <span>CLASS AA</span>
          </div>
          <div className="hero-art-wrap reveal">
            <div
              className="vinyl"
              style={{ animationPlayState: playing ? "running" : "paused" }}
            >
              <span />
            </div>
            <div
              className="sprite hero-art"
              role="img"
              aria-label="Terrence Moore album artwork"
            />
          </div>
          <div className="hero-copy reveal">
            <p className="eyebrow">New album</p>
            <h1>
              <span>Terrence</span>
              <strong>Moore</strong>
            </h1>
            <h2>The Foreign Life</h2>
            <div className="meta">
              <span>▣ &nbsp; May 23, 2025</span>
              <span>◉ &nbsp; The Foreign Life Records</span>
            </div>

            <div id="music" className="player glass" aria-label="Music player">
              <div className="sprite player-cover" />
              <div className="track-info">
                <strong>Terrence Moore</strong>
                <span>Maxx Bond</span>
              </div>
              <button
                className="player-btn"
                data-action="previous"
                aria-label="Previous track"
              >
                ◀
              </button>
              <button
                className="player-btn play-toggle"
                aria-label={playing ? "Pause" : "Play"}
                onClick={() => setPlaying((p) => !p)}
              >
                {playing ? "Ⅱ" : "▶"}
              </button>
              <button
                className="player-btn"
                data-action="next"
                aria-label="Next track"
              >
                ▶
              </button>
              <button
                className={`player-btn favorite${liked ? " liked" : ""}`}
                aria-label="Favorite"
                aria-pressed={liked}
                onClick={() => setLiked((l) => !l)}
              >
                {liked ? "♥" : "♡"}
              </button>
              <span className="current-time">1:28</span>
              <div className="waveform" aria-label="Song progress">
                <i />
              </div>
              <span>3:45</span>
            </div>

            <div className="hero-cta-row">
              <div className="plays">
                <span>Total plays</span>
                <strong>23,478</strong>
              </div>
              <button
                className="listen-button"
                data-open-listen
                onClick={() => setModalOpen(true)}
              >
                <span>◎</span> Listen Everywhere
              </button>
            </div>
          </div>
        </section>

        <section
          className="platform-strip section-shell glass reveal"
          aria-label="Available streaming services"
        >
          <span className="strip-label">Streaming on all platforms</span>
          <div className="platform-logos">
            <b>◉ Spotify</b>
            <b>● Music</b>
            <b>▶ YouTube</b>
            <b>◆ TIDAL</b>
            <b>
              amazon<span>music</span>
            </b>
            <b>☁ SoundCloud</b>
            <b>⌁ audiomack</b>
            <b>▥ Deezer</b>
          </div>
        </section>

        <section id="about" className="about section-shell reveal">
          <div
            className="sprite portrait"
            role="img"
            aria-label="Portrait of Maxx Bond"
          />
          <div className="about-copy">
            <p className="eyebrow">About</p>
            <h2>Maxx Bond</h2>
            <p>
              Uniondale raised. World focused. Maxx Bond brings raw storytelling
              and real-life experiences over hard-hitting production. This is
              The Foreign Life.
            </p>
            <button className="outline-btn">Read More</button>
          </div>
          <div className="social glass">
            <p className="eyebrow">Stay connected</p>
            <div>
              <a href="#" aria-label="Instagram">
                ◎
              </a>
              <a href="#" aria-label="X">
                𝕏
              </a>
              <a href="#" aria-label="YouTube">
                ▶
              </a>
              <a href="#" aria-label="TikTok">
                ♪
              </a>
              <a href="#" aria-label="Spotify">
                ●
              </a>
              <a href="mailto:bookmaxxbond@gmail.com" aria-label="Email">
                ✉
              </a>
            </div>
          </div>
        </section>

        <section id="gallery" className="content-panel section-shell reveal">
          <div className="section-heading">
            <p className="eyebrow">Gallery</p>
            <button>View all &nbsp; →</button>
          </div>
          <div className="gallery-track">
            <button
              className="slider-arrow prev"
              aria-label="Previous gallery image"
            >
              ‹
            </button>
            <div className="sprite gallery-img g1" />
            <div className="sprite gallery-img g2" />
            <div className="sprite gallery-img g3" />
            <div className="sprite gallery-img g4" />
            <div className="sprite gallery-img g5" />
            <button
              className="slider-arrow next"
              aria-label="Next gallery image"
            >
              ›
            </button>
          </div>
        </section>

        <div className="lower-grid section-shell">
          <section id="merch" className="content-panel reveal">
            <div className="section-heading">
              <p className="eyebrow">Official merch</p>
              <button>View all &nbsp; →</button>
            </div>
            <div className="merch-grid">
              {MERCH.map((item) => (
                <article key={item.key}>
                  <div className={`sprite merch-img ${item.key}`} />
                  <h3>{item.name}</h3>
                  <p>
                    {item.price}{" "}
                    <button
                      aria-label={`Add ${item.label} to cart`}
                      onClick={() => addToCart(item.key)}
                    >
                      {added[item.key] ? "✓" : "⌑"}
                    </button>
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section id="tour" className="content-panel tour reveal">
            <div className="section-heading">
              <p className="eyebrow">Tour dates</p>
              <button>View all &nbsp; →</button>
            </div>
            <div className="tour-list">
              {TOUR.map((t) => (
                <article key={`${t.m}-${t.d}`}>
                  <time>
                    <b>{t.m}</b>
                    {t.d}
                  </time>
                  <p>
                    <strong>{t.city}</strong>
                    <span>{t.venue}</span>
                  </p>
                  <button>Tickets</button>
                </article>
              ))}
            </div>
          </section>
        </div>

        <section className="newsletter section-shell reveal">
          <div>
            <h2>Join the Foreign Life List</h2>
            <p>
              Be the first to know about new music, merch drops, tour dates, and
              exclusive content.
            </p>
            <form onSubmit={handleSubscribe}>
              <label className="sr-only" htmlFor="email">
                Enter your email
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button type="submit">
                {subscribed ? "Welcome In" : "Join Now"}
              </button>
            </form>
          </div>
          <div className="sprite newsletter-art" aria-hidden="true" />
        </section>
      </main>

      <footer className="footer section-shell">
        <div className="footer-brand">
          <div className="sprite logo-crop" />
          <span>MAXX BOND</span>
        </div>
        <div>
          <strong>Management</strong>
          <a href="mailto:bookmaxxbond@gmail.com">bookmaxxbond@gmail.com</a>
          <span>347-555-0192</span>
        </div>
        <div>
          <span>© 2025 The Foreign Life Records</span>
          <span>All rights reserved.</span>
        </div>
        <div className="legal">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
        </div>
      </footer>

      <div
        className={`modal-backdrop${modalOpen ? " open" : ""}`}
        data-listen-modal
        aria-hidden={!modalOpen}
        onClick={onBackdropClick}
      >
        <section
          className="listen-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="listen-title"
        >
          <button
            className="modal-close"
            data-close-listen
            aria-label="Close"
            ref={closeBtnRef}
            onClick={() => setModalOpen(false)}
          >
            ×
          </button>
          <header>
            <h2 id="listen-title">
              <span>◎</span> Listen Everywhere
            </h2>
            <p>
              Choose your platform to listen to Terrence Moore — The Foreign
              Life
            </p>
          </header>
          <div className="modal-content">
            <div className="modal-album">
              <div className="sprite modal-cover" />
              <p>
                Thank you for supporting real music.
                <br />
                <span>Add it to your library.</span>
              </p>
            </div>
            <div className="streaming-grid">
              {STREAMING.map((s) => (
                <a
                  key={s.name}
                  href="#"
                  onClick={(e) => e.preventDefault()}
                >
                  <b className={s.cls || undefined}>{s.glyph}</b>
                  <span>{s.name}</span>
                  <i>↗</i>
                </a>
              ))}
              <a
                href="#"
                className="triller"
                onClick={(e) => e.preventDefault()}
              >
                <span>TRILLER</span>
                <i>↗</i>
              </a>
            </div>
          </div>
          <footer>
            ♢{" "}
            <span>
              By using these links, you are leaving Maxx Bond's site and
              entering a third-party platform.
            </span>
          </footer>
        </section>
      </div>
    </div>
  );
}
