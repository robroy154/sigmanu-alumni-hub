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

Phase: 4 — Member profiles complete
Last completed: Profile view (`/profile`), profile edit (`/profile/edit`) with photo upload to Supabase Storage, one-time pin number setter (admin-client backed, DB unique constraint), view-other-member page (`/profile/[id]`), member layout with sign-out + admin link. DB migration 20260405000001 applied (UNIQUE on pin_number, SELECT re-granted to authenticated). OAuth providers (Google/Facebook/Apple) deferred to end of project.
Next task: Phase 5 — Event registration (public event landing, registration form for pending+member users, Stripe payment, confirmation page)

---

## Full Reference

All schema tables, query patterns, Stripe flow, build order, hosting details, and decision log are in:
**`docs/ARCHITECTURE.md`**

Read it before writing anything structural.
