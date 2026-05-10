import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | FreTraq',
  description: 'FreTraq Terms of Service — governing your use of the FreTraq freight marketplace platform.',
}

const EFFECTIVE_DATE = 'May 10, 2026'

export default function TermsPage() {
  return (
    <article className="prose prose-slate max-w-none [font-family:var(--font-dm-sans)]">
      <div className="mb-10 border-b border-slate-200 pb-8">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Legal
        </p>
        <h1 className="mb-2 text-4xl font-bold tracking-tight text-slate-900 [font-family:var(--font-dm-serif)]">
          Terms of Service
        </h1>
        <p className="text-sm text-slate-500">Effective date: {EFFECTIVE_DATE}</p>
      </div>

      <Section title="1. Agreement to Terms">
        <p>
          These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of the FreTraq
          platform, including our website at fretraq.com and any associated mobile or web
          applications (collectively, the &ldquo;Platform&rdquo;), operated by FreTraq, Inc.
          (&ldquo;FreTraq,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;).
        </p>
        <p>
          By creating an account or using the Platform, you agree to be bound by these Terms and
          our Privacy Policy. If you do not agree, do not use the Platform.
        </p>
        <p>
          If you are using the Platform on behalf of a company or other legal entity, you represent
          that you have the authority to bind that entity to these Terms.
        </p>
      </Section>

      <Section title="2. What FreTraq Is — and Is Not">
        <p>
          <strong>FreTraq is a technology marketplace</strong>, not a freight broker, freight
          forwarder, carrier, shipper, or transportation intermediary as those terms are defined
          under 49 U.S.C. § 13102 or any applicable federal or state law.
        </p>
        <p>
          FreTraq does not arrange, broker, or otherwise facilitate the actual transportation of
          freight. FreTraq provides software tools that allow licensed freight brokers to post
          load opportunities and licensed motor carriers to submit bids on those opportunities.
          Any freight transaction that results from activity on the Platform is a direct agreement
          solely between the broker and the carrier. FreTraq is not a party to any such agreement.
        </p>
        <p>
          FreTraq does not hold shipper funds, does not issue bills of lading, and does not assume
          any liability for cargo loss, damage, delay, or any other claim arising from the physical
          transportation of freight.
        </p>
      </Section>

      <Section title="3. Eligibility and Account Registration">
        <p>You must be at least 18 years old to use the Platform. By registering, you represent:</p>
        <ul>
          <li>All information you provide is accurate and current;</li>
          <li>You will maintain the accuracy of your account information;</li>
          <li>
            Your use of the Platform will comply with all applicable federal, state, and local laws
            and regulations.
          </li>
        </ul>
        <p>
          You are responsible for maintaining the confidentiality of your login credentials and
          for all activity that occurs under your account. Notify us immediately at
          support@fretraq.com if you suspect unauthorized access.
        </p>
      </Section>

      <Section title="4. User Responsibilities">
        <h3 className="mt-6 text-base font-semibold text-slate-800">Brokers</h3>
        <p>
          If you register as a freight broker, you represent and warrant that:
        </p>
        <ul>
          <li>
            You hold a valid federal freight broker license (FMCSA Broker Authority) or operate
            under a valid brokerage license in your applicable jurisdiction;
          </li>
          <li>
            Every load you post on the Platform represents a genuine, lawful freight shipment that
            you have authority to broker;
          </li>
          <li>
            You will not post fictitious, fraudulent, or duplicate loads for any purpose including
            market testing, data harvesting, or competitor research;
          </li>
          <li>
            You will honor awarded bids and complete any load transaction you commit to through
            the Platform absent documented force majeure or shipper cancellation;
          </li>
          <li>
            You will carry the required surety bond or trust fund as required by 49 C.F.R. § 387.307.
          </li>
        </ul>

        <h3 className="mt-6 text-base font-semibold text-slate-800">Carriers</h3>
        <p>
          If you register as a motor carrier, you represent and warrant that:
        </p>
        <ul>
          <li>
            You hold active FMCSA operating authority (MC number) and a valid USDOT number, and
            you will notify FreTraq immediately if your authority is revoked, suspended, or
            otherwise inactive;
          </li>
          <li>
            All drivers operating under loads sourced through the Platform hold valid commercial
            driver&rsquo;s licenses and comply with Hours of Service regulations;
          </li>
          <li>
            You maintain the minimum insurance coverage required by federal law ($750,000 general
            liability for property freight; $1,000,000 for hazmat) and will provide certificates
            of insurance upon request;
          </li>
          <li>
            You will not double-broker or re-broker any load received through the Platform without
            the prior written consent of the originating broker.
          </li>
        </ul>

        <h3 className="mt-6 text-base font-semibold text-slate-800">All Users</h3>
        <ul>
          <li>You will not use the Platform to collect competitor pricing data through automated means;</li>
          <li>You will not circumvent FreTraq&rsquo;s marketplace to take a broker-carrier relationship off-platform after initial introduction to avoid fees;</li>
          <li>You will not harass, threaten, or engage in abusive conduct toward other users.</li>
        </ul>
      </Section>

      <Section title="5. Subscriptions, Billing, and Cancellation">
        <p>
          Access to certain features of the Platform requires a paid subscription. By subscribing,
          you authorize FreTraq (through its payment processor, Stripe) to charge your payment
          method on a recurring monthly basis at the then-current subscription rate.
        </p>
        <p>
          <strong>Current plans:</strong> Broker ($149/month), Carrier ($49/month). FreTraq
          reserves the right to change subscription pricing with at least 30 days&rsquo; written
          notice to subscribers.
        </p>
        <p>
          <strong>Cancellation:</strong> You may cancel your subscription at any time through your
          account settings or by contacting support@fretraq.com. Cancellation takes effect at the
          end of your current billing period. You will retain access to paid features through the
          end of the period for which you have paid.
        </p>
        <p>
          <strong>No refunds.</strong> Except where required by applicable law, all subscription
          fees are non-refundable. FreTraq does not prorate partial-month cancellations.
        </p>
        <p>
          If a payment fails, we may suspend your access until the outstanding balance is resolved.
          Accounts with outstanding balances past 30 days may be terminated.
        </p>
      </Section>

      <Section title="6. Intellectual Property">
        <p>
          The Platform and all content, features, and functionality — including but not limited to
          software, text, graphics, logos, and data compilations — are owned by FreTraq or its
          licensors and are protected by copyright, trademark, and other intellectual property
          laws.
        </p>
        <p>
          You retain ownership of any content you submit to the Platform (load details, company
          information, etc.). By submitting content, you grant FreTraq a non-exclusive, worldwide,
          royalty-free license to use that content to operate and improve the Platform, including
          for fraud detection and carrier verification purposes.
        </p>
      </Section>

      <Section title="7. Disclaimer of Warranties">
        <p>
          THE PLATFORM IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT
          WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
          WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
          NON-INFRINGEMENT.
        </p>
        <p>
          FreTraq does not warrant that the Platform will be uninterrupted or error-free, that
          defects will be corrected, that carrier FMCSA data shown on the Platform is current or
          accurate (FMCSA data is sourced from third-party government databases and may be delayed),
          or that any particular load or bid will result in a completed freight transaction.
        </p>
      </Section>

      <Section title="8. Limitation of Liability">
        <p>
          TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT WILL FRETRAQ, ITS
          DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
          CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFITS, LOST REVENUE, CARGO LOSS
          OR DAMAGE, OR LOSS OF DATA, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE
          PLATFORM, EVEN IF FRETRAQ HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
        </p>
        <p>
          FreTraq&rsquo;s total aggregate liability to you for any claims arising out of or
          relating to these Terms or the Platform shall not exceed the greater of (a) the total
          fees paid by you to FreTraq in the three months immediately preceding the event giving
          rise to the claim, or (b) one hundred dollars ($100).
        </p>
      </Section>

      <Section title="9. Indemnification">
        <p>
          You agree to defend, indemnify, and hold harmless FreTraq and its officers, directors,
          employees, and agents from and against any claims, liabilities, damages, judgments,
          awards, losses, costs, expenses, or fees (including reasonable attorneys&rsquo; fees)
          arising out of or relating to: (a) your use of the Platform; (b) your breach of these
          Terms; (c) your violation of any applicable law or regulation, including FMCSA
          regulations; or (d) any freight transaction you enter into through the Platform.
        </p>
      </Section>

      <Section title="10. Governing Law and Dispute Resolution">
        <p>
          These Terms are governed by the laws of the State of California, without regard to its
          conflict of law provisions. Any dispute arising out of or relating to these Terms or
          the Platform shall be resolved exclusively in the state or federal courts located in
          San Francisco County, California, and you consent to personal jurisdiction in those courts.
        </p>
        <p>
          Before filing any claim, you agree to first contact FreTraq at legal@fretraq.com and
          attempt to resolve the dispute informally for at least 30 days.
        </p>
      </Section>

      <Section title="11. Changes to These Terms">
        <p>
          FreTraq may update these Terms from time to time. We will notify you of material changes
          by email or by posting a notice on the Platform at least 14 days before the changes take
          effect. Your continued use of the Platform after the effective date constitutes acceptance
          of the updated Terms.
        </p>
      </Section>

      <Section title="12. Contact">
        <p>
          Questions about these Terms? Contact us at{' '}
          <a href="mailto:legal@fretraq.com" className="text-[#1a3a5c] underline">
            legal@fretraq.com
          </a>
          .
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
