import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { signStorageUrl, signMany } from "@/lib/storage-url";

export type Track = Tables<"tracks">;
export type StreamingLink = Tables<"streaming_links">;
export type GalleryItem = Tables<"gallery_items">;
export type EventItem = Tables<"events">;
export type MerchItem = Tables<"merch_items">;
export type SiteSection = Tables<"site_sections">;
export type LegalDocument = Tables<"legal_documents">;
export type ArtistProfile = Tables<"artist_profile">;

export type SiteContent = {
  profile: ArtistProfile | null;
  tracks: Track[];
  links: StreamingLink[];
  gallery: GalleryItem[];
  events: EventItem[];
  merch: MerchItem[];
  sections: SiteSection[];
  legal: LegalDocument[];
};

export async function fetchSiteContent(): Promise<SiteContent> {
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

  return {
    profile: profile.data
      ? {
          ...profile.data,
          portrait_url: await signStorageUrl(profile.data.portrait_url),
          hero_artwork_url: await signStorageUrl(profile.data.hero_artwork_url),
          album_cover_url: await signStorageUrl(profile.data.album_cover_url),
        }
      : null,
    tracks: await signMany(tracks.data ?? [], ["audio_url", "cover_url"]),
    links: links.data ?? [],
    gallery: await signMany(gallery.data ?? [], ["image_url"]),
    events: events.data ?? [],
    merch: await signMany(merch.data ?? [], ["image_url"]),
    sections: sections.data ?? [],
    legal: legal.data ?? [],
  };
}

export function useSiteContent() {
  return useQuery({ queryKey: ["public-site-content"], queryFn: fetchSiteContent });
}
