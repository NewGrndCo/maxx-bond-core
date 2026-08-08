const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

/** Browsers cannot decode HEIC/HEIF, so those uploads are rejected up front. */
export function isBrowserImage(file: File): boolean {
  const name = file.name.toLowerCase();
  if (name.endsWith(".heic") || name.endsWith(".heif")) return false;
  if (file.type && !IMAGE_TYPES.includes(file.type)) {
    return /\.(jpe?g|png|webp|gif|avif)$/i.test(name);
  }
  return true;
}

export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/avif";
export const IMAGE_HINT = "JPG / PNG / WebP / GIF / AVIF. HEIC not supported.";
export const IMAGE_ERROR =
  "Cover must be JPG, PNG, WebP, GIF, or AVIF. HEIC is not supported by browsers.";

/** "01 - The Arrival.mp3" -> "The Arrival"; "1. THE ARRIVAL.mp3" -> "The Arrival" */
export function titleFromFilename(filename: string): string {
  let name = filename.replace(/\.[^.]+$/, "");
  name = name.replace(/^\s*\d+\s*[.\-_)]\s*/, "");
  name = name.replace(/[_\-]+/g, " ").replace(/\s+/g, " ").trim();
  if (name === name.toUpperCase()) {
    name = name.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return name;
}

/** Reads duration from an audio file in the browser; 0 when it cannot be decoded. */
export async function probeDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      const seconds = Number.isFinite(audio.duration) ? audio.duration : 0;
      URL.revokeObjectURL(url);
      resolve(Math.round(seconds));
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };
    audio.src = url;
  });
}
