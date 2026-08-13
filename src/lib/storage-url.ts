import { supabase } from "@/integrations/supabase/client";

// Buckets in this project are private (workspace blocks public buckets).
// Stored `getPublicUrl` values won't play/render — we transform to signed URLs.
const TTL_SECONDS = 60 * 60 * 6;

const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

export function parseStorage(url: string | null | undefined) {
  if (!url) return null;
  const m = url.match(/\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/?]+)\/([^?]+)/);
  if (!m) return null;
  return { bucket: decodeURIComponent(m[1]), path: decodeURIComponent(m[2]) };
}

export async function signStorageUrl(url: string | null | undefined): Promise<string> {
  if (!url) return "";
  const cached = signedUrlCache.get(url);
  if (cached && cached.expiresAt > Date.now()) return cached.url;
  const parsed = parseStorage(url);
  if (!parsed) return url;
  const { data, error } = await supabase.storage
    .from(parsed.bucket)
    .createSignedUrl(parsed.path, TTL_SECONDS);
  if (error || !data?.signedUrl) return url;
  signedUrlCache.set(url, {
    url: data.signedUrl,
    expiresAt: Date.now() + (TTL_SECONDS - 300) * 1000,
  });
  return data.signedUrl;
}

/** Signs all private-storage URLs using one request per bucket instead of one request per asset. */
export async function signStorageUrls(urls: Array<string | null | undefined>) {
  const result = new Map<string, string>();
  const grouped = new Map<string, Array<{ original: string; path: string }>>();

  for (const original of new Set(urls.filter((url): url is string => Boolean(url)))) {
    const cached = signedUrlCache.get(original);
    if (cached && cached.expiresAt > Date.now()) {
      result.set(original, cached.url);
      continue;
    }
    const parsed = parseStorage(original);
    if (!parsed) {
      result.set(original, original);
      continue;
    }
    const entries = grouped.get(parsed.bucket) ?? [];
    entries.push({ original, path: parsed.path });
    grouped.set(parsed.bucket, entries);
  }

  await Promise.all(
    [...grouped.entries()].map(async ([bucket, entries]) => {
      const { data, error } = await supabase.storage.from(bucket).createSignedUrls(
        entries.map((entry) => entry.path),
        TTL_SECONDS,
      );
      if (error || !data) {
        entries.forEach((entry) => result.set(entry.original, entry.original));
        return;
      }
      entries.forEach((entry, index) => {
        const signedUrl = data[index]?.signedUrl || entry.original;
        result.set(entry.original, signedUrl);
        if (signedUrl !== entry.original) {
          signedUrlCache.set(entry.original, {
            url: signedUrl,
            expiresAt: Date.now() + (TTL_SECONDS - 300) * 1000,
          });
        }
      });
    }),
  );

  return result;
}

export async function signMany<T extends Record<string, unknown>>(
  rows: T[],
  keys: (keyof T)[],
): Promise<T[]> {
  const urls = rows.flatMap((row) =>
    keys
      .map((key) => row[key])
      .filter((value): value is string => typeof value === "string" && Boolean(value)),
  );
  const signed = await signStorageUrls(urls);
  return rows.map((row) => {
    const next: Record<string, unknown> = { ...row };
    for (const key of keys) {
      const value = row[key];
      if (typeof value === "string" && value) next[key as string] = signed.get(value) ?? value;
    }
    return next as T;
  });
}
