import Stripe from "stripe";

// Server-only Stripe client. Never import this in client components.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-06-24.dahlia",
  typescript: true,
});
