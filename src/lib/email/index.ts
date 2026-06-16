"use server";

/**
 * Email sending module — wraps Resend.
 * Templates are built with React Email (@react-email/components).
 * render() is called with React.createElement() so this file can stay .ts.
 *
 * Required env vars:
 *   RESEND_API_KEY       — from resend.com dashboard
 *   RESEND_FROM_EMAIL    — verified sender (e.g. "noreply@yourdomain.com")
 *
 * All send functions are fire-and-forget: they log errors but never throw,
 * so a failed email never blocks the primary operation.
 */

import * as React from "react";
import { Resend } from "resend";
// Explicit top-level import — three versions of @react-email/render exist in the
// dep tree (v2.0.8, v2.0.6, v1.1.2). Always resolve from the top-level package.
import { render } from "@react-email/render";
import { serializeRichTextToEmail } from "./serialize-rich-text";

// Template components
import { WelcomeEmail } from "./templates/WelcomeEmail";
import { RegistrationConfirmationEmail } from "./templates/RegistrationConfirmationEmail";
import { AdminNewMemberAlert } from "./templates/AdminNewMemberAlert";
import { PendingConfirmationEmail } from "./templates/PendingConfirmationEmail";
import { AnnouncementEmail } from "./templates/AnnouncementEmail";
import { ReferralInviteEmail } from "./templates/ReferralInviteEmail";
import { ReferralSentEmail } from "./templates/ReferralSentEmail";
import { ReferralCompletedEmail } from "./templates/ReferralCompletedEmail";
import { BigBrotherNotificationEmail } from "./templates/BigBrotherNotificationEmail";
import { LittleBrotherNotificationEmail } from "./templates/LittleBrotherNotificationEmail";
import { WaitlistPromotionEmail } from "./templates/WaitlistPromotionEmail";
import { RefundConfirmationEmail } from "./templates/RefundConfirmationEmail";
import { RefundProcessedAdminAlert } from "./templates/RefundProcessedAdminAlert";

// ---------------------------------------------------------------------------
// Resend client
// ---------------------------------------------------------------------------

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (key === undefined || key === "") {
    console.warn("[email] RESEND_API_KEY not set — emails disabled.");
    return null;
  }
  return new Resend(key);
}

const SENDER_NAME  = "Mu Xi Chapter of Sigma Nu Fraternity";
const SENDER_EMAIL =
  process.env.RESEND_FROM_EMAIL !== undefined && process.env.RESEND_FROM_EMAIL !== ""
    ? process.env.RESEND_FROM_EMAIL
    : "onboarding@resend.dev";

// ---------------------------------------------------------------------------
// 1. Welcome email — sent when admin approves a member
// ---------------------------------------------------------------------------

export async function sendWelcomeEmail({
  to,
  firstName,
}: {
  to:        string;
  firstName: string;
}): Promise<void> {
  const resend = getResend();
  if (resend === null) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const html = await render(React.createElement(WelcomeEmail, { firstName, appUrl }));
    await resend.emails.send({
      from:    `${SENDER_NAME} <${SENDER_EMAIL}>`,
      to,
      subject: "You're approved — Welcome to the Mu Xi Alumni Hub",
      html,
    });
  } catch (err) {
    console.error("[email] sendWelcomeEmail threw:", err);
  }
}

// ---------------------------------------------------------------------------
// 2. Registration confirmation — sent after Stripe payment confirmed
// ---------------------------------------------------------------------------

export async function sendRegistrationConfirmation({
  to,
  name,
  eventTitle,
  eventDate,
  eventLocation,
  guestCount,
  totalPaid,
}: {
  to:            string;
  name:          string;
  eventTitle:    string;
  eventDate:     string;
  eventLocation: string | null;
  guestCount:    number;
  totalPaid:     number;
}): Promise<void> {
  const resend = getResend();
  if (resend === null) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const html = await render(
      React.createElement(RegistrationConfirmationEmail, {
        name,
        eventTitle,
        eventDate,
        eventLocation,
        guestCount,
        totalPaid,
        appUrl,
      }),
    );
    await resend.emails.send({
      from:    `${SENDER_NAME} <${SENDER_EMAIL}>`,
      to,
      subject: `Registration confirmed — ${eventTitle}`,
      html,
    });
  } catch (err) {
    console.error("[email] sendRegistrationConfirmation threw:", err);
  }
}

// ---------------------------------------------------------------------------
// 3. New member alert — sent to all admins when someone signs up
// ---------------------------------------------------------------------------

