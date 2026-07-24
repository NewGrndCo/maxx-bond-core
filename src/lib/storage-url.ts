import { supabase } from "@/integrations/supabase/client";

// Buckets in this project are private (workspace blocks public buckets).
// Stored `getPublicUrl` values won't play/render — we transform to signed URLs.
const TTL_SECONDS = 60 * 60 * 6;

export function parseStorage(url: string | null | undefined) {
  if (!url) return null;
  const m = url.match(/\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/?]+)\/([^?]+)/);
  if (!m) return null;
  return { bucket: decodeURIComponent(m[1]), path: decodeURIComponent(m[2]) };
}

export async function signStorageUrl(url: string | null | undefined): Promise<string> {
  const parsed = parseStorage(url);
  if (!parsed) return url ?? "";
  const { data, error } = await supabase.storage
    .from(parsed.bucket)
    .createSignedUrl(parsed.path, TTL_SECONDS);
  if (error || !data?.signedUrl) return url ?? "";
  return data.signedUrl;
}

export async function signMany<T extends Record<string, unknown>>(
  rows: T[],
  keys: (keyof T)[],
): Promise<T[]> {
  return Promise.all(
    rows.map(async (row) => {
      const next: Record<string, unknown> = { ...row };
      for (const k of keys) {
        const v = row[k];
        if (typeof v === "string" && v) next[k as string] = await signStorageUrl(v);
      }
      return next as T;
    }),
  );
}
