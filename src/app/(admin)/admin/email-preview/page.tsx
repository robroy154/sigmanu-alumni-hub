import * as React from "react";
import { render } from "@react-email/render";
import { serializeRichTextToEmail } from "@/lib/email/serialize-rich-text";

import { WelcomeEmail } from "@/lib/email/templates/WelcomeEmail";
import { RegistrationConfirmationEmail } from "@/lib/email/templates/RegistrationConfirmationEmail";
import { AdminNewMemberAlert } from "@/lib/email/templates/AdminNewMemberAlert";
import { PendingConfirmationEmail } from "@/lib/email/templates/PendingConfirmationEmail";
import { AnnouncementEmail } from "@/lib/email/templates/AnnouncementEmail";
import { ReferralInviteEmail } from "@/lib/email/templates/ReferralInviteEmail";
import { ReferralSentEmail } from "@/lib/email/templates/ReferralSentEmail";
import { ReferralCompletedEmail } from "@/lib/email/templates/ReferralCompletedEmail";
import { BigBrotherNotificationEmail } from "@/lib/email/templates/BigBrotherNotificationEmail";
import { LittleBrotherNotificationEmail } from "@/lib/email/templates/LittleBrotherNotificationEmail";
import { WaitlistPromotionEmail } from "@/lib/email/templates/WaitlistPromotionEmail";
import { RefundConfirmationEmail } from "@/lib/email/templates/RefundConfirmationEmail";
import { RefundProcessedAdminAlert } from "@/lib/email/templates/RefundProcessedAdminAlert";

import { EmailPreviewClient } from "./EmailPreviewClient";

export const metadata = { title: "Email Preview — Admin" };

export default async function EmailPreviewPage() {
  // Admin authentication is enforced by (admin)/layout.tsx — redirect
  // to "/" for any non-admin session before reaching this page.

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://example.com";

  // Sample announcement body for the announcement preview
  const sampleAnnouncementBody = serializeRichTextToEmail(
    `<p>All brothers are invited to the monthly chapter meeting this Thursday at 7&nbsp;PM in the Student Center, Room 214.</p>` +
    `<p>Agenda:</p>` +
    `<ul><li>Brotherhood updates</li><li>Spring recruitment plan</li><li>Community service event planning</li></ul>` +
    `<p>Light refreshments will be provided. Please reach out to the chapter president with any questions.</p>`,
  );

  const templates = await Promise.all([
    render(React.createElement(WelcomeEmail, {
      firstName: "Alex",
      appUrl,
    })).then((html) => ({ name: "Welcome Email", html })),

    render(React.createElement(RegistrationConfirmationEmail, {
      name:          "Alex Johnson",
      eventTitle:    "Fall Brotherhood Banquet",
      eventDate:     "Saturday, November 15, 2025 · 7:00 PM",
      eventLocation: "Columbus State University Student Center",
      guestCount:    2,
      totalPaid:     75.00,
      appUrl,
    })).then((html) => ({ name: "Registration Confirmation", html })),

    render(React.createElement(AdminNewMemberAlert, {
      fullName: "Marcus Williams",
      email:    "marcus.williams@example.com",
      appUrl,
    })).then((html) => ({ name: "Admin — New Member Alert", html })),

    render(React.createElement(PendingConfirmationEmail, {
      firstName: "Marcus",
      appUrl,
    })).then((html) => ({ name: "Pending Confirmation", html })),

    render(React.createElement(AnnouncementEmail, {
      title:          "Chapter Meeting This Thursday",
      serializedBody: sampleAnnouncementBody,
      appUrl,
    })).then((html) => ({ name: "Announcement", html })),

    render(React.createElement(ReferralInviteEmail, {
      inviteeFirstName: "Jordan",
      referrerFullName: "Alex Johnson",
      inviteUrl:        `${appUrl}/join?token=preview-token-abc123`,
    })).then((html) => ({ name: "Referral — Invite", html })),

    render(React.createElement(ReferralSentEmail, {
      referrerFirstName: "Alex",
      inviteeFirstName:  "Jordan",
      inviteeLastName:   "Thompson",
    })).then((html) => ({ name: "Referral — Invite Sent", html })),

    render(React.createElement(ReferralCompletedEmail, {
      referrerFirstName: "Alex",
      inviteeFirstName:  "Jordan",
      inviteeLastName:   "Thompson",
      appUrl,
    })).then((html) => ({ name: "Referral — Completed", html })),

    render(React.createElement(BigBrotherNotificationEmail, {
      memberFullName: "Marcus Williams",
      memberEmail:    "marcus@example.com",
      bigLine:        "Alex Johnson",
      timestamp:      "June 9, 2026, 2:30 PM",
      appUrl,
    })).then((html) => ({ name: "Admin — Big Brother Updated", html })),

    render(React.createElement(LittleBrotherNotificationEmail, {
      bigFirstName:    "Alex",
      littleFirstName: "Marcus",
      littleLastName:  "Williams",
      appUrl,
    })).then((html) => ({ name: "Little Brother Notification", html })),

    render(React.createElement(WaitlistPromotionEmail, {
      firstName:       "Jordan",
      eventTitle:      "Fall Brotherhood Banquet",
      registrationUrl: `${appUrl}/events/fall-brotherhood-banquet/register`,
    })).then((html) => ({ name: "Waitlist Promotion", html })),

    render(React.createElement(RefundConfirmationEmail, {
      name:           "Alex Johnson",
      eventTitle:     "Fall Brotherhood Banquet",
      eventDate:      "Saturday, November 15, 2025",
      amountRefunded: 75.00,
      appUrl,
    })).then((html) => ({ name: "Refund Confirmation", html })),

    render(React.createElement(RefundProcessedAdminAlert, {
      registrantName:  "Alex Johnson",
      registrantEmail: "alex.johnson@example.com",
      eventTitle:      "Fall Brotherhood Banquet",
      eventDate:       "Saturday, November 15, 2025",
      amountRefunded:  75.00,
      paymentIntentId: "pi_3Pexample1234567890",
      timestamp:       "June 16, 2026, 2:30 PM",
    })).then((html) => ({ name: "Admin — Refund Processed", html })),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-sn-off-white">Email Preview</h1>
        <p className="text-sm text-sn-gray-medium mt-1">
          All {templates.length} email templates rendered with sample data. Select a template to preview its rendered HTML.
        </p>
      </div>
      <EmailPreviewClient templates={templates} />
    </div>
  );
}