export async function notifyAdminsNewMember(member?: {
  firstName: string;
  lastName:  string;
  email:     string;
}): Promise<void> {
  const resend = getResend();
  if (resend === null) return;

  const { createAdminClient } = await import("@/lib/supabase/admin");

  let resolvedMember: { first_name: string; last_name: string; email: string };

  if (member !== undefined) {
    resolvedMember = {
      first_name: member.firstName,
      last_name:  member.lastName,
      email:      member.email,
    };
  } else {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user === null) return;

    const adminDb = createAdminClient();
    const { data: fetched } = await adminDb
      .from("members")
      .select("first_name, last_name, email")
      .eq("id", user.id)
      .single();
    if (fetched === null) return;
    resolvedMember = fetched;
  }

  const adminDb   = createAdminClient();
  const { data: admins } = await adminDb
    .from("members")
    .select("email")
    .eq("status", "admin");

  const adminEmails = (admins ?? []).map((a) => a.email);
  if (adminEmails.length === 0) {
    console.warn("[email] notifyAdminsNewMember: no admin accounts found to notify.");
    return;
  }

  const appUrl   = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const fullName = `${resolvedMember.first_name} ${resolvedMember.last_name}`;

  try {
    const html = await render(
      React.createElement(AdminNewMemberAlert, {
        fullName,
        email: resolvedMember.email,
        appUrl,
      }),
    );
    await resend.emails.send({
      from:    `${SENDER_NAME} <${SENDER_EMAIL}>`,
      to:      adminEmails,
      subject: `New member signup — ${fullName}`,
      html,
    });
  } catch (err) {
    console.error("[email] notifyAdminsNewMember threw:", err);
  }
}

// ---------------------------------------------------------------------------
// 4. Pending confirmation — sent to member immediately after signup
// ---------------------------------------------------------------------------

export async function sendPendingConfirmation({
  to,
  firstName,
}: {
  to:        string;
  firstName: string;
}): Promise<void> {
  const resend = getResend();
  if (resend === null) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const html = await render(React.createElement(PendingConfirmationEmail, { firstName, appUrl }));
    await resend.emails.send({
      from:    `${SENDER_NAME} <${SENDER_EMAIL}>`,
      to,
      subject: "Your Sigma Nu Mu Xi account is pending approval",
      html,
    });
  } catch (err) {
    console.error("[email] sendPendingConfirmation threw:", err);
  }
}

// ---------------------------------------------------------------------------
// 5. Announcement notification — sent to all members when admin posts
// Uses resend.batch.send() in chunks of 100, with exponential backoff on 429.
// ---------------------------------------------------------------------------

async function batchSendWithRetry(
  resend: Resend,
  batch: { from: string; to: string; subject: string; html: string }[],
  maxRetries = 3,
): Promise<void> {
  let delay = 1000; // ms
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await resend.batch.send(batch);
      if ("error" in result && result.error !== null) {
        // Type guard: error object may have a statusCode
        const status = (result.error as Record<string, unknown>).statusCode as number | undefined;
        if (status === 429 && attempt < maxRetries - 1) {
          console.warn(`[email] batch 429 — retrying in ${delay}ms`);
          await new Promise((r) => setTimeout(r, delay));
          delay *= 2;
          continue;
        }
        console.error("[email] batch send error:", result.error);
      }
      return;
    } catch (err) {
      if (attempt < maxRetries - 1) {
        console.warn(`[email] batch threw (attempt ${attempt + 1}) — retrying in ${delay}ms:`, err);
        await new Promise((r) => setTimeout(r, delay));
        delay *= 2;
      } else {
        console.error("[email] batch send threw after all retries:", err);
      }
    }
  }
}

export async function sendAnnouncementNotification({
  title,
  body: announcementBody,
  memberEmails,
}: {
  title:        string;
  body:         string;
  memberEmails: string[];
}): Promise<void> {
  const resend = getResend();
  if (resend === null) return;

  if (memberEmails.length === 0) return;

  const appUrl         = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const serializedBody = serializeRichTextToEmail(announcementBody);

  let html: string;
  try {
    html = await render(
      React.createElement(AnnouncementEmail, { title, serializedBody, appUrl }),
    );
  } catch (err) {
    console.error("[email] sendAnnouncementNotification render threw:", err);
    return;
  }

  const from    = `${SENDER_NAME} <${SENDER_EMAIL}>`;
  const subject = `New announcement: ${title}`;

  // Process in chunks of 100 — Resend batch limit per request.
  const CHUNK = 100;
  for (let i = 0; i < memberEmails.length; i += CHUNK) {
    const chunk = memberEmails.slice(i, i + CHUNK);
    const batch = chunk.map((to) => ({ from, to, subject, html }));
    await batchSendWithRetry(resend, batch);
  }
}

