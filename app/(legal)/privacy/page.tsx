import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | FreTraq',
  description: 'FreTraq Privacy Policy — how we collect, use, and protect your data.',
}

const EFFECTIVE_DATE = 'May 10, 2026'

export default function PrivacyPage() {
  return (
    <article className="prose prose-slate max-w-none [font-family:var(--font-dm-sans)]">
      <div className="mb-10 border-b border-slate-200 pb-8">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Legal
        </p>
        <h1 className="mb-2 text-4xl font-bold tracking-tight text-slate-900 [font-family:var(--font-dm-serif)]">
          Privacy Policy
        </h1>
        <p className="text-sm text-slate-500">Effective date: {EFFECTIVE_DATE}</p>
      </div>

      <Section title="1. Introduction">
        <p>
          FreTraq, Inc. (&ldquo;FreTraq,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or
          &ldquo;our&rdquo;) operates the FreTraq freight marketplace platform at fretraq.com.
          This Privacy Policy explains what personal information we collect, how we use it, who
          we share it with, and your rights regarding that information.
        </p>
        <p>
          By using the Platform you agree to the collection and use of information as described
          in this policy.
        </p>
      </Section>

      <Section title="2. Information We Collect">
        <h3 className="mt-6 text-base font-semibold text-slate-800">
          Information you provide directly
        </h3>
        <ul>
          <li>
            <strong>Account information:</strong> full name, email address, password (stored
            as a hashed credential — we never store plaintext passwords)
          </li>
          <li>
            <strong>Company information:</strong> company name, business address, business phone
            number, role (broker or carrier)
          </li>
          <li>
            <strong>Regulatory identifiers:</strong> FMCSA MC number, USDOT number, operating
            authority status — collected from carriers during verification onboarding and
            cross-referenced against FMCSA public records
          </li>
          <li>
            <strong>Payment information:</strong> billing address and payment method details.
            We do not store raw card numbers — payment processing is handled by Stripe, which
            stores your card data under PCI-DSS compliance. We receive and store only a Stripe
            customer ID and last-four-digits reference.
          </li>
          <li>
            <strong>Load and bid data:</strong> load origin, destination, equipment type, weight,
            pickup/delivery windows, and rates you post or bid on the Platform
          </li>
          <li>
            <strong>Communications:</strong> messages or support requests you send to FreTraq
          </li>
        </ul>

        <h3 className="mt-6 text-base font-semibold text-slate-800">
          Information collected automatically
        </h3>
        <ul>
          <li>
            <strong>GPS location data:</strong> when a carrier activates tracking on an active
            load, we collect device GPS coordinates at regular intervals for the duration of
            that load. This data is used to provide the live tracking feature to the broker who
            posted the load.
          </li>
          <li>
            <strong>Usage data:</strong> pages visited, features used, timestamps, browser type,
            IP address, and device identifiers, collected through server logs and analytics tools
          </li>
          <li>
            <strong>Cookies and similar technologies:</strong> session cookies (required for
            authentication) and analytics cookies (which you may opt out of). See Section 8.
          </li>
        </ul>
      </Section>

      <Section title="3. How We Use Your Information">
        <p>We use the information we collect to:</p>
        <ul>
          <li>
            <strong>Operate the Platform:</strong> authenticate accounts, process subscriptions,
            match brokers and carriers, display load and bid information, and deliver GPS tracking
            data
          </li>
          <li>
            <strong>Verify carrier authority:</strong> cross-check submitted MC/USDOT numbers
            against FMCSA records to confirm active operating authority before a carrier can bid
            on loads
          </li>
          <li>
            <strong>Fraud prevention and trust:</strong> detect fictitious loads, double-brokering,
            impersonation, and other prohibited conduct; maintain carrier reputation scores
          </li>
          <li>
            <strong>Billing:</strong> process subscription payments and send invoices and receipts
            through Stripe
          </li>
          <li>
            <strong>Communications:</strong> send transactional notifications (bid alerts, load
            awards, account updates) via email and SMS; send service announcements and security
            notices
          </li>
          <li>
            <strong>Platform improvement:</strong> analyze usage patterns to improve features and
            fix bugs — using aggregated, de-identified data where possible
          </li>
          <li>
            <strong>Legal compliance:</strong> comply with applicable laws, respond to lawful
            requests from government authorities, and enforce our Terms of Service
          </li>
        </ul>
        <p>
          We do not sell your personal information to third parties. We do not use your data
          to train third-party AI models.
        </p>
      </Section>

      <Section title="4. Information We Share">
        <p>
          We share your information only as necessary to operate the Platform or as required by law:
        </p>

        <h3 className="mt-6 text-base font-semibold text-slate-800">Between users on the Platform</h3>
        <p>
          When a carrier bids on a load, the broker can see the carrier&rsquo;s company name,
          MC number, USDOT number, rating, and bid amount. When a broker awards a load, the
          carrier receives the broker&rsquo;s company name and contact information to coordinate
          pickup. We do not share personal email addresses or passwords between users.
        </p>

        <h3 className="mt-6 text-base font-semibold text-slate-800">Service providers (sub-processors)</h3>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left">
              <th className="pb-2 pr-4 font-semibold text-slate-700">Provider</th>
              <th className="pb-2 pr-4 font-semibold text-slate-700">Purpose</th>
              <th className="pb-2 font-semibold text-slate-700">Data shared</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {[
              {
                provider: 'Stripe',
                purpose: 'Payment processing, subscription billing',
                data: 'Name, email, billing address, payment method',
              },
              {
                provider: 'Twilio',
                purpose: 'SMS notifications (bid alerts, load updates)',
                data: 'Phone number, notification content',
              },
              {
                provider: 'Supabase',
                purpose: 'Database hosting and user authentication',
                data: 'All account and platform data (hosted on Supabase infrastructure)',
              },
              {
                provider: 'Mapbox',
                purpose: 'Map rendering and GPS route display',
                data: 'GPS coordinates for active load tracking sessions',
              },
            ].map((row) => (
              <tr key={row.provider}>
                <td className="py-2.5 pr-4 font-medium text-slate-800">{row.provider}</td>
                <td className="py-2.5 pr-4 text-slate-600">{row.purpose}</td>
                <td className="py-2.5 text-slate-600">{row.data}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-4">
          Each sub-processor is bound by a data processing agreement requiring them to handle
          your data only for the purposes listed above and in compliance with applicable privacy law.
        </p>

        <h3 className="mt-6 text-base font-semibold text-slate-800">Legal requirements</h3>
        <p>
          We may disclose information if required by law, court order, or a valid government
          request, or if we believe in good faith that disclosure is necessary to protect the
          rights, property, or safety of FreTraq, our users, or the public.
        </p>

        <h3 className="mt-6 text-base font-semibold text-slate-800">Business transfers</h3>
        <p>
          If FreTraq is acquired, merges with another company, or sells substantially all of
          its assets, your information may be transferred as part of that transaction. We will
          notify you by email and post a notice on the Platform before your data is transferred
          and becomes subject to a different privacy policy.
        </p>
      </Section>

      <Section title="5. Data Retention">
        <p>We retain your information for as long as your account is active or as needed to:</p>
        <ul>
          <li>Provide you the Platform services</li>
          <li>Comply with legal obligations (e.g., tax and financial record requirements)</li>
          <li>Resolve disputes and enforce our agreements</li>
        </ul>
        <p>Specific retention periods:</p>
        <ul>
          <li>
            <strong>Account data</strong> (name, email, company): retained until you request
            deletion or your account is terminated, plus 30 days to allow recovery
          </li>
          <li>
            <strong>Load and bid records:</strong> retained for 3 years from the date of the
            transaction for dispute resolution purposes
          </li>
          <li>
            <strong>GPS location pings:</strong> retained for 90 days from the date of the
            tracked load, then permanently deleted
          </li>
          <li>
            <strong>Payment records:</strong> retained for 7 years as required by tax law
            (raw card data is never stored by FreTraq)
          </li>
          <li>
            <strong>Support communications:</strong> retained for 2 years
          </li>
        </ul>
      </Section>

      <Section title="6. Your Rights and Choices">
        <p>
          Depending on your location, you may have the following rights regarding your personal
          information:
        </p>
        <ul>
          <li>
            <strong>Access:</strong> request a copy of the personal information we hold about you
          </li>
          <li>
            <strong>Correction:</strong> request correction of inaccurate or incomplete information
          </li>
          <li>
            <strong>Deletion:</strong> request deletion of your account and personal data, subject
            to our retention obligations described above. To delete your account, email
            privacy@fretraq.com with the subject line &ldquo;Delete my account.&rdquo;
          </li>
          <li>
            <strong>Portability:</strong> request a machine-readable export of your account
            data (load history, bid history)
          </li>
          <li>
            <strong>Opt out of marketing:</strong> unsubscribe from marketing emails using
            the link in any marketing email, or email privacy@fretraq.com. Transactional
            notifications (bid alerts, payment receipts) cannot be opted out of while your
            account is active.
          </li>
        </ul>
        <p>
          To exercise any of these rights, contact us at{' '}
          <a href="mailto:privacy@fretraq.com" className="text-[#1a3a5c] underline">
            privacy@fretraq.com
          </a>
          . We will respond within 30 days.
        </p>
        <p>
          California residents may have additional rights under the California Consumer Privacy
          Act (CCPA). We do not sell personal information and do not share it for cross-context
          behavioral advertising.
        </p>
      </Section>

      <Section title="7. Data Security">
        <p>
          We implement technical and organizational measures to protect your information,
          including TLS encryption in transit, encrypted storage for sensitive fields, access
          controls limiting data access to authorized personnel, and row-level security on our
          database so users can only access their own organization&rsquo;s data.
        </p>
        <p>
          No method of transmission or storage is 100% secure. If you discover a security
          vulnerability, please report it responsibly to security@fretraq.com.
        </p>
      </Section>

      <Section title="8. Cookies">
        <p>We use the following cookies:</p>
        <ul>
          <li>
            <strong>Authentication cookies</strong> (required): session tokens set by Supabase
            Auth to keep you logged in. These are necessary for the Platform to function and
            cannot be disabled.
          </li>
          <li>
            <strong>Analytics cookies</strong> (optional): we may use privacy-respecting
            analytics to understand how the Platform is used in aggregate. These do not
            track you across other websites.
          </li>
        </ul>
        <p>
          You can disable non-essential cookies in your browser settings. Disabling authentication
          cookies will prevent you from logging in.
        </p>
      </Section>

      <Section title="9. Children's Privacy">
        <p>
          The Platform is not directed at children under 18. We do not knowingly collect
          personal information from anyone under 18. If you believe we have inadvertently
          collected such information, contact us at privacy@fretraq.com and we will delete it.
        </p>
      </Section>

      <Section title="10. Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. We will notify you of material
          changes by email or by posting a notice on the Platform at least 14 days before the
          changes take effect. The updated policy will be identified by a new effective date at
          the top of this page.
        </p>
      </Section>

      <Section title="11. Contact Us">
        <p>
          For privacy questions or to exercise your rights, contact:{' '}
          <a href="mailto:privacy@fretraq.com" className="text-[#1a3a5c] underline">
            privacy@fretraq.com
          </a>
        </p>
        <p>
          FreTraq, Inc.<br />
          fretraq.com
        </p>
      </Section>
    </article>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 text-xl font-bold text-slate-900 [font-family:var(--font-dm-serif)]">
        {title}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed text-slate-600">{children}</div>
    </section>
  )
}
