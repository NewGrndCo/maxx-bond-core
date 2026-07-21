
-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin', 'editor');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin');
$$;

CREATE POLICY "Users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins read all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.claim_first_admin()
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  admin_exists BOOLEAN;
  uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE role = 'admin') INTO admin_exists;
  IF admin_exists THEN RETURN FALSE; END IF;
  INSERT INTO public.user_roles(user_id, role) VALUES (uid, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  RETURN TRUE;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_first_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_first_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_exists()
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE role = 'admin');
$$;
GRANT EXECUTE ON FUNCTION public.admin_exists() TO anon, authenticated;

-- updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ARTIST PROFILE
CREATE TABLE public.artist_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton BOOLEAN NOT NULL DEFAULT TRUE UNIQUE CHECK (singleton = TRUE),
  artist_name TEXT NOT NULL DEFAULT 'Maxx Bond',
  biography TEXT DEFAULT '',
  management_email TEXT DEFAULT '',
  management_phone TEXT DEFAULT '',
  hero_headline TEXT DEFAULT '',
  hero_subheading TEXT DEFAULT '',
  portrait_url TEXT DEFAULT '',
  hero_artwork_url TEXT DEFAULT '',
  album_cover_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.artist_profile TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.artist_profile TO authenticated;
GRANT ALL ON public.artist_profile TO service_role;
ALTER TABLE public.artist_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads artist profile" ON public.artist_profile FOR SELECT USING (true);
CREATE POLICY "Admins manage artist profile" ON public.artist_profile FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_artist_profile_updated_at BEFORE UPDATE ON public.artist_profile
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
INSERT INTO public.artist_profile(singleton) VALUES (TRUE);

-- SITE SETTINGS
CREATE TABLE public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads site settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage site settings" ON public.site_settings FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_site_settings_updated_at BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- TRACKS
CREATE TABLE public.tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist TEXT DEFAULT '',
  duration_seconds INTEGER DEFAULT 0,
  audio_url TEXT DEFAULT '',
  cover_url TEXT DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tracks TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tracks TO authenticated;
GRANT ALL ON public.tracks TO service_role;
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads published tracks" ON public.tracks FOR SELECT USING (is_published = TRUE);
CREATE POLICY "Admins read all tracks" ON public.tracks FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins manage tracks" ON public.tracks FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_tracks_updated_at BEFORE UPDATE ON public.tracks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- STREAMING LINKS
CREATE TABLE public.streaming_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.streaming_links TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.streaming_links TO authenticated;
GRANT ALL ON public.streaming_links TO service_role;
ALTER TABLE public.streaming_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads visible streaming links" ON public.streaming_links FOR SELECT USING (is_visible = TRUE);
CREATE POLICY "Admins read all streaming links" ON public.streaming_links FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins manage streaming links" ON public.streaming_links FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_streaming_links_updated_at BEFORE UPDATE ON public.streaming_links
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- GALLERY
CREATE TABLE public.gallery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  caption TEXT DEFAULT '',
  alt_text TEXT DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.gallery_items TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.gallery_items TO authenticated;
GRANT ALL ON public.gallery_items TO service_role;
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads visible gallery" ON public.gallery_items FOR SELECT USING (is_visible = TRUE);
CREATE POLICY "Admins read all gallery" ON public.gallery_items FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins manage gallery" ON public.gallery_items FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_gallery_items_updated_at BEFORE UPDATE ON public.gallery_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- EVENTS
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_date DATE NOT NULL,
  city TEXT NOT NULL,
  venue TEXT NOT NULL,
  ticket_url TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.events TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads visible events" ON public.events FOR SELECT USING (is_visible = TRUE);
CREATE POLICY "Admins read all events" ON public.events FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins manage events" ON public.events FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_events_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- MERCH
CREATE TABLE public.merch_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  image_url TEXT DEFAULT '',
  external_url TEXT DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.merch_items TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.merch_items TO authenticated;
GRANT ALL ON public.merch_items TO service_role;
ALTER TABLE public.merch_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads visible merch" ON public.merch_items FOR SELECT USING (is_visible = TRUE);
CREATE POLICY "Admins read all merch" ON public.merch_items FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins manage merch" ON public.merch_items FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_merch_items_updated_at BEFORE UPDATE ON public.merch_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- SITE SECTIONS
CREATE TABLE public.site_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  title TEXT DEFAULT '',
  subtitle TEXT DEFAULT '',
  body TEXT DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_sections TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_sections TO authenticated;
GRANT ALL ON public.site_sections TO service_role;
ALTER TABLE public.site_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads visible sections" ON public.site_sections FOR SELECT USING (is_visible = TRUE);
CREATE POLICY "Admins read all sections" ON public.site_sections FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins manage sections" ON public.site_sections FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_site_sections_updated_at BEFORE UPDATE ON public.site_sections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- LEGAL DOCS
CREATE TABLE public.legal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  body_md TEXT NOT NULL DEFAULT '',
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.legal_documents TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.legal_documents TO authenticated;
GRANT ALL ON public.legal_documents TO service_role;
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads published legal docs" ON public.legal_documents FOR SELECT USING (is_published = TRUE);
CREATE POLICY "Admins read all legal docs" ON public.legal_documents FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins manage legal docs" ON public.legal_documents FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_legal_documents_updated_at BEFORE UPDATE ON public.legal_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- STORAGE OBJECT POLICIES
CREATE POLICY "Public read artist-images" ON storage.objects FOR SELECT USING (bucket_id = 'artist-images');
CREATE POLICY "Public read gallery" ON storage.objects FOR SELECT USING (bucket_id = 'gallery');
CREATE POLICY "Public read merch" ON storage.objects FOR SELECT USING (bucket_id = 'merch');
CREATE POLICY "Public read audio" ON storage.objects FOR SELECT USING (bucket_id = 'audio');

CREATE POLICY "Admins manage artist-images" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'artist-images' AND public.is_admin(auth.uid()))
  WITH CHECK (bucket_id = 'artist-images' AND public.is_admin(auth.uid()));
CREATE POLICY "Admins manage gallery" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'gallery' AND public.is_admin(auth.uid()))
  WITH CHECK (bucket_id = 'gallery' AND public.is_admin(auth.uid()));
CREATE POLICY "Admins manage merch" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'merch' AND public.is_admin(auth.uid()))
  WITH CHECK (bucket_id = 'merch' AND public.is_admin(auth.uid()));
CREATE POLICY "Admins manage audio" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'audio' AND public.is_admin(auth.uid()))
  WITH CHECK (bucket_id = 'audio' AND public.is_admin(auth.uid()));
