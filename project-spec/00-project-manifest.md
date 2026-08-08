# Maxx Bond Core production upgrade

- State: validated
- Mode: product
- Vertical: artist / direct-to-fan commerce
- Current phase: implementation
- Capabilities: public music player, events, CMS, media library, merchandise, cart, Stripe Checkout
- Preserved systems: TanStack Start/Router, React Query, Supabase Auth/Postgres/Storage, existing visual identity and content tables
- Last baseline build: passing (2026-08-08)
- Baseline lint: blocked by repository-wide CRLF/Prettier mismatch (8,711 existing formatting errors)
- Next action: additive schema, public routes, secure checkout functions, CMS extensions

## Scope

V1 includes every capability in the supplied CMS, media, events, music, and commerce brief. Existing Gallery records and storage are retained for migration/reuse, while Gallery UI and navigation are removed. Customer accounts, fulfillment automation, tax automation, and a generic page builder are out of scope.

## Architecture decisions

1. Existing tables remain authoritative and receive additive columns; no existing data is deleted.
2. `display_order` remains the persistent manual ordering contract for tracks and products.
3. Events and products receive stable unique slugs and dedicated routes.
4. Social profiles use `social_links`; DSP destinations remain in `streaming_links`.
5. `media_assets` indexes Supabase Storage objects and is the CMS picker source. Existing URL columns remain compatible during gradual migration.
6. Cart state is client-side and persisted locally. Product prices and availability are re-read server-side before Stripe Checkout creation.
7. Stripe secret and webhook signing keys exist only in Supabase Edge Function secrets. Webhooks are signature-verified and update server-owned orders.
8. Product and order snapshots preserve purchase-time names, variants, SKUs, quantities, and prices.

## Assumptions and blockers

- A-001: Physical merchandise uses one-time Stripe Checkout payments in USD. Confidence medium; reversible.
- A-002: Guest checkout is appropriate for the artist store. Confidence high; reversible.
- A-003: Shipping/tax behavior will be configured in Stripe rather than fabricated in code. Confidence high.
- B-001: Live Stripe checkout cannot be production-verified until `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `SITE_URL` are configured and the Edge Functions are deployed.
- B-002: Remote schema migration cannot be applied or queried until this checkout is linked/authenticated to its Supabase project.

## Acceptance criteria

- Given published tracks, when an admin drags a track, then the saved order controls the public player.
- Given browser autoplay denial, when the homepage loads, then no error UI appears and the player remains ready.
- Given published events, when a visitor opens an event, then its slug route renders CMS-managed details and CTAs.
- Given purchasable products, when a visitor checks out, then Stripe receives server-validated line items and redirects to success or cancellation state.
- Given a referenced media asset, when an admin attempts deletion, then usage is surfaced and destructive removal requires explicit confirmation.
- Given mobile viewport widths, when visitor and admin flows are used, then navigation, forms, player, event, product, and cart controls remain operable.

## Verification plan

Build, type-check through production compilation, focused lint on changed files, route smoke tests, database migration review/advisors when linked, keyboard and reduced-motion checks, responsive browser checks, and Stripe test-mode checkout/webhook verification after credentials are configured.
