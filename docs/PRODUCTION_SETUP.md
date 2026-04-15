# Production Setup Guide

Complete checklist for deploying the Sigma Nu Mu Xi Alumni Hub to production.

---

## 1. Environment Variables

Set all of the following in Vercel → Project Settings → Environment Variables.

### Required

| Variable | Description | Where to get it |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-only) | Supabase → Project Settings → API |
| `STRIPE_SECRET_KEY` | Stripe live secret key (`sk_live_…`) | Stripe Dashboard → Developers → API keys |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe live publishable key (`pk_live_…`) | Stripe Dashboard → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (`whsec_…`) | Stripe Dashboard → Webhooks → endpoint detail |
| `RESEND_API_KEY` | Resend API key | Resend Dashboard → API Keys |
| `NEXT_PUBLIC_APP_URL` | Production URL, no trailing slash | e.g. `https://alumni.csusigmanu.com` |

### Recommended

| Variable | Description |
|---|---|
| `RESEND_FROM_EMAIL` | From address for transactional emails. Must be on a verified Resend domain. Defaults to `onboarding@resend.dev` (Resend sandbox — limited to verified addresses only). |
| `CHAPTER_CONTACT_EMAIL` | Shown on expired/invalid invite error pages. e.g. `info@csusigmanu.com` |
| `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` | Google Places API key for address autocomplete. Degrades to plain text input without it. |

### Optional (OAuth / Social)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED` | Not used — Google OAuth is always enabled (no flag). Set up in Supabase directly. |
| `NEXT_PUBLIC_FB_OAUTH_ENABLED` | Set to `true` to show Facebook login button |
| `NEXT_PUBLIC_APPLE_OAUTH_ENABLED` | Set to `true` to show Apple login button |
| `NEXT_PUBLIC_ALUMNI_FB_URL` | Alumni Facebook group URL — shown as Quick Link on /home |
| `NEXT_PUBLIC_ACTIVE_CHAPTER_FB_URL` | Active chapter Facebook group URL — shown as Quick Link on /home |

---

## 2. Supabase Setup

### 2.1 Run Migrations

Apply all migrations in order from `supabase/migrations/`. In the Supabase SQL Editor, run each file top-to-bottom, or use the Supabase CLI:

```bash
supabase db push
```

### 2.2 Enable Email Auth

Supabase Dashboard → Authentication → Providers → Email:
- Enable email/password sign-in
- Set **Site URL** to your production URL (e.g. `https://alumni.csusigmanu.com`)
- Add the same URL under **Redirect URLs**
- Also add `https://alumni.csusigmanu.com/auth/callback` as an allowed redirect URL

### 2.3 Configure SMTP (Transactional Emails from Supabase Auth)

Supabase uses its own SMTP for auth emails (confirm email, password reset). To avoid deliverability issues, configure a custom SMTP provider:

Supabase Dashboard → Project Settings → Authentication → SMTP Settings:

| Field | Value |
|---|---|
| Host | Your SMTP host (e.g. `smtp.resend.com`) |
| Port | `465` (SSL) or `587` (TLS) |
| Username | `resend` (for Resend SMTP) |
| Password | Your Resend API key |
| Sender name | `Sigma Nu Mu Xi` |
| Sender email | A verified address on your domain |

For Resend SMTP specifically, use `smtp.resend.com:465` with username `resend` and your API key as the password.

> Note: Application emails (welcome, registration confirmation, announcements) are sent via the Resend SDK, not Supabase SMTP. Only auth system emails (confirm account, reset password) go through Supabase SMTP.

### 2.4 Google OAuth

