export const NAV = [
  ["Home", "#home"],
  ["Music", "#music"],
  ["Merch", "#merch"],
  ["Tour", "#tour"],
  ["Gallery", "#gallery"],
  ["About", "#about"],
] as const;

export const STREAM_STYLE: Record<string, { cls: string; glyph: string }> = {
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

export const streamStyle = (platform: string) =>
  STREAM_STYLE[platform] ?? { cls: "", glyph: "↗" };

export const SECTION_KEYS = [
  "hero",
  "streaming",
  "about",
  "gallery",
  "merch",
  "events",
  "newsletter",
] as const;

export type SectionKey = (typeof SECTION_KEYS)[number];

export const DEFAULT_EMAIL = "bookmaxxbond@gmail.com";
export const DEFAULT_ARTIST = "Maxx Bond";

export const formatTime = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0")}`;

/** Background style for an uploaded (managed) image; undefined when no URL. */
export const assetStyle = (url?: string | null) =>
  url
    ? { backgroundImage: `url(${url})`, backgroundPosition: "center", backgroundSize: "cover" }
    : undefined;

/**
 * Uploaded images use `managed-image` (cover/center); the sprite sheet class is
 * kept as the fallback so the approved design still renders when empty.
 */
export const managedClass = (url: string | null | undefined, base: string) =>
  url ? `${base} managed-image` : `sprite ${base}`;
