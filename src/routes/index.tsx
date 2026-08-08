import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, type ReactNode } from "react";
import { useAudioPlayer } from "@/hooks/use-audio-player";
import { useEscapeKey, useModalLayer } from "@/hooks/use-modal-layer";
import { useRevealOnScroll } from "@/hooks/use-reveal-on-scroll";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { ListenModal } from "@/components/site/listen-modal";
import { LegalModal } from "@/components/site/legal-modal";
import { HeroSection } from "@/components/site/sections/hero-section";
import { StreamingStrip } from "@/components/site/sections/streaming-strip";
import { AboutSection } from "@/components/site/sections/about-section";
import { GallerySection } from "@/components/site/sections/gallery-section";
import { MerchSection } from "@/components/site/sections/merch-section";
import { EventsSection } from "@/components/site/sections/events-section";
import { NewsletterSection } from "@/components/site/sections/newsletter-section";
import { SECTION_KEYS, type SectionKey } from "@/lib/site-constants";
import { useSiteContent } from "@/lib/site-content";

const TITLE = "Maxx Bond — Official Site | Music, Merch & Tour Dates";
const DESCRIPTION =
  "Stream Maxx Bond's music, shop official merch, and catch upcoming tour dates. Uniondale raised, world focused.";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function Index() {
  const { data } = useSiteContent();
  const [modalOpen, setModalOpen] = useState(false);
  const [legalSlug, setLegalSlug] = useState<string | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [liked, setLiked] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const player = useAudioPlayer(data?.tracks ?? []);
  const profile = data?.profile;
  const links = data?.links ?? [];

  useModalLayer(modalOpen || Boolean(legalSlug), closeBtnRef);
  useEscapeKey(() => {
    setModalOpen(false);
    setLegalSlug(null);
  });
  useRevealOnScroll(rootRef, data);

  const sectionConfig = (key: SectionKey) =>
    data?.sections.find((s) => s.key === key) ?? {
      key,
      is_visible: true,
      display_order: SECTION_KEYS.indexOf(key),
    };

  const nodes: Record<SectionKey, ReactNode> = {
    hero: (
      <HeroSection
        profile={profile}
        player={player}
        liked={liked}
        onToggleLike={() => setLiked((v) => !v)}
        onOpenListen={() => setModalOpen(true)}
      />
    ),
    streaming: <StreamingStrip links={links} />,
    about: <AboutSection profile={profile} links={links} />,
    gallery: <GallerySection gallery={data?.gallery ?? []} />,
    merch: <MerchSection merch={data?.merch ?? []} />,
    events: <EventsSection events={data?.events ?? []} />,
    newsletter: <NewsletterSection />,
  };

  const sections = SECTION_KEYS.filter((key) => sectionConfig(key).is_visible)
    .slice()
    .sort((a, b) => sectionConfig(a).display_order - sectionConfig(b).display_order)
    .map((key) => <div key={key} style={{ display: "contents" }}>{nodes[key]}</div>);

  return (
    <div ref={rootRef}>
      <div className="noise" aria-hidden="true" />
      <SiteHeader
        navOpen={navOpen}
        onToggleNav={() => setNavOpen((v) => !v)}
        onCloseNav={() => setNavOpen(false)}
      />
      <main className="managed-main">{sections}</main>
      <SiteFooter profile={profile} onOpenLegal={setLegalSlug} />
      <ListenModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        closeRef={closeBtnRef}
        links={links}
        activeTrack={player.activeTrack}
        profile={profile}
      />
      <LegalModal
        slug={legalSlug}
        doc={data?.legal.find((doc) => doc.slug === legalSlug)}
        onClose={() => setLegalSlug(null)}
      />
    </div>
  );
}
