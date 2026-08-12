import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useRef, useState, type ReactNode } from "react";
import { useAudioPlayer } from "@/hooks/use-audio-player";
import { useEscapeKey, useModalLayer } from "@/hooks/use-modal-layer";
import { useRevealOnScroll } from "@/hooks/use-reveal-on-scroll";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { ListenModal } from "@/components/site/listen-modal";
import { LegalModal } from "@/components/site/legal-modal";
import { HeroSection } from "@/components/site/sections/hero-section";
import { AboutSection } from "@/components/site/sections/about-section";
import { MerchSection } from "@/components/site/sections/merch-section";
import { EventsSection } from "@/components/site/sections/events-section";
import { NewsletterSection } from "@/components/site/sections/newsletter-section";
import { SECTION_KEYS, type SectionKey } from "@/lib/site-constants";
import { siteContentQueryOptions, useSiteContent, type SiteContent } from "@/lib/site-content";

const TITLE = "Maxx Bond — Official Site | Music, Merch & Tour Dates";
const DESCRIPTION =
  "Stream Maxx Bond's music, shop official merch, and catch upcoming tour dates. Uniondale raised, world focused.";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(siteContentQueryOptions()),
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
  const { data, error, refetch } = useSiteContent();

  if (error) {
    return (
      <main className="site-startup site-startup-error">
        <p className="site-startup-kicker">Maxx Bond</p>
        <h1>We couldn&apos;t load the site.</h1>
        <button type="button" className="listen-button" onClick={() => void refetch()}>
          Try again
        </button>
      </main>
    );
  }

  if (!data) return <SiteStartup />;

  return <LoadedHomepage data={data} />;
}

function SiteStartup() {
  return (
    <main className="site-startup" aria-label="Loading Maxx Bond official site" aria-busy="true">
      <div className="site-startup-mark" aria-hidden="true">
        MB
      </div>
      <p>Maxx Bond</p>
    </main>
  );
}

function LoadedHomepage({ data }: { data: SiteContent }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [legalSlug, setLegalSlug] = useState<string | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [liked, setLiked] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const musicSettings = (data.settings.find((item) => item.key === "music_player")?.value ??
    {}) as {
    autoplay?: boolean;
  };
  const player = useAudioPlayer(data.tracks, musicSettings.autoplay ?? true);
  const profile = data.profile;
  const links = data.links;
  const newsletter = (data.settings.find((item) => item.key === "newsletter")?.value ?? {}) as {
    headline?: string;
    body?: string;
    image_url?: string;
    cta_label?: string;
  };

  useModalLayer(modalOpen || Boolean(legalSlug), closeBtnRef);
  useEscapeKey(() => {
    setModalOpen(false);
    setLegalSlug(null);
  });
  useRevealOnScroll(rootRef, true);

  const sectionConfig = (key: SectionKey) =>
    data.sections.find((s) => s.key === key) ?? {
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
    about: <AboutSection profile={profile} links={data.socialLinks} />,
    merch: <MerchSection merch={data.merch} />,
    events: <EventsSection events={data.events} />,
    newsletter: <NewsletterSection content={newsletter} />,
  };

  const sections = SECTION_KEYS.filter((key) => sectionConfig(key).is_visible)
    .slice()
    .sort((a, b) => sectionConfig(a).display_order - sectionConfig(b).display_order)
    .map((key) => <Fragment key={key}>{nodes[key]}</Fragment>);

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
        doc={data.legal.find((doc) => doc.slug === legalSlug)}
        onClose={() => setLegalSlug(null)}
      />
    </div>
  );
}
