import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — Sigma Nu Mu Xi Alumni Hub",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-sn-black text-sn-off-white flex flex-col">

      {/* Header */}
      <header className="border-b border-sn-gold/20 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-sn-gold flex items-center justify-center text-sn-black font-bold text-xs select-none">
              ΣΝ
            </div>
            <div>
              <p className="text-sn-gold font-semibold text-sm leading-none">Sigma Nu Fraternity</p>
              <p className="text-white/50 text-xs leading-none mt-0.5">Mu Xi Chapter · Alumni Hub</p>
            </div>
          </Link>
          <Link href="/" className="text-sn-gray-medium hover:text-sn-off-white text-sm transition-colors">
            ← Home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
        <h1 className="text-3xl font-bold text-sn-off-white mb-2">Privacy Policy</h1>
        <p className="text-sn-gray-medium text-sm mb-10">
          <strong className="text-sn-off-white">Sigma Nu Fraternity, Mu Xi Chapter</strong>
          {" "}· Last updated: May 15, 2026
        </p>

        <div className="prose-legal">

          <Section title="1. Who We Are">
            <p>This Privacy Policy applies to the Mu Xi Chapter Alumni Hub (&ldquo;the Site&rdquo;), operated by Sigma Nu Fraternity, Mu Xi Chapter (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;), a fraternity chapter affiliated with Columbus State University. The Site is located at csusigmanu.com.</p>
            <p>For questions about this policy, contact us at <a href="mailto:info@csusigmanu.com">info@csusigmanu.com</a>.</p>
          </Section>

          <Section title="2. Information We Collect">
            <h3>Information You Provide Directly</h3>
            <p>When you create an account or register for an event, we may collect:</p>
            <ul>
              <li>Full name and nickname</li>
              <li>Email address</li>
              <li>Phone number</li>
              <li>Home address (street, city, state, zip, country)</li>
              <li>Date of birth</li>
              <li>Profile photo</li>
              <li>Fraternity-specific information (pledge class, badge number, big/little brother relationships)</li>
              <li>LinkedIn URL</li>
              <li>Payment information (processed by Stripe — see Section 5)</li>
            </ul>
            <h3>Information Collected Automatically</h3>
            <p>When you use the Site, we may collect:</p>
            <ul>
              <li>IP address and browser type</li>
              <li>Pages visited and time spent on the Site</li>
              <li>Referring URLs</li>
            </ul>
            <h3>Information From Third Parties</h3>
            <p>If you sign in using Google OAuth, we receive your name and email address from Google as permitted by your Google account settings.</p>
          </Section>

          <Section title="3. How We Use Your Information">
            <p>We use the information we collect to:</p>
            <ul>
              <li>Create and manage your alumni account</li>
              <li>Process event registrations and payments</li>
              <li>Display your profile and fraternity lineage in the member directory and family tree</li>
              <li>Send transactional emails (account approval, registration confirmation, event reminders)</li>
              <li>Send chapter announcements and communications you have not opted out of</li>
              <li>Allow administrators to manage member records and registrations</li>
              <li>Comply with legal obligations</li>
            </ul>
          </Section>

          <Section title="4. How We Share Your Information">
            <p>We do not sell your personal information. We share it only in the following circumstances:</p>
            <p><strong>With other members:</strong> Your profile information is visible to other authenticated members of the Site. You control which fields are visible (phone, address, birthday) via your privacy settings.</p>
            <p><strong>With administrators:</strong> Chapter administrators have access to all member profile data and registration records for the purpose of chapter management.</p>
            <p><strong>With service providers:</strong> We share data with third-party vendors who help us operate the Site, including:</p>
            <ul>
              <li><strong>Supabase</strong> — database hosting and authentication</li>
              <li><strong>Stripe</strong> — payment processing</li>
              <li><strong>Brevo</strong> — transactional email delivery</li>
              <li><strong>Vercel</strong> — application hosting</li>
              <li><strong>Google</strong> — OAuth authentication and address autocomplete</li>
            </ul>
            <p>These providers are contractually obligated to use your data only to provide services to us.</p>
            <p><strong>For legal reasons:</strong> We may disclose your information if required by law, court order, or governmental authority.</p>
          </Section>

          <Section title="5. Payment Processing">
            <p>Payment card information is processed directly by Stripe, Inc. We do not store, transmit, or have access to your full credit card number, CVV, or expiration date. Stripe&apos;s privacy policy is available at stripe.com/privacy.</p>
            <p>We retain records of completed transactions (amount paid, registration details, Stripe payment ID) for accounting and event management purposes.</p>
          </Section>

          <Section title="6. Email Communications">
            <p>By creating an account, you consent to receive transactional emails related to your account and event registrations. These emails include account approval notices, registration confirmations, and password reset messages. You cannot opt out of transactional emails while maintaining an active account.</p>
            <p>You may opt out of chapter announcements and non-transactional communications at any time by updating your preferences in your account settings or by emailing <a href="mailto:info@csusigmanu.com">info@csusigmanu.com</a>.</p>
          </Section>

          <Section title="7. Data Retention">
            <p>We retain your personal information for as long as your account is active or as needed to provide services. If you request deletion of your account, we will delete or anonymize your personal data within a reasonable time, except where retention is required for legal, financial, or contractual reasons (such as records of completed payment transactions).</p>
          </Section>

          <Section title="8. Your Rights and Choices">
            <p>You have the right to:</p>
            <ul>
              <li>Access and review the personal information we hold about you (visible in your profile)</li>
              <li>Correct inaccurate information (via your profile edit page)</li>
              <li>Request deletion of your account and associated data by emailing info@csusigmanu.com</li>
              <li>Opt out of non-transactional email communications</li>
              <li>Control the visibility of certain profile fields (phone, address, birthday) via your privacy settings</li>
            </ul>
            <p><strong>California Residents:</strong> If you are a California resident, you may have additional rights under the California Consumer Privacy Act (CCPA), including the right to know what personal information is collected, the right to delete personal information, and the right to opt out of the sale of personal information (we do not sell personal information). To exercise these rights, contact us at <a href="mailto:info@csusigmanu.com">info@csusigmanu.com</a>.</p>
          </Section>

          <Section title="9. Data Security">
            <p>We implement reasonable technical and organizational measures to protect your personal information, including encrypted data transmission (HTTPS), secure authentication, and role-based access controls. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.</p>
          </Section>

          <Section title="10. Children's Privacy">
            <p>The Site is intended for alumni of Sigma Nu Fraternity, Mu Xi Chapter, who are adults. We do not knowingly collect personal information from anyone under the age of 18. If we become aware that we have collected personal information from a minor, we will delete it promptly.</p>
          </Section>

          <Section title="11. Third-Party Links">
            <p>The Site may contain links to third-party websites. We are not responsible for the privacy practices of those sites and encourage you to review their privacy policies.</p>
          </Section>

          <Section title="12. Changes to This Policy">
            <p>We may update this Privacy Policy from time to time. When we do, we will update the &ldquo;Last updated&rdquo; date at the top of this page. Continued use of the Site after changes are posted constitutes your acceptance of the updated policy.</p>
          </Section>

          <Section title="13. Contact Us">
            <p>For questions, concerns, or requests related to this Privacy Policy:</p>
            <p>
              <strong>Sigma Nu Fraternity, Mu Xi Chapter</strong><br />
              Email: <a href="mailto:info@csusigmanu.com">info@csusigmanu.com</a><br />
              Website: csusigmanu.com
            </p>
          </Section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-sn-gold/20 px-6 py-6 text-center">
        <p className="text-sn-gray-medium text-sm">
          © {new Date().getFullYear()} Sigma Nu Fraternity · Mu Xi Chapter · Columbus State University
        </p>
        <div className="flex items-center justify-center gap-4 mt-1.5 text-xs text-sn-gray-medium/60">
          <Link href="/privacy" className="hover:text-sn-gray-medium transition-colors text-sn-gold/80">Privacy Policy</Link>
          <span>·</span>
          <Link href="/terms" className="hover:text-sn-gray-medium transition-colors">Terms of Service</Link>
          <span>·</span>
          <a href="mailto:info@csusigmanu.com" className="hover:text-sn-gray-medium transition-colors">info@csusigmanu.com</a>
        </div>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-sn-gold font-semibold text-lg mb-4 pb-2 border-b border-sn-gold/20">
        {title}
      </h2>
      <div className="space-y-3 text-sn-gray-text text-sm leading-relaxed [&_h3]:text-sn-off-white [&_h3]:font-medium [&_h3]:mt-4 [&_h3]:mb-2 [&_a]:text-sn-gold [&_a:hover]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_strong]:text-sn-off-white">
        {children}
      </div>
    </section>
  );
}
