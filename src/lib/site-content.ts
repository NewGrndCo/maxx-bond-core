import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { signStorageUrl, signMany } from "@/lib/storage-url";

export type Track = Tables<"tracks">;
export type StreamingLink = Tables<"streaming_links">;
export type GalleryItem = Tables<"gallery_items">;
export type SocialLink = {
  id: string;
  platform: string;
  url: string;
  icon: string;
  display_order: number;
  is_visible: boolean;
};
export type EventItem = Tables<"events">;
export type MerchItem = Tables<"merch_items">;
export type SiteSection = Tables<"site_sections">;
export type LegalDocument = Tables<"legal_documents">;
export type ArtistProfile = Tables<"artist_profile">;
export type SiteSetting = Tables<"site_settings">;

export type SiteContent = {
  profile: ArtistProfile | null;
  tracks: Track[];
  links: StreamingLink[];
  socialLinks: SocialLink[];
  events: EventItem[];
  merch: MerchItem[];
  sections: SiteSection[];
  legal: LegalDocument[];
  settings: SiteSetting[];
};

export async function fetchSiteContent(): Promise<SiteContent> {
  const [profile, tracks, links, socialLinks, events, merch, sections, legal, settings] =
    await Promise.all([
      supabase.from("artist_profile").select("*").limit(1).maybeSingle(),
      supabase.from("tracks").select("*").eq("is_published", true).order("display_order"),
      supabase.from("streaming_links").select("*").eq("is_visible", true).order("display_order"),
      supabase
        .from("social_links" as never)
        .select("*")
        .eq("is_visible", true)
        .order("display_order"),
      supabase.from("events").select("*").eq("is_visible", true).order("event_date"),
      supabase.from("merch_items").select("*").eq("is_visible", true).order("display_order"),
      supabase.from("site_sections").select("*").order("display_order"),
      supabase.from("legal_documents").select("*").eq("is_published", true),
      supabase.from("site_settings").select("*"),
    ]);

  const today = new Date().toISOString().slice(0, 10);
  const orderedEvents = [...(events.data ?? [])].sort((a, b) => {
    const aUpcoming = a.event_date >= today;
    const bUpcoming = b.event_date >= today;
    if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1;
    return aUpcoming
      ? a.event_date.localeCompare(b.event_date)
      : b.event_date.localeCompare(a.event_date);
  });

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
    socialLinks: (socialLinks.data ?? []) as unknown as SocialLink[],
    events: orderedEvents,
    merch: await signMany(merch.data ?? [], ["image_url"]),
    sections: sections.data ?? [],
    legal: legal.data ?? [],
    settings: settings.data ?? [],
  };
}

export function useSiteContent() {
  return useQuery({ queryKey: ["public-site-content"], queryFn: fetchSiteContent });
}
