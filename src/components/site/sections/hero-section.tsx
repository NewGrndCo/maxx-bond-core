import type { AudioPlayer } from "@/hooks/use-audio-player";
import {
  DEFAULT_ARTIST,
  assetStyle,
  formatTime,
  managedClass,
} from "@/lib/site-constants";
import type { ArtistProfile } from "@/lib/site-content";

export function HeroSection({
  profile,
  player,
  liked,
  onToggleLike,
  onOpenListen,
}: {
  profile: ArtistProfile | null | undefined;
  player: AudioPlayer;
  liked: boolean;
  onToggleLike: () => void;
  onOpenListen: () => void;
}) {
  const { activeTrack, playing, currentTime, duration, togglePlay, changeTrack, seek, audioProps } =
    player;
  const heroUrl = activeTrack?.cover_url || profile?.album_cover_url || profile?.hero_artwork_url;
  const coverUrl = activeTrack?.cover_url || profile?.album_cover_url;
  const artist = activeTrack?.artist || profile?.artist_name || DEFAULT_ARTIST;

  return (
    <section id="home" className="hero section-shell">
      <div className="side-labels" aria-hidden="true">
        <span>THE Q.A.L.E. NY</span>
        <span>UNIONDALE, LIFE</span>
        <span>CLASS AA</span>
      </div>
      <div className="hero-art-wrap reveal">
        <div className="vinyl" style={{ animationPlayState: playing ? "running" : "paused" }}>
          <span />
        </div>
        <div
          className={managedClass(heroUrl, "hero-art")}
          style={assetStyle(heroUrl)}
          role="img"
          aria-label="Featured album artwork"
        />
      </div>
      <div className="hero-copy reveal">
        <p className="eyebrow">Featured music</p>
        <h1>
          <span>{profile?.hero_headline || activeTrack?.title || "Terrence"}</span>
          <strong>{profile?.hero_subheading || "Moore"}</strong>
        </h1>
        <h2>{artist}</h2>
        <div id="music" className="player glass" aria-label="Music player">
          <div className={managedClass(coverUrl, "player-cover")} style={assetStyle(coverUrl)} />
          <div className="track-info">
            <strong>{activeTrack?.title || "Upload music in Admin"}</strong>
            <span>{artist}</span>
          </div>
          <button
            className="player-btn"
            aria-label="Previous track"
            onClick={() => changeTrack(-1, playing)}
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
          <button
            className="player-btn"
            aria-label="Next track"
            onClick={() => changeTrack(1, playing)}
          >
            ▶
          </button>
          <button
            className={`player-btn favorite${liked ? " liked" : ""}`}
            aria-label="Favorite"
            aria-pressed={liked}
            onClick={onToggleLike}
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
            onChange={(e) => seek(Number(e.target.value))}
          />
          <span>{formatTime(duration)}</span>
        </div>
        <audio {...audioProps} />
        <div className="hero-cta-row">
          <button className="listen-button" onClick={onOpenListen}>
            <span>◎</span> Listen Everywhere
          </button>
        </div>
      </div>
    </section>
  );
}
