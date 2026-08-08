-- Production CMS, events, media, and commerce upgrade.
-- Additive by design: existing content and legacy URL columns remain valid.

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  bucket text not null,
  object_path text not null,
  public_url text not null default '',
  label text not null default '',
  alt_text text not null default '',
  mime_type text not null default '',
  size_bytes bigint not null default 0 check (size_bytes >= 0),
  folder text not null default 'general',
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(bucket, object_path)
);
grant select on public.media_assets to anon, authenticated;
grant insert, update, delete on public.media_assets to authenticated;
grant all on public.media_assets to service_role;
alter table public.media_assets enable row level security;
create policy "Public reads published media" on public.media_assets for select using (is_published = true);
create policy "Admins read all media" on public.media_assets for select to authenticated using (public.is_admin((select auth.uid())));
create policy "Admins manage media" on public.media_assets for all to authenticated
  using (public.is_admin((select auth.uid()))) with check (public.is_admin((select auth.uid())));
create trigger trg_media_assets_updated_at before update on public.media_assets
  for each row execute function public.set_updated_at();

create table public.social_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  url text not null,
  icon text not null default '',
  display_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.social_links to anon, authenticated;
grant insert, update, delete on public.social_links to authenticated;
grant all on public.social_links to service_role;
alter table public.social_links enable row level security;
create policy "Public reads visible social links" on public.social_links for select using (is_visible = true);
create policy "Admins read all social links" on public.social_links for select to authenticated using (public.is_admin((select auth.uid())));
create policy "Admins manage social links" on public.social_links for all to authenticated
  using (public.is_admin((select auth.uid()))) with check (public.is_admin((select auth.uid())));
create trigger trg_social_links_updated_at before update on public.social_links
  for each row execute function public.set_updated_at();

alter table public.events
  add column title text not null default '',
  add column slug text,
  add column event_time time,
  add column description text not null default '',
  add column image_url text not null default '',
  add column additional_url text not null default '',
  add column cta_label text not null default 'More Info',
  add column is_published boolean not null default true;
update public.events set title = concat_ws(' — ', nullif(venue, ''), nullif(city, '')) where title = '';
update public.events set slug = lower(trim(both '-' from regexp_replace(title || '-' || id::text, '[^a-zA-Z0-9]+', '-', 'g'))) where slug is null;
alter table public.events alter column slug set not null;
create unique index events_slug_key on public.events(slug);
drop policy "Public reads visible events" on public.events;
create policy "Public reads published events" on public.events for select using (is_visible = true and is_published = true);

alter table public.tracks add column is_featured boolean not null default false;

alter table public.merch_items
  add column slug text,
  add column sku text not null default '',
  add column inventory_quantity integer check (inventory_quantity is null or inventory_quantity >= 0),
  add column track_inventory boolean not null default false,
  add column is_published boolean not null default true;
update public.merch_items set slug = lower(trim(both '-' from regexp_replace(name || '-' || id::text, '[^a-zA-Z0-9]+', '-', 'g'))) where slug is null;
alter table public.merch_items alter column slug set not null;
create unique index merch_items_slug_key on public.merch_items(slug);
drop policy "Public reads visible merch" on public.merch_items;
create policy "Public reads published merch" on public.merch_items for select using (is_visible = true and is_published = true);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.merch_items(id) on delete cascade,
  name text not null,
  sku text not null default '',
  price_cents integer check (price_cents is null or price_cents >= 0),
  inventory_quantity integer check (inventory_quantity is null or inventory_quantity >= 0),
  is_available boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.product_variants to anon, authenticated;
grant insert, update, delete on public.product_variants to authenticated;
grant all on public.product_variants to service_role;
alter table public.product_variants enable row level security;
create policy "Public reads available variants" on public.product_variants for select using (is_available = true);
create policy "Admins read all variants" on public.product_variants for select to authenticated using (public.is_admin((select auth.uid())));
create policy "Admins manage variants" on public.product_variants for all to authenticated
  using (public.is_admin((select auth.uid()))) with check (public.is_admin((select auth.uid())));
create trigger trg_product_variants_updated_at before update on public.product_variants
  for each row execute function public.set_updated_at();

create type public.order_status as enum ('pending', 'paid', 'failed', 'cancelled', 'refunded');
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  status public.order_status not null default 'pending',
  email text not null default '',
  currency text not null default 'USD',
  subtotal_cents integer not null default 0,
  total_cents integer not null default 0,
  customer_details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.orders to service_role;
alter table public.orders enable row level security;
create policy "Admins read orders" on public.orders for select to authenticated using (public.is_admin((select auth.uid())));
create trigger trg_orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.merch_items(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_name text not null,
  variant_name text not null default '',
  sku text not null default '',
  quantity integer not null check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.order_items to service_role;
alter table public.order_items enable row level security;
create policy "Admins read order items" on public.order_items for select to authenticated
  using (public.is_admin((select auth.uid())));

insert into public.site_settings(key, value) values
  ('newsletter', '{"headline":"Stay Connected","body":"Be the first to know about new music, merch drops, tour dates, and exclusive content.","image_url":"","cta_label":"Join the List"}'::jsonb),
  ('background', '{"image_url":"","blur_px":34,"overlay_opacity":0.72}'::jsonb),
  ('commerce', '{"enabled":true,"currency":"USD"}'::jsonb)
on conflict (key) do nothing;