Supabase Dashboard → Authentication → Providers → Google:
1. Enable Google provider
2. Create OAuth credentials at [console.cloud.google.com](https://console.cloud.google.com):
   - Authorized JavaScript origins: `https://alumni.csusigmanu.com`
   - Authorized redirect URIs: `https://<your-supabase-project-ref>.supabase.co/auth/v1/callback`
3. Paste Client ID and Client Secret into Supabase

### 2.5 Facebook OAuth (optional)

Supabase Dashboard → Authentication → Providers → Facebook:
1. Create a Facebook App at developers.facebook.com
2. Add Facebook Login product; set OAuth redirect URI to `https://<project-ref>.supabase.co/auth/v1/callback`
3. Paste App ID and App Secret into Supabase
4. Set `NEXT_PUBLIC_FB_OAUTH_ENABLED=true` in Vercel

### 2.6 Token Expiry Maintenance (pg_cron)

Expired referral tokens are marked via a nightly pg_cron job. Set this up once in the Supabase SQL Editor:

```sql
-- Enable pg_cron extension (if not already enabled)
create extension if not exists pg_cron;

-- Nightly job to expire overdue pending referrals
select cron.schedule(
  'expire-referrals',
  '0 3 * * *',
  $$
    update public.referrals
    set status = 'expired'
    where status = 'pending'
      and expires_at < now();
  $$
);
```

---

## 3. Stripe Setup

### 3.1 Create a Webhook Endpoint

Stripe Dashboard → Developers → Webhooks → Add endpoint:

- **Endpoint URL:** `https://alumni.csusigmanu.com/api/stripe/webhook`
- **Events to listen for:** `checkout.session.completed`

Copy the signing secret (`whsec_…`) and set it as `STRIPE_WEBHOOK_SECRET` in Vercel.

### 3.2 Live vs Test Keys

The app uses `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`. In production these must be live keys (`sk_live_…` / `pk_live_…`). Never commit keys to source control.

### 3.3 Testing Payments Locally

For local development, use test keys and run the Stripe CLI to forward webhook events:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

The CLI prints a webhook secret for local use — set it as `STRIPE_WEBHOOK_SECRET` in your `.env.local` (do not use the live webhook secret locally).

---

## 4. Resend (Email)

### 4.1 Domain Verification

Resend Dashboard → Domains → Add Domain:
1. Add your sending domain (e.g. `csusigmanu.com`)
2. Add the DNS records Resend provides (MX, SPF, DKIM) at your DNS registrar
3. Wait for verification (usually a few minutes)

### 4.2 From Address

Set `RESEND_FROM_EMAIL` to an address on your verified domain, e.g. `noreply@csusigmanu.com` or `info@csusigmanu.com`.

If `RESEND_FROM_EMAIL` is unset, the app defaults to `onboarding@resend.dev` — this is Resend's sandbox address and can only send to addresses you have verified in Resend. Set a real address for production.

### 4.3 API Key

Resend Dashboard → API Keys → Create API Key. Grant **Full access** or at minimum **Sending access**. Set as `RESEND_API_KEY` in Vercel.

---

## 5. Google Places API (Address Autocomplete)

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Enable the **Places API (New)** for your project
3. Create an API key and restrict it:
   - Application restriction: **HTTP referrers**
   - Allowed referrers: `https://alumni.csusigmanu.com/*`
4. Set as `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` in Vercel

Without this key the address field degrades to a plain text input — the app functions normally.

---

## 6. Vercel Deployment

### 6.1 Initial Deploy

```bash
vercel --prod
```

Or connect your GitHub repo to Vercel for automatic deploys on push to `main`.

### 6.2 Build Settings

Vercel should auto-detect Next.js. Verify:
- **Framework preset:** Next.js
- **Build command:** `next build`
- **Output directory:** `.next`
- **Node.js version:** 20.x

### 6.3 First Admin Account

After deploying:
1. Sign up at `https://alumni.csusigmanu.com/signup`
2. In Supabase SQL Editor, manually set your account to admin:
   ```sql
   update public.members set status = 'admin' where email = 'your@email.com';
   ```
3. Log in — you now have access to `/admin`

All subsequent members join via referral links sent from the admin panel.

---

## 7. Pre-Launch Checklist

- [ ] All required environment variables set in Vercel
- [ ] Supabase migrations applied (check tables exist in Table Editor)
- [ ] Supabase Site URL and Redirect URLs set to production URL
- [ ] Supabase SMTP configured (password reset and confirm emails work)
- [ ] Google OAuth redirect URI updated to production Supabase callback URL
- [ ] Stripe live webhook endpoint created and `STRIPE_WEBHOOK_SECRET` updated
- [ ] Resend domain verified and `RESEND_FROM_EMAIL` set
- [ ] pg_cron job scheduled for referral expiry
- [ ] First admin account promoted via SQL
- [ ] Send a test referral invite and complete the sign-up flow end-to-end
- [ ] Register for a paid test event and confirm Stripe checkout + webhook fires
- [ ] Verify confirmation email arrives after registration
- [ ] Verify welcome email arrives after admin approval
