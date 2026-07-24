import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { signStorageUrl, signMany } from "@/lib/storage-url";



export const Route = createFileRoute("/")({ component: Index });

const NAV = [
  ["Home", "#home"],
  ["Music", "#music"],
  ["Merch", "#merch"],
  ["Tour", "#tour"],
  ["Gallery", "#gallery"],
  ["About", "#about"],
] as const;
const STREAM_STYLE: Record<string, { cls: string; glyph: string }> = {
  Spotify: { cls: "spotify", glyph: "●" },
  "Apple Music": { cls: "apple", glyph: "♫" },
  "YouTube Music": { cls: "youtube", glyph: "▶" },
  TIDAL: { cls: "", glyph: "◆" },
  "Amazon Music": { cls: "amazon", glyph: "a" },
  SoundCloud: { cls: "soundcloud", glyph: "☁" },
  Audiomack: { cls: "audio", glyph: "⌁" },
  Deezer: { cls: "deezer", glyph: "▥" },
  Pandora: { cls: "pandora", glyph: "p" },
  iHeartRadio: { cls: "heart", glyph: "♥" },
  Triller: { cls: "", glyph: "T" },
};
const FALLBACK_SECTIONS = [
  "hero",
  "streaming",
  "about",
  "gallery",
  "merch",
  "events",
  "newsletter",
];
const formatTime = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0")}`;