// ---------------------------------------------------------------------------
// 6. Referral invite — sent to the person being invited
// ---------------------------------------------------------------------------

export async function sendReferralInvite({
  to,
  referrerFullName,
  inviteeFirstName,
  token,
}: {
  to:               string;
  referrerFullName: string;
  inviteeFirstName: string;
  token:            string;
}): Promise<void> {
  const resend = getResend();
  if (resend === null) return;

  const appUrl    = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const inviteUrl = `${appUrl}/join?token=${token}`;

  try {
    const html = await render(
      React.createElement(ReferralInviteEmail, { inviteeFirstName, referrerFullName, inviteUrl }),
    );
    await resend.emails.send({
      from:    `${SENDER_NAME} <${SENDER_EMAIL}>`,
      to,
      subject: "You're invited to join the Sigma Nu Mu Xi Alumni Hub",
      html,
    });
  } catch (err) {
    console.error("[email] sendReferralInvite threw:", err);
  }
}

// ---------------------------------------------------------------------------
// 7. Referral sent confirmation — sent to the referring member
// ---------------------------------------------------------------------------

export async function sendReferralSentConfirmation({
  to,
  referrerFirstName,
  inviteeFirstName,
  inviteeLastName,
}: {
  to:                string;
  referrerFirstName: string;
  inviteeFirstName:  string;
  inviteeLastName:   string;
}): Promise<void> {
  const resend = getResend();
  if (resend === null) return;

  try {
    const html = await render(
      React.createElement(ReferralSentEmail, { referrerFirstName, inviteeFirstName, inviteeLastName }),
    );
    await resend.emails.send({
      from:    `${SENDER_NAME} <${SENDER_EMAIL}>`,
      to,
      subject: `Your invite to ${inviteeFirstName} has been sent`,
      html,
    });
  } catch (err) {
    console.error("[email] sendReferralSentConfirmation threw:", err);
  }
}

// ---------------------------------------------------------------------------
// 8. Referral completed — sent to the referring member when invitee joins
// ---------------------------------------------------------------------------

export async function sendReferralCompleted({
  to,
  referrerFirstName,
  inviteeFirstName,
  inviteeLastName,
}: {
  to:                string;
  referrerFirstName: string;
  inviteeFirstName:  string;
  inviteeLastName:   string;
}): Promise<void> {
  const resend = getResend();
  if (resend === null) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const html = await render(
      React.createElement(ReferralCompletedEmail, {
        referrerFirstName,
        inviteeFirstName,
        inviteeLastName,
        appUrl,
      }),
    );
    await resend.emails.send({
      from:    `${SENDER_NAME} <${SENDER_EMAIL}>`,
      to,
      subject: `${inviteeFirstName} ${inviteeLastName} just joined!`,
      html,
    });
  } catch (err) {
    console.error("[email] sendReferralCompleted threw:", err);
  }
}

// ---------------------------------------------------------------------------
// 9. Big brother updated — sent to all admins when a member sets/clears their big
// ---------------------------------------------------------------------------

export async function sendBigBrotherSetNotification({
  memberFirstName,
  memberLastName,
  memberEmail,
  bigFirstName,
  bigLastName,
}: {
  memberFirstName: string;
  memberLastName:  string;
  memberEmail:     string;
  bigFirstName:    string | null;
  bigLastName:     string | null;
}): Promise<void> {
  const resend = getResend();
  if (resend === null) return;

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const adminDb = createAdminClient();

  const { data: admins } = await adminDb
    .from("members")
    .select("email")
    .eq("status", "admin");

  const adminEmails = (admins ?? []).map((a) => a.email);
  if (adminEmails.length === 0) {
    console.warn("[email] sendBigBrotherSetNotification: no admin accounts found to notify.");
    return;
  }

  const appUrl        = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const memberFullName = `${memberFirstName} ${memberLastName}`;
  const bigLine       =
    bigFirstName !== null && bigLastName !== null
      ? `${bigFirstName} ${bigLastName}`
      : "Cleared (relationship removed)";
  const timestamp = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });

  try {
    const html = await render(
      React.createElement(BigBrotherNotificationEmail, {
        memberFullName,
        memberEmail,
        bigLine,
        timestamp,
        appUrl,
      }),
    );
    await resend.emails.send({
      from:    `${SENDER_NAME} <${SENDER_EMAIL}>`,
      to:      adminEmails,
      subject: `Big brother updated — ${memberFullName}`,
      html,
    });
  } catch (err) {
    console.error("[email] sendBigBrotherSetNotification threw:", err);
  }
}

