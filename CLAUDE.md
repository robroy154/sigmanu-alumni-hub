# CLAUDE.md — Sigma Nu Mu Xi Alumni Hub

This file is read automatically by Claude Code at the start of every session.
Full architecture details are in `docs/ARCHITECTURE.md`. Read that file before writing any code.

---

## Project Identity

**Sigma Nu Fraternity, Mu Xi Chapter — Columbus State University**
Production web application. Not a prototype. Code must be production-quality.

---

## Locked Stack

| Layer | Decision |
|---|---|
| Framework | Next.js 14+ — App Router, TypeScript strict mode |
| Database | Supabase (managed PostgreSQL) |
| Auth | Supabase Auth — email/password + Google, Facebook, Apple OAuth |
| Storage | Supabase Storage (profile photos) |
| Family Tree | React Flow |
| Payments | Stripe |
| Hosting | Vercel |
| Styling | Tailwind CSS + shadcn/ui |

Do not suggest alternatives to any of these without flagging it explicitly.

---

## Key Data Model Facts

- `members` table has a `big_id` nullable self-referencing FK — this drives the entire family tree
- `members.status` enum: `pending` | `member` | `admin` — default is `pending`
- `members.pledge_class` is a text field selected from a generated ordered enum (Alpha → Omega, then Beta Alpha → Omega Omega, 600 total). No year field. Names never repeat.
- `registrations.member_id` is nullable — pending users can register before approval
- `registrations.payment_status` enum: `unpaid` | `paid` | `refunded`
- `registration_guests` is a separate table — not a comma-separated text field on registrations
- `badges` table is admin-assigned only — members cannot assign their own badges
- `members.pin_number` is unique (DB constraint), set once by the member, editable by admins only afterward. Visible to all authenticated users.
- See `docs/ARCHITECTURE.md` Section 3 for full column definitions and query patterns

---

## Access Control

| Status | Access |
|---|---|
| Public (unauthenticated) | Event landing page only |
| `pending` | Event registration form and confirmation only |
| `member` | Full access — directory, family tree, profiles, registration |
| `admin` | Everything + admin panel |

- Enforce in Next.js middleware — never client-side only
- See `docs/ARCHITECTURE.md` Section 4 for full details

---

## Code Standards

- TypeScript strict mode throughout. No `any` types.
- All Supabase queries through typed client. No raw SQL strings in components.
- Auth checks enforced in middleware, not just on the client.
- No TODO stubs in shipped code. No shortcuts.
- Every API route validates the caller's session and status before doing anything.

---

## Branding

- Sigma Nu Navy: `#1B2A47`
- Sigma Nu Gold: `#C9A84C`
- Tailwind tokens: `sn-navy`, `sn-navy-dark`, `sn-gold`, `sn-gold-light`
- shadcn/ui as base component library with Sigma Nu theming on top
- Must not look like a generic template

---

## Current Build Phase

> **Update this section at the start of each session to reflect where you are.**

All 10 phases complete. Build clean at 20 routes.

Last completed: Phase 10 — Polish + OAuth. See memory file for full phase history.

Completed phases summary:
- Phase 1–2: Scaffold, Supabase schema/RLS/storage
- Phase 3: Auth (email/password, OAuth callback, pending enforcement)
- Phase 4: Member profiles (view/edit, photo upload, one-time pin)
- Phase 5: Event registration + Stripe checkout/webhook
- Phase 6: Admin panel (members, registrations, badges, CSV export)
- Big Brother selector added: members set own big_id freely (circular ref guard)
- Phase 7: Brother directory (search name/nickname/pin, pledge class filter)
- Phase 8: Family tree (React Flow + dagre, node selection/lineage highlight, search-to-fly)
- Demo seed: 50 members via `npm run seed:demo`
- Phase 9: Email notifications via Resend (welcome, registration confirm, admin alert)
- Phase 10: Google OAuth button, custom 404, profile completeness nudge, Big/Littles on profiles

Key runtime decisions:
- Next.js 16.2.2 (not 14) — uses proxy.ts not middleware.ts, export named `proxy`
- Tailwind v4 CSS-based config — @theme inline {} in globals.css
- shadcn base-nova uses @base-ui/react — no Radix asChild, no form.tsx wrapper
- exactOptionalPropertyTypes: true — optional props need explicit `| undefined`
- Stripe API version: "2026-03-25.dahlia" (stripe npm v22)
- pin_number: set once by member (admin client action), unique DB constraint
- Profile photos: stored as path in members.profile_photo_url, signed URLs (1hr) server-side
- proxy.ts PUBLIC_ROUTES: ["/", "/auth/callback", "/api/stripe"]
- Email: RESEND_API_KEY required; RESEND_FROM_EMAIL optional (defaults to onboarding@resend.dev)
- Google OAuth: on by default; Facebook/Apple need NEXT_PUBLIC_*_OAUTH_ENABLED=true

---

## Full Reference

All schema tables, query patterns, Stripe flow, build order, hosting details, and decision log are in:
**`docs/ARCHITECTURE.md`**

Read it before writing anything structural.
