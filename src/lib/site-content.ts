import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { signStorageUrls } from "@/lib/storage-url";

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

  const profileData = profile.data;
  const trackData = tracks.data ?? [];
  const merchData = merch.data ?? [];
  const settingData = settings.data ?? [];
  const newsletterSetting = settingData.find((item) => item.key === "newsletter");
  const newsletterValue = (newsletterSetting?.value ?? {}) as { image_url?: string };
  const signedUrls = await signStorageUrls([
    profileData?.portrait_url,
    profileData?.hero_artwork_url,
    profileData?.album_cover_url,
    ...trackData.flatMap((track) => [track.audio_url, track.cover_url]),
    ...merchData.map((item) => item.image_url),
    newsletterValue.image_url,
  ]);
  const signed = (url: string | null | undefined) => (url ? (signedUrls.get(url) ?? url) : "");

  return {
    profile: profileData
      ? {
          ...profileData,
          portrait_url: signed(profileData.portrait_url),
          hero_artwork_url: signed(profileData.hero_artwork_url),
          album_cover_url: signed(profileData.album_cover_url),
        }
      : null,
    tracks: trackData.map((track) => ({
      ...track,
      audio_url: signed(track.audio_url),
      cover_url: signed(track.cover_url),
    })),
    links: links.data ?? [],
    socialLinks: (socialLinks.data ?? []) as unknown as SocialLink[],
    events: orderedEvents,
    merch: merchData.map((item) => ({ ...item, image_url: signed(item.image_url) })),
    sections: sections.data ?? [],
    legal: legal.data ?? [],
    settings: settingData.map((item) =>
      item.key === "newsletter" && newsletterValue.image_url
        ? {
            ...item,
            value: { ...newsletterValue, image_url: signed(newsletterValue.image_url) },
          }
        : item,
    ) as SiteSetting[],
  };
}

export const siteContentQueryOptions = () =>
  queryOptions({
    queryKey: ["public-site-content"],
    queryFn: fetchSiteContent,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

export function useSiteContent() {
  return useQuery(siteContentQueryOptions());
}
