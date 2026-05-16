import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — Sigma Nu Mu Xi Alumni Hub",
};

export default function TermsOfServicePage() {
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
        <h1 className="text-3xl font-bold text-sn-off-white mb-2">Terms of Service</h1>
        <p className="text-sn-gray-medium text-sm mb-10">
          <strong className="text-sn-off-white">Sigma Nu Fraternity, Mu Xi Chapter</strong>
          {" "}· Last updated: May 15, 2026
        </p>

        <div className="prose-legal">

          <Section title="1. Acceptance of Terms">
            <p>By accessing or using the Mu Xi Chapter Alumni Hub (&ldquo;the Site&rdquo;) at csusigmanu.com, you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;). If you do not agree to these Terms, do not use the Site.</p>
            <p>These Terms constitute a legally binding agreement between you and Sigma Nu Fraternity, Mu Xi Chapter (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;). We reserve the right to update these Terms at any time. Continued use of the Site after changes are posted constitutes your acceptance.</p>
          </Section>

          <Section title="2. Eligibility">
            <p>The Site is intended for alumni, active members, and invited guests of Sigma Nu Fraternity, Mu Xi Chapter. By creating an account, you represent that:</p>
            <ul>
              <li>You are at least 18 years of age</li>
              <li>You are a legitimate alumnus, member, or invited guest of the chapter</li>
              <li>The information you provide during registration is accurate and complete</li>
              <li>You will maintain the accuracy of your account information</li>
            </ul>
            <p>We reserve the right to deny or revoke access to any person at our sole discretion.</p>
          </Section>

          <Section title="3. Account Registration and Approval">
            <p>Account creation requires administrator approval before full access is granted. Submission of a registration does not guarantee approval. We may reject or revoke accounts without notice or explanation.</p>
            <p>You are responsible for maintaining the confidentiality of your login credentials. You agree to notify us immediately at <a href="mailto:info@csusigmanu.com">info@csusigmanu.com</a> if you suspect unauthorized access to your account. We are not liable for any loss or damage arising from unauthorized use of your credentials.</p>
            <p>You may not create accounts on behalf of others or share your account with any other person.</p>
          </Section>

          <Section title="4. Acceptable Use">
            <p>You agree to use the Site only for lawful purposes and in a manner consistent with the values and standards of Sigma Nu Fraternity. You agree not to:</p>
            <ul>
              <li>Post or transmit content that is false, defamatory, harassing, abusive, obscene, or otherwise objectionable</li>
              <li>Impersonate any person or misrepresent your affiliation with the chapter</li>
              <li>Use the Site to solicit commercial business or distribute unsolicited communications (spam)</li>
              <li>Attempt to gain unauthorized access to any part of the Site or other users&apos; accounts</li>
              <li>Scrape, harvest, or otherwise collect member data from the Site without authorization</li>
              <li>Use the Site in any manner that could damage, disable, or impair its functionality</li>
              <li>Violate any applicable local, state, federal, or international law or regulation</li>
            </ul>
            <p>We reserve the right to remove content and terminate accounts that violate these standards without prior notice.</p>
          </Section>

          <Section title="5. Member Directory and Family Tree">
            <p>Information displayed in the member directory and family tree is intended solely for use by authenticated chapter members. You agree not to:</p>
            <ul>
              <li>Export, copy, or redistribute member contact information for any purpose outside of chapter-related communication</li>
              <li>Use member information for commercial solicitation</li>
              <li>Share member data with third parties without express consent</li>
            </ul>
            <p>Member profile visibility is controlled by individual privacy settings. Administrators have access to all member data for chapter management purposes.</p>
          </Section>

          <Section title="6. Event Registration and Payments">
            <h3>Registration</h3>
            <p>Event registrations are subject to availability. Submission of a registration form does not guarantee a spot until payment is confirmed (for paid events) or the registration is otherwise confirmed.</p>
            <h3>Payment</h3>
            <p>Payments are processed securely by Stripe, Inc. By submitting payment, you authorize us to charge the applicable fees to your provided payment method. All amounts are in US dollars.</p>
            <h3>Refund Policy</h3>
            <p>Refund requests must be submitted to <a href="mailto:info@csusigmanu.com">info@csusigmanu.com</a>. Refunds are granted at our sole discretion and are not guaranteed. We reserve the right to establish event-specific refund deadlines, which will be communicated at the time of registration. Processing fees charged by Stripe are non-refundable.</p>
            <h3>Chargebacks</h3>
            <p>Initiating a chargeback or payment dispute without first contacting us to resolve the issue is a violation of these Terms. We reserve the right to terminate accounts of members who initiate fraudulent or unjustified chargebacks.</p>
          </Section>

          <Section title="7. User Content">
            <p>By submitting content to the Site (including profile information, photos, and relationship data), you grant us a non-exclusive, royalty-free license to store, display, and use that content to operate and improve the Site. You represent that you have the right to submit any content you provide and that it does not violate the rights of any third party.</p>
            <p>We do not claim ownership of your personal information or content.</p>
          </Section>

          <Section title="8. Account Termination">
            <p>We reserve the right to suspend or terminate your account at any time, with or without cause, and with or without notice. Grounds for termination include but are not limited to violation of these Terms, conduct unbecoming of a Sigma Nu member, or inactivity.</p>
            <p>You may request deletion of your account by contacting <a href="mailto:info@csusigmanu.com">info@csusigmanu.com</a>. Upon termination, your access to the Site will be revoked. Records of completed financial transactions may be retained as required by law or for accounting purposes.</p>
          </Section>

          <Section title="9. Disclaimer of Warranties">
            <p>The Site is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis without warranties of any kind, either express or implied. We do not warrant that the Site will be uninterrupted, error-free, or free of viruses or other harmful components. We make no warranties regarding the accuracy or completeness of any content on the Site.</p>
          </Section>

          <Section title="10. Limitation of Liability">
            <p>To the fullest extent permitted by applicable law, Sigma Nu Fraternity, Mu Xi Chapter, its administrators, and its officers shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the Site, including but not limited to loss of data, loss of revenue, or personal injury.</p>
            <p>Our total liability to you for any claim arising out of or related to these Terms or the Site shall not exceed the amount you paid to us in the twelve (12) months preceding the claim.</p>
          </Section>

          <Section title="11. Indemnification">
            <p>You agree to indemnify and hold harmless Sigma Nu Fraternity, Mu Xi Chapter, its administrators, and its officers from any claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys&apos; fees) arising out of your use of the Site, your violation of these Terms, or your violation of any third-party rights.</p>
          </Section>

          <Section title="12. Governing Law and Dispute Resolution">
            <p>These Terms are governed by and construed in accordance with the laws of the State of Georgia, without regard to its conflict of law provisions. Any dispute arising under these Terms shall be resolved exclusively in the state or federal courts located in Muscogee County, Georgia, and you consent to personal jurisdiction in those courts.</p>
          </Section>

          <Section title="13. Severability">
            <p>If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary, and the remaining provisions will continue in full force and effect.</p>
          </Section>

          <Section title="14. Entire Agreement">
            <p>These Terms, together with our <Link href="/privacy">Privacy Policy</Link>, constitute the entire agreement between you and Sigma Nu Fraternity, Mu Xi Chapter regarding your use of the Site and supersede all prior agreements and understandings.</p>
          </Section>

          <Section title="15. Contact Us">
            <p>For questions or concerns regarding these Terms:</p>
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
          <Link href="/privacy" className="hover:text-sn-gray-medium transition-colors">Privacy Policy</Link>
          <span>·</span>
          <Link href="/terms" className="hover:text-sn-gray-medium transition-colors text-sn-gold/80">Terms of Service</Link>
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
