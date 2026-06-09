"use server";

/**
 * Email sending module — wraps Resend.
 *
 * Required env vars:
 *   RESEND_API_KEY       — from resend.com dashboard
 *   RESEND_FROM_EMAIL    — verified sender (e.g. "noreply@yourdomain.com")
 *
 * All send functions are fire-and-forget: they log errors but never throw,
 * so a failed email never blocks the primary operation.
 */

import { Resend } from "resend";
import { serializeRichTextToEmail } from "./serialize-rich-text";

// ---------------------------------------------------------------------------
// Client
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
// Base HTML template
// ---------------------------------------------------------------------------

function baseTemplate(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark"><style>:root { color-scheme: dark; }</style></head>
<body style="margin:0;padding:32px 16px;background:#0B0B0C;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" role="presentation"
             style="background:#121214;border-radius:12px;overflow:hidden;border:1px solid rgba(198,167,94,0.25);">

        <!-- Header -->
        <tr>
          <td style="background:#121214;border-bottom:2px solid #C6A75E;padding:24px 32px;text-align:center;">
            <div style="display:inline-block;width:44px;height:44px;border-radius:50%;background:#C6A75E;
                        line-height:44px;text-align:center;font-size:18px;font-weight:bold;color:#0B0B0C;">ΣΝ</div>
            <p style="margin:8px 0 0;color:#C6A75E;font-size:11px;letter-spacing:3px;
                      text-transform:uppercase;font-family:Arial,sans-serif;">
              Sigma Nu · Mu Xi Chapter
            </p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 36px;">
            ${bodyHtml}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="border-top:1px solid rgba(198,167,94,0.15);padding:20px 32px;text-align:center;">
            <p style="margin:0;color:rgba(255,255,255,0.35);font-size:11px;font-family:Arial,sans-serif;
                      line-height:1.6;">
              Sigma Nu Fraternity · Mu Xi Chapter · Columbus State University<br>
              This is an automated message — please do not reply directly.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// Shared inline styles used in templates
const h1      = `color:#ffffff;font-size:22px;font-weight:bold;margin:0 0 12px;line-height:1.3;`;
const p       = `color:rgba(255,255,255,0.75);font-size:15px;line-height:1.7;margin:0 0 14px;font-family:Arial,sans-serif;`;
const btn     = `display:inline-block;background:#C6A75E;color:#0B0B0C;font-family:Arial,sans-serif;
             font-size:14px;font-weight:bold;padding:12px 28px;border-radius:8px;
             text-decoration:none;letter-spacing:0.5px;`;
const label   = `color:#C6A75E;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;
               font-family:Arial,sans-serif;`;
const value   = `color:#ffffff;font-size:15px;font-family:Arial,sans-serif;`;
const divider = `border:none;border-top:1px solid rgba(198,167,94,0.2);margin:20px 0;`;

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

  const body = `
    <h1 style="${h1}">Welcome to the Brotherhood, ${firstName}!</h1>
    <p style="${p}">
      Your account has been approved by a chapter administrator. You now have
      full access to the Mu Xi Alumni Hub.
    </p>
    <p style="${p}">Here's what you can do:</p>
    <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 24px;">
      <tr>
        <td style="padding:6px 0;color:rgba(255,255,255,0.7);font-family:Arial,sans-serif;font-size:14px;">
          &bull;&nbsp; Browse the <strong style="color:#ffffff;">Brother Directory</strong>
        </td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:rgba(255,255,255,0.7);font-family:Arial,sans-serif;font-size:14px;">
          &bull;&nbsp; Explore the <strong style="color:#ffffff;">Chapter Family Tree</strong>
        </td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:rgba(255,255,255,0.7);font-family:Arial,sans-serif;font-size:14px;">
          &bull;&nbsp; Complete your <strong style="color:#ffffff;">member profile</strong>
        </td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:rgba(255,255,255,0.7);font-family:Arial,sans-serif;font-size:14px;">
          &bull;&nbsp; Register for upcoming <strong style="color:#ffffff;">events</strong>
        </td>
      </tr>
    </table>
    <p style="text-align:center;margin:28px 0;">
      <a href="${appUrl}/directory" style="${btn}">Go to the Hub →</a>
    </p>
  `;

  try {
    await resend.emails.send({
      from:    `${SENDER_NAME} <${SENDER_EMAIL}>`,
      to,
      subject: "You're approved — Welcome to the Mu Xi Alumni Hub",
      html:    baseTemplate(body),
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
  eventDate:     string; // pre-formatted
  eventLocation: string | null;
  guestCount:    number;
  totalPaid:     number; // dollars
}): Promise<void> {
  const resend = getResend();
  if (resend === null) return;

  const appUrl    = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const guestLine =
    guestCount === 0
      ? "No additional guests."
      : `${guestCount} additional guest${guestCount !== 1 ? "s" : ""} included.`;

  const body = `
    <h1 style="${h1}">You&rsquo;re registered!</h1>
    <p style="${p}">
      Hi ${name}, your registration for <strong style="color:#C6A75E;">${eventTitle}</strong>
      is confirmed. See you there!
    </p>
    <hr style="${divider}">
    <table cellpadding="0" cellspacing="8" role="presentation" style="margin:0 0 24px;width:100%;">
      <tr>
        <td style="${label}">Event</td>
        <td style="${value}">${eventTitle}</td>
      </tr>
      <tr>
        <td style="${label}">Date</td>
        <td style="${value}">${eventDate}</td>
      </tr>
      ${eventLocation !== null ? `
      <tr>
        <td style="${label}">Location</td>
        <td style="${value}">${eventLocation}</td>
      </tr>` : ""}
      <tr>
        <td style="${label}">Guests</td>
        <td style="${value}">${guestLine}</td>
      </tr>
      <tr>
        <td style="${label}">Total paid</td>
        <td style="${value};color:#C6A75E;">$${totalPaid.toFixed(2)}</td>
      </tr>
    </table>
    <hr style="${divider}">
    <p style="${p}">
      Questions? Reach out to a chapter administrator through the alumni hub.
    </p>
    <p style="text-align:center;margin:28px 0;">
      <a href="${appUrl}" style="${btn}">Visit the Hub →</a>
    </p>
  `;

  try {
    await resend.emails.send({
      from:    `${SENDER_NAME} <${SENDER_EMAIL}>`,
      to,
      subject: `Registration confirmed — ${eventTitle}`,
      html:    baseTemplate(body),
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

  // Import here to avoid circular deps — this file is "use server"
  const { createAdminClient } = await import("@/lib/supabase/admin");

  let resolvedMember: { first_name: string; last_name: string; email: string };

  if (member !== undefined) {
    // Caller supplied member data directly — skip session lookup.
    // This is the reliable path when called immediately after signUp(),
    // where the session cookie may not yet be available on the server.
    resolvedMember = {
      first_name: member.firstName,
      last_name:  member.lastName,
      email:      member.email,
    };
  } else {
    // Fallback: derive member from the active session.
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

  const adminDb = createAdminClient();

  // Fetch all admin email addresses
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

  const body = `
    <h1 style="${h1}">New member signup</h1>
    <p style="${p}">
      A new member has created an account and is waiting for approval.
    </p>
    <hr style="${divider}">
    <table cellpadding="0" cellspacing="8" role="presentation" style="margin:0 0 24px;">
      <tr>
        <td style="${label}">Name</td>
        <td style="${value}">${fullName}</td>
      </tr>
      <tr>
        <td style="${label}">Email</td>
        <td style="${value}">${resolvedMember.email}</td>
      </tr>
    </table>
    <hr style="${divider}">
    <p style="text-align:center;margin:28px 0;">
      <a href="${appUrl}/admin/members" style="${btn}">Review in Admin Panel →</a>
    </p>
  `;

  try {
    await resend.emails.send({
      from:    `${SENDER_NAME} <${SENDER_EMAIL}>`,
      to:      adminEmails,
      subject: `New member signup — ${fullName}`,
      html:    baseTemplate(body),
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

  const body = `
    <h1 style="${h1}">Thanks for signing up, ${firstName}!</h1>
    <p style="${p}">
      Your account for the <strong style="color:#C6A75E;">Sigma Nu Mu Xi Chapter Alumni Hub</strong>
      has been received and is pending review by a chapter administrator.
    </p>
    <p style="${p}">
      You will receive an email as soon as your account is approved. This typically
      happens within a day or two.
    </p>
    <p style="${p}">
      In the meantime, you can return to sign in at any time — you'll be held at
      the pending approval page until an admin activates your account.
    </p>
    <p style="text-align:center;margin:28px 0;">
      <a href="${appUrl}/login" style="${btn}">Sign In →</a>
    </p>
  `;

  try {
    await resend.emails.send({
      from:    `${SENDER_NAME} <${SENDER_EMAIL}>`,
      to,
      subject: "Your Sigma Nu Mu Xi account is pending approval",
      html:    baseTemplate(body),
    });
  } catch (err) {
    console.error("[email] sendPendingConfirmation threw:", err);
  }
}

// ---------------------------------------------------------------------------
// 5. Announcement notification — sent to all members when admin posts
// ---------------------------------------------------------------------------

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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const serializedBody = serializeRichTextToEmail(announcementBody);

  const emailHtml = baseTemplate(`
    <h1 style="${h1}">${title}</h1>
    ${serializedBody}
    <hr style="${divider}">
    <p style="text-align:center;margin:28px 0;">
      <a href="${appUrl}/home" style="${btn}">Visit the Hub →</a>
    </p>
  `);

  // Process in chunks of 100 — send individually within each chunk.
  const CHUNK = 100;
  for (let i = 0; i < memberEmails.length; i += CHUNK) {
    const chunk = memberEmails.slice(i, i + CHUNK);
    for (const email of chunk) {
      try {
        await resend.emails.send({
          from:    `${SENDER_NAME} <${SENDER_EMAIL}>`,
          to:      email,
          subject: `New announcement: ${title}`,
          html:    emailHtml,
        });
      } catch (err) {
        console.error(`[email] sendAnnouncementNotification failed for ${email}:`, err);
      }
    }
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

  const body = `
    <h1 style="${h1}">You've been invited, ${inviteeFirstName}!</h1>
    <p style="${p}">
      <strong style="color:#ffffff;">${referrerFullName}</strong> has invited you to join
      the <strong style="color:#C6A75E;">Sigma Nu Mu Xi Chapter Alumni Hub</strong> —
      the private platform for Mu Xi Chapter brothers.
    </p>
    <p style="${p}">
      Use the link below to create your account. This invitation expires in
      <strong style="color:#ffffff;">7 days</strong>.
    </p>
    <p style="text-align:center;margin:32px 0;">
      <a href="${inviteUrl}" style="${btn}">Create My Account →</a>
    </p>
    <hr style="${divider}">
    <p style="color:rgba(255,255,255,0.4);font-size:12px;font-family:Arial,sans-serif;text-align:center;margin:0;">
      If you weren&rsquo;t expecting this invite, you can safely ignore this email.
    </p>
  `;

  try {
    await resend.emails.send({
      from:    `${SENDER_NAME} <${SENDER_EMAIL}>`,
      to,
      subject: "You're invited to join the Sigma Nu Mu Xi Alumni Hub",
      html:    baseTemplate(body),
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

  const body = `
    <h1 style="${h1}">Your invite has been sent!</h1>
    <p style="${p}">
      Hi ${referrerFirstName}, your invitation to
      <strong style="color:#ffffff;">${inviteeFirstName} ${inviteeLastName}</strong>
      has been sent. You&rsquo;ll receive a notification here as soon as they create
      their account.
    </p>
    <hr style="${divider}">
    <p style="${p}">
      Invite links are valid for 7 days. If ${inviteeFirstName} doesn&rsquo;t sign up
      in time, you can send a new invite from your profile page.
    </p>
  `;

  try {
    await resend.emails.send({
      from:    `${SENDER_NAME} <${SENDER_EMAIL}>`,
      to,
      subject: `Your invite to ${inviteeFirstName} has been sent`,
      html:    baseTemplate(body),
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

  const body = `
    <h1 style="${h1}">${inviteeFirstName} ${inviteeLastName} just joined!</h1>
    <p style="${p}">
      Hi ${referrerFirstName},
      <strong style="color:#ffffff;">${inviteeFirstName} ${inviteeLastName}</strong>
      just created their account using your invite link. Welcome them to the hub!
    </p>
    <p style="text-align:center;margin:28px 0;">
      <a href="${appUrl}/directory" style="${btn}">View the Directory →</a>
    </p>
  `;

  try {
    await resend.emails.send({
      from:    `${SENDER_NAME} <${SENDER_EMAIL}>`,
      to,
      subject: `${inviteeFirstName} ${inviteeLastName} just joined!`,
      html:    baseTemplate(body),
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

  const appUrl    = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const fullName  = `${memberFirstName} ${memberLastName}`;
  const bigLine   =
    bigFirstName !== null && bigLastName !== null
      ? `${bigFirstName} ${bigLastName}`
      : "Cleared (relationship removed)";
  const timestamp = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });

  const body = `
    <h1 style="${h1}">Big brother relationship updated</h1>
    <p style="${p}">
      A member has updated their big brother relationship.
    </p>
    <hr style="${divider}">
    <table cellpadding="0" cellspacing="8" role="presentation" style="margin:0 0 24px;">
      <tr>
        <td style="${label}">Member</td>
        <td style="${value}">${fullName}</td>
      </tr>
      <tr>
        <td style="${label}">Email</td>
        <td style="${value}">${memberEmail}</td>
      </tr>
      <tr>
        <td style="${label}">Big brother</td>
        <td style="${value}">${bigLine}</td>
      </tr>
      <tr>
        <td style="${label}">Updated</td>
        <td style="${value}">${timestamp} ET</td>
      </tr>
    </table>
    <hr style="${divider}">
    <p style="text-align:center;margin:28px 0;">
      <a href="${appUrl}/admin/members" style="${btn}">Review in Admin Panel →</a>
    </p>
  `;

  try {
    await resend.emails.send({
      from:    `${SENDER_NAME} <${SENDER_EMAIL}>`,
      to:      adminEmails,
      subject: `Big brother updated — ${fullName}`,
      html:    baseTemplate(body),
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

  const body = `
    <h1 style="${h1}">You have a new Little Brother!</h1>
    <p style="${p}">
      Hi ${bigFirstName},
      <strong style="color:#ffffff;">${littleFirstName} ${littleLastName}</strong>
      has added you as their Big Brother in the Mu Xi Alumni Hub.
    </p>
    <p style="${p}">
      You can see your full lineage on the family tree.
    </p>
    <p style="text-align:center;margin:28px 0;">
      <a href="${appUrl}/family-tree" style="${btn}">View Family Tree →</a>
    </p>
  `;

  try {
    await resend.emails.send({
      from:    `${SENDER_NAME} <${SENDER_EMAIL}>`,
      to,
      subject: `${littleFirstName} ${littleLastName} claimed you as their Big Brother`,
      html:    baseTemplate(body),
    });
  } catch (err) {
    console.error("[email] sendLittleBrotherNotification threw:", err);
  }
}

// ── Waitlist promotion notification ──────────────────────────────────────────
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

  const waitlistBtn = "display:inline-block;padding:10px 20px;background:#C6A75E;color:#0B0B0C;text-decoration:none;border-radius:4px;font-weight:600;";

  const body = `
    <p>Hi ${firstName},</p>
    <p>Good news — a spot has opened up for <strong>${eventTitle}</strong>!</p>
    <p>You were on the waitlist and now have a chance to register. Complete your registration soon, as spots are limited.</p>
    <p style="margin-top:24px;">
      <a href="${registrationUrl}" style="${waitlistBtn}">Complete Registration →</a>
    </p>
    <p style="margin-top:16px;color:#6B6B73;font-size:13px;">
      If you're no longer interested, you can simply ignore this email.
    </p>
  `;

  try {
    await resend.emails.send({
      from:    `${SENDER_NAME} <${SENDER_EMAIL}>`,
      to,
      subject: `A spot opened up for ${eventTitle}`,
      html:    baseTemplate(body),
    });
  } catch (err) {
    console.error("[email] sendWaitlistPromotionNotification threw:", err);
  }
}