// ---------------------------------------------------------------------------
// 10. Little brother notification — sent to the big when a member claims them
// ---------------------------------------------------------------------------

export async function sendLittleBrotherNotification({
  to,
  bigFirstName,
  littleFirstName,
  littleLastName,
}: {
  to:              string;
  bigFirstName:    string;
  littleFirstName: string;
  littleLastName:  string;
}): Promise<void> {
  const resend = getResend();
  if (resend === null) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const html = await render(
      React.createElement(LittleBrotherNotificationEmail, {
        bigFirstName,
        littleFirstName,
        littleLastName,
        appUrl,
      }),
    );
    await resend.emails.send({
      from:    `${SENDER_NAME} <${SENDER_EMAIL}>`,
      to,
      subject: `${littleFirstName} ${littleLastName} claimed you as their Big Brother`,
      html,
    });
  } catch (err) {
    console.error("[email] sendLittleBrotherNotification threw:", err);
  }
}

// ---------------------------------------------------------------------------
// 11. Waitlist promotion notification
// ---------------------------------------------------------------------------

export async function sendWaitlistPromotionNotification({
  to,
  firstName,
  eventTitle,
  registrationUrl,
}: {
  to:              string;
  firstName:       string;
  eventTitle:      string;
  registrationUrl: string;
}): Promise<void> {
  const resend = getResend();
  if (resend === null) return;

  try {
    const html = await render(
      React.createElement(WaitlistPromotionEmail, { firstName, eventTitle, registrationUrl }),
    );
    await resend.emails.send({
      from:    `${SENDER_NAME} <${SENDER_EMAIL}>`,
      to,
      subject: `A spot opened up for ${eventTitle}`,
      html,
    });
  } catch (err) {
    console.error("[email] sendWaitlistPromotionNotification threw:", err);
  }
}

// ---------------------------------------------------------------------------
// 12. Refund confirmation
// ---------------------------------------------------------------------------

export async function sendRefundConfirmation({
  to,
  name,
  eventTitle,
  eventDate,
  amountRefunded,
}: {
  to:             string;
  name:           string;
  eventTitle:     string;
  eventDate:      string;
  amountRefunded: number;
}): Promise<void> {
  const resend = getResend();
  if (resend === null) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const html = await render(
      React.createElement(RefundConfirmationEmail, { name, eventTitle, eventDate, amountRefunded, appUrl }),
    );
    await resend.emails.send({
      from:    `${SENDER_NAME} <${SENDER_EMAIL}>`,
      to,
      subject: `Your refund for ${eventTitle} has been processed`,
      html,
    });
  } catch (err) {
    console.error("[email] sendRefundConfirmation threw:", err);
  }
}

// ---------------------------------------------------------------------------
// 13. Refund processed — admin alert
// ---------------------------------------------------------------------------

export async function sendRefundProcessedAdminAlert({
  registrantName,
  registrantEmail,
  eventTitle,
  eventDate,
  amountRefunded,
  paymentIntentId,
}: {
  registrantName:  string;
  registrantEmail: string;
  eventTitle:      string;
  eventDate:       string;
  amountRefunded:  number;
  paymentIntentId: string;
}): Promise<void> {
  const resend = getResend();
  if (resend === null) return;

  const chapterContactEmail = process.env.CHAPTER_CONTACT_EMAIL ?? "info@csusigmanu.com";
  const timestamp = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });

  try {
    const html = await render(
      React.createElement(RefundProcessedAdminAlert, {
        registrantName,
        registrantEmail,
        eventTitle,
        eventDate,
        amountRefunded,
        paymentIntentId,
        timestamp,
      }),
    );
    await resend.emails.send({
      from:    `${SENDER_NAME} <${SENDER_EMAIL}>`,
      to:      chapterContactEmail,
      subject: `Refund processed for ${registrantName} — ${eventTitle}`,
      html,
    });
  } catch (err) {
    console.error("[email] sendRefundProcessedAdminAlert threw:", err);
  }
}