function Index() {
  const content = useQuery({
    queryKey: ["public-site-content"],
    queryFn: async () => {
      const [profile, tracks, links, gallery, events, merch, sections, legal] = await Promise.all([
        supabase.from("artist_profile").select("*").limit(1).maybeSingle(),
        supabase.from("tracks").select("*").eq("is_published", true).order("display_order"),
        supabase.from("streaming_links").select("*").eq("is_visible", true).order("display_order"),
        supabase.from("gallery_items").select("*").eq("is_visible", true).order("display_order"),
        supabase.from("events").select("*").eq("is_visible", true).order("event_date"),
        supabase.from("merch_items").select("*").eq("is_visible", true).order("display_order"),
        supabase.from("site_sections").select("*").order("display_order"),
        supabase.from("legal_documents").select("*").eq("is_published", true),
      ]);
      const profileData = profile.data
        ? {
            ...profile.data,
            portrait_url: await signStorageUrl(profile.data.portrait_url),
            hero_artwork_url: await signStorageUrl(profile.data.hero_artwork_url),
            album_cover_url: await signStorageUrl(profile.data.album_cover_url),
          }
        : null;
      return {
        profile: profileData,
        tracks: await signMany(tracks.data ?? [], ["audio_url", "cover_url"]),
        links: links.data ?? [],
        gallery: await signMany(gallery.data ?? [], ["image_url"]),
        events: events.data ?? [],
        merch: await signMany(merch.data ?? [], ["image_url"]),
        sections: sections.data ?? [],
        legal: legal.data ?? [],
      };
    },
  });
  const data = content.data;
  const [modalOpen, setModalOpen] = useState(false);
  const [legalSlug, setLegalSlug] = useState<string | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [liked, setLiked] = useState(false);
  const [trackIndex, setTrackIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [subscribed, setSubscribed] = useState(false);
  const [email, setEmail] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const tracks = data?.tracks ?? [];
  const activeTrack = tracks[trackIndex];
  const profile = data?.profile;

  const autoPlayRef = useRef(false);
  useEffect(() => {
    setCurrentTime(0);
    const audio = audioRef.current;
    if (!audio) return;
    audio.load();
    if (autoPlayRef.current) {
      autoPlayRef.current = false;
      audio.play().catch((err) => {
        console.warn("Autoplay blocked:", err);
        setPlaying(false);
      });
    }
  }, [activeTrack?.id]);
  useEffect(() => {
    const open = modalOpen || legalSlug;
    document.body.style.overflow = open ? "hidden" : "";
    if (open) closeBtnRef.current?.focus();
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalOpen, legalSlug]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setModalOpen(false);
        setLegalSlug(null);
      }
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, []);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const els = root.querySelectorAll(".reveal");
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("visible")),
      { threshold: 0.12 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [data]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio || !activeTrack?.audio_url) return;
    try {
      if (audio.paused) {
        await audio.play();
      } else {
        audio.pause();
      }
    } catch (err) {
      console.warn("Playback failed:", err);
      setPlaying(false);
    }
  };
  const changeTrack = (delta: number, autoPlay = false) => {
    if (!tracks.length) return;
    autoPlayRef.current = autoPlay;
    setTrackIndex((i) => (i + delta + tracks.length) % tracks.length);
  };
  const sectionConfig = (key: string) =>
    data?.sections.find((s) => s.key === key) ?? {
      key,
      is_visible: true,
      display_order: FALLBACK_SECTIONS.indexOf(key),
    };
  const asset = (url?: string | null) =>
    url
      ? { backgroundImage: `url(${url})`, backgroundPosition: "center", backgroundSize: "cover" }
      : undefined;
  const legalDoc = data?.legal.find((doc) => doc.slug === legalSlug);

  const sections = (() => {
    const nodes: Record<string, ReactNode> = {
      hero: (
        <section id="home" className="hero section-shell" key="hero">
          <div className="side-labels" aria-hidden="true">
            <span>THE Q.A.L.E. NY</span>
            <span>UNIONDALE, LIFE</span>
            <span>CLASS AA</span>
          </div>
          <div className="hero-art-wrap reveal">
            <div className="vinyl" style={{ animationPlayState: playing ? "running" : "paused" }}>
              <span />
            </div>
            {(() => {
              const heroUrl =
                activeTrack?.cover_url || profile?.album_cover_url || profile?.hero_artwork_url;
              return (
                <div
                  className={heroUrl ? "hero-art managed-image" : "sprite hero-art"}
                  style={asset(heroUrl)}
                  role="img"
                  aria-label="Featured album artwork"
                />
              );
            })()}
          </div>
          <div className="hero-copy reveal">
            <p className="eyebrow">Featured music</p>
            <h1>
              <span>{profile?.hero_headline || activeTrack?.title || "Terrence"}</span>
              <strong>{profile?.hero_subheading || "Moore"}</strong>
            </h1>
            <h2>{activeTrack?.artist || profile?.artist_name || "Maxx Bond"}</h2>
            <div id="music" className="player glass" aria-label="Music player">
              {(() => {
                const coverUrl = activeTrack?.cover_url || profile?.album_cover_url;
                return (
                  <div
                    className={coverUrl ? "player-cover managed-image" : "sprite player-cover"}
                    style={asset(coverUrl)}
                  />
                );
              })()}
              <div className="track-info">
                <strong>{activeTrack?.title || "Upload music in Admin"}</strong>
                <span>{activeTrack?.artist || profile?.artist_name || "Maxx Bond"}</span>
              </div>
              <button
                className="player-btn"
                aria-label="Previous track"
                onClick={() => changeTrack(-1)}
              >
                ◀
              </button>
              <button
                className="player-btn play-toggle"
                aria-label={playing ? "Pause" : "Play"}
                onClick={togglePlay}
              >
                {playing ? "Ⅱ" : "▶"}
              </button>
              <button className="player-btn" aria-label="Next track" onClick={() => changeTrack(1)}>
                ▶
              </button>
              <button
                className={`player-btn favorite${liked ? " liked" : ""}`}
                aria-label="Favorite"
                aria-pressed={liked}
                onClick={() => setLiked((v) => !v)}
              >
                {liked ? "♥" : "♡"}
              </button>
              <span className="current-time">{formatTime(currentTime)}</span>
              <input
                className="waveform audio-progress"
                aria-label="Song progress"
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={(e) => {
                  const t = Number(e.target.value);
                  if (audioRef.current) audioRef.current.currentTime = t;
                  setCurrentTime(t);
                }}
              />
              <span>{formatTime(duration)}</span>
            </div>
            <audio
              ref={audioRef}
              src={activeTrack?.audio_url ?? undefined}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onEnded={() => changeTrack(1, true)}
              onError={() => setPlaying(false)}
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
            />
            <div className="hero-cta-row">
              <button className="listen-button" onClick={() => setModalOpen(true)}>
                <span>◎</span> Listen Everywhere
              </button>
            </div>
          </div>
        </section>
      ),
      streaming: (
        <section
          key="streaming"
          className="platform-strip section-shell glass reveal"
          aria-label="Available streaming services"
        >
          <span className="strip-label">Streaming on all platforms</span>
          <div className="platform-logos">
            {(data?.links.length
              ? data.links
              : Object.keys(STREAM_STYLE)
                  .slice(0, 8)
                  .map((platform) => ({ id: platform, platform }))
            ).map((link) => (
              <b key={link.id}>
                {STREAM_STYLE[link.platform]?.glyph ?? "↗"} {link.platform}
              </b>
            ))}
          </div>
        </section>
      ),
      about: (
        <section key="about" id="about" className="about section-shell reveal">
          <div
            className={profile?.portrait_url ? "portrait managed-image" : "sprite portrait"}
            style={asset(profile?.portrait_url)}
            role="img"
            aria-label={`Portrait of ${profile?.artist_name || "Maxx Bond"}`}
          />
          <div className="about-copy">
            <p className="eyebrow">About</p>
            <h2>{profile?.artist_name || "Maxx Bond"}</h2>
            <p>
              {profile?.biography ||
                "Uniondale raised. World focused. Maxx Bond brings raw storytelling and real-life experiences over hard-hitting production."}
            </p>
          </div>
          <div className="social glass">
            <p className="eyebrow">Stay connected</p>
            <div>
              {data?.links.slice(0, 6).map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={link.platform}
                >
                  {STREAM_STYLE[link.platform]?.glyph ?? "↗"}
                </a>
              ))}
              <a
                href={`mailto:${profile?.management_email || "bookmaxxbond@gmail.com"}`}
                aria-label="Email"
              >
                ✉
              </a>
            </div>
          </div>
        </section>
      ),
      gallery: (
        <section key="gallery" id="gallery" className="content-panel section-shell reveal">
          <div className="section-heading">
            <p className="eyebrow">Gallery</p>
          </div>
          <div className="gallery-track">
            {data?.gallery.length
              ? data.gallery.map((item) => (
                  <div
                    key={item.id}
                    className="gallery-img managed-image"
                    style={asset(item.image_url)}
                    role="img"
                    aria-label={item.alt_text || item.caption || "Gallery image"}
                  />
                ))
              : [1, 2, 3, 4, 5].map((n) => <div key={n} className={`sprite gallery-img g${n}`} />)}
          </div>
        </section>
      ),
      merch: (
        <section key="merch" id="merch" className="content-panel section-shell reveal">
          <div className="section-heading">
            <p className="eyebrow">Official merch</p>
          </div>
          <div className="merch-grid">
            {data?.merch.length ? (
              data.merch.map((item) => (
                <article key={item.id}>
                  <div className="merch-img managed-image" style={asset(item.image_url)} />
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
      ),
      events: (
        <section key="events" id="tour" className="content-panel tour section-shell reveal">
          <div className="section-heading">
            <p className="eyebrow">Tour dates</p>
          </div>
          <div className="tour-list">
            {data?.events.length ? (
              data.events.map((event) => {
                const d = new Date(`${event.event_date}T00:00:00`);
                return (
                  <article key={event.id}>
                    <time>
                      <b>{d.toLocaleString("en", { month: "short" })}</b>
                      {String(d.getDate()).padStart(2, "0")}
                    </time>
                    <p>
                      <strong>{event.city}</strong>
                      <span>{event.venue}</span>
                    </p>
                    {event.ticket_url ? (
                      <a
                        className="tour-ticket"
                        href={event.ticket_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Tickets
                      </a>
                    ) : (
                      <span />
                    )}
                  </article>
                );
              })
            ) : (
              <p className="empty-content">No upcoming dates.</p>
            )}
          </div>
        </section>
      ),
      newsletter: (
        <section key="newsletter" className="newsletter section-shell reveal">
          <div>
            <h2>Join the Foreign Life List</h2>
            <p>
              Be the first to know about new music, merch drops, tour dates, and exclusive content.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSubscribed(true);
                setEmail("");
              }}
            >
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
              <button type="submit">{subscribed ? "Welcome In" : "Join Now"}</button>
            </form>
          </div>
          <div className="sprite newsletter-art" aria-hidden="true" />
        </section>
      ),
    };
    return FALLBACK_SECTIONS.filter((key) => sectionConfig(key).is_visible)
      .sort((a, b) => sectionConfig(a).display_order - sectionConfig(b).display_order)
      .map((key) => nodes[key]);
  })();

  return (
    <div ref={rootRef}>
      <div className="noise" aria-hidden="true" />
      <header className="site-header">
        <Link className="wordmark" to="/admin" aria-label="Admin dashboard">
          MAXX BOND
        </Link>
        <nav className={`desktop-nav${navOpen ? " open" : ""}`} aria-label="Main navigation">
          {NAV.map(([label, href], i) => (
            <a
              key={href}
              className={i === 0 ? "active" : undefined}
              href={href}
              onClick={() => setNavOpen(false)}
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="header-actions">
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
      <main className="managed-main">{sections}</main>
      <footer className="footer section-shell">
        <div className="footer-brand">
          <div className="sprite logo-crop" />
          <span>MAXX BOND</span>
        </div>
        <div>
          <strong>Management</strong>
          <a href={`mailto:${profile?.management_email || "bookmaxxbond@gmail.com"}`}>
            {profile?.management_email || "bookmaxxbond@gmail.com"}
          </a>
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
          <button onClick={() => setLegalSlug("privacy")}>Privacy Policy</button>
          <button onClick={() => setLegalSlug("terms")}>Terms of Service</button>
        </div>
      </footer>
      <div
        className={`modal-backdrop${modalOpen ? " open" : ""}`}
        aria-hidden={!modalOpen}
        onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}
      >
        <section
          className="listen-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="listen-title"
        >
          <button
            className="modal-close"
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
            <p>Choose your platform to listen to {activeTrack?.title || "Maxx Bond"}</p>
          </header>
          <div className="modal-content">
            <div className="modal-album">
              {(() => {
                const mUrl = activeTrack?.cover_url || profile?.album_cover_url;
                return (
                  <div
                    className={mUrl ? "modal-cover managed-image" : "sprite modal-cover"}
                    style={asset(mUrl)}
                  />
                );
              })()}
              <p>
                Thank you for supporting real music.
                <br />
                <span>Add it to your library.</span>
              </p>
            </div>
            <div className="streaming-grid">
              {data?.links
                .filter((link) => link.url)
                .map((link) => {
                  const style = STREAM_STYLE[link.platform] ?? { cls: "", glyph: "↗" };
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
      </div>
      <div
        className={`modal-backdrop${legalSlug ? " open" : ""}`}
        aria-hidden={!legalSlug}
        onClick={(e) => e.target === e.currentTarget && setLegalSlug(null)}
      >
        <section
          className="listen-modal legal-document-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="legal-title"
        >
          <button className="modal-close" aria-label="Close" onClick={() => setLegalSlug(null)}>
            ×
          </button>
          <header>
            <h2 id="legal-title">
              {legalDoc?.title || (legalSlug === "privacy" ? "Privacy Policy" : "Terms of Service")}
            </h2>
          </header>
          <div className="legal-document-body">
            {(legalDoc?.body_md || "This document will be available soon.")
              .split("\n")
              .map((line, i) => (
                <p key={i}>{line}</p>
              ))}
          </div>
        </section>
      </div>
    </div>
  );
}
