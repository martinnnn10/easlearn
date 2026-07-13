/**
 * Privacy Policy Page
 * Data handling and privacy practices for EAS platform
 */
import SEO from "@/components/SEO";

export default function Privacy() {
  return (
    <div>
      <SEO
        title="Privacy Policy"
        description="Privacy Policy for Electrical Automation Services. Learn how we collect, use, and protect your personal information."
        path="/privacy"
      />

      <section className="py-20 sm:py-28">
        <div className="container max-w-3xl">
          <h1 className="text-3xl font-heading text-white tracking-wide mb-2">
            PRIVACY POLICY
          </h1>
          <p className="font-mono-industrial text-[11px] text-[oklch(0.45_0.006_250)] tracking-wider mb-10">
            LAST UPDATED: MAY 2026
          </p>

          <div className="space-y-8 text-[14px] text-[oklch(0.7_0.008_250)] leading-relaxed">
            <div>
              <h2 className="text-lg font-heading text-white tracking-wide mb-3">1. INFORMATION WE COLLECT</h2>
              <p className="mb-3">
                Electrical Automation Services, Inc. ("EAS," "we," "our") collects information you provide directly:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-[oklch(0.6_0.008_250)]">
                <li>Account information (name, email address) when you sign up</li>
                <li>Contact form submissions (name, email, company, message)</li>
                <li>Payment information processed securely through Stripe</li>
                <li>Assessment results and simulator performance data</li>
                <li>Usage data including pages visited, features used, and session duration</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-heading text-white tracking-wide mb-3">2. HOW WE USE YOUR INFORMATION</h2>
              <ul className="list-disc list-inside space-y-1.5 text-[oklch(0.6_0.008_250)]">
                <li>To provide and maintain the Service</li>
                <li>To process payments and manage subscriptions</li>
                <li>To communicate with you about your account or inquiries</li>
                <li>To generate assessment reports for assessment clients</li>
                <li>To improve our training scenarios and platform features</li>
                <li>To detect and prevent fraud or unauthorized access</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-heading text-white tracking-wide mb-3">3. DATA SHARING</h2>
              <p className="mb-3">We do not sell your personal information. We may share data with:</p>
              <ul className="list-disc list-inside space-y-1.5 text-[oklch(0.6_0.008_250)]">
                <li><strong className="text-white">Stripe</strong> — for payment processing (subject to Stripe's privacy policy)</li>
                <li><strong className="text-white">Assessment clients</strong> — assessment results are shared with the party that issued the assessment invitation</li>
                <li><strong className="text-white">Service providers</strong> — hosting, analytics, and infrastructure partners who assist in operating the platform</li>
                <li><strong className="text-white">Legal requirements</strong> — when required by law, court order, or governmental regulation</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-heading text-white tracking-wide mb-3">4. DATA SECURITY</h2>
              <p>
                We implement industry-standard security measures to protect your information, including encrypted 
                connections (TLS/SSL), secure authentication, and access controls. However, no method of transmission 
                over the internet is 100% secure, and we cannot guarantee absolute security.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-heading text-white tracking-wide mb-3">5. DATA RETENTION</h2>
              <p>
                We retain your personal information for as long as your account is active or as needed to provide 
                services. Assessment results are retained for the duration specified by the issuing party. 
                You may request deletion of your account and associated data by contacting us.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-heading text-white tracking-wide mb-3">6. YOUR RIGHTS</h2>
              <p className="mb-3">You have the right to:</p>
              <ul className="list-disc list-inside space-y-1.5 text-[oklch(0.6_0.008_250)]">
                <li>Access the personal information we hold about you</li>
                <li>Request correction of inaccurate information</li>
                <li>Request deletion of your account and data</li>
                <li>Opt out of marketing communications</li>
                <li>Export your data in a portable format</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-heading text-white tracking-wide mb-3">7. COOKIES & TRACKING</h2>
              <p>
                We use essential cookies for authentication and session management. We may use analytics tools 
                to understand how the platform is used. You can control cookie settings through your browser preferences.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-heading text-white tracking-wide mb-3">8. INTERNATIONAL DATA TRANSFERS</h2>
              <p>
                Your information may be transferred to and processed in the United States or other countries where our 
                service providers operate. We ensure appropriate safeguards are in place for international transfers 
                in accordance with applicable data protection laws.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-heading text-white tracking-wide mb-3">9. GDPR RIGHTS (EEA/UK RESIDENTS)</h2>
              <p className="mb-3">
                If you are located in the European Economic Area (EEA) or the United Kingdom, you have additional rights under the General Data Protection Regulation (GDPR):
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-[oklch(0.6_0.008_250)]">
                <li><strong className="text-white">Legal basis for processing:</strong> We process your data based on consent (account creation), contract performance (providing services), and legitimate interests (platform improvement, fraud prevention).</li>
                <li><strong className="text-white">Right to restrict processing:</strong> You may request that we limit how we use your data.</li>
                <li><strong className="text-white">Right to data portability:</strong> You may request a copy of your data in a structured, machine-readable format.</li>
                <li><strong className="text-white">Right to object:</strong> You may object to processing based on legitimate interests.</li>
                <li><strong className="text-white">Right to lodge a complaint:</strong> You may file a complaint with your local data protection authority.</li>
                <li><strong className="text-white">Data Protection Officer:</strong> For GDPR-related inquiries, use our <a href="/contact" className="text-[oklch(0.55_0.12_155)] hover:underline">contact form</a>.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-heading text-white tracking-wide mb-3">10. CCPA RIGHTS (CALIFORNIA RESIDENTS)</h2>
              <p className="mb-3">
                If you are a California resident, the California Consumer Privacy Act (CCPA) provides you with additional rights:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-[oklch(0.6_0.008_250)]">
                <li><strong className="text-white">Right to know:</strong> You may request disclosure of the categories and specific pieces of personal information we have collected about you.</li>
                <li><strong className="text-white">Right to delete:</strong> You may request deletion of your personal information, subject to certain exceptions.</li>
                <li><strong className="text-white">Right to opt-out of sale:</strong> We do not sell your personal information. If this changes, we will provide a "Do Not Sell My Personal Information" link.</li>
                <li><strong className="text-white">Right to non-discrimination:</strong> We will not discriminate against you for exercising your CCPA rights.</li>
              </ul>
              <p className="mt-3">
                To exercise your CCPA rights, submit a request through our{" "}
                <a href="/contact" className="text-[oklch(0.55_0.12_155)] hover:underline">contact form</a>.
                We will respond to verifiable requests within 45 days.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-heading text-white tracking-wide mb-3">11. CHILDREN'S PRIVACY</h2>
              <p>
                Our platform is not directed to individuals under the age of 16. We do not knowingly collect personal 
                information from children. If you believe we have inadvertently collected information from a child, 
                please contact us immediately and we will take steps to delete it.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-heading text-white tracking-wide mb-3">12. CONTACT</h2>
              <p>
                For privacy-related inquiries or to exercise your rights, contact us at:
              </p>
              <div className="mt-3 p-4 bg-[oklch(0.08_0.003_250)] border border-[oklch(0.18_0.004_250)] rounded">
                <p className="text-white font-semibold">Electrical Automation Services, Inc.</p>
                <p className="text-[oklch(0.55_0.008_250)]">
                  <a href="/contact" className="hover:text-white transition-colors">Contact form</a>
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-[oklch(0.18_0.004_250)]">
              <p className="text-[12px] text-[oklch(0.45_0.006_250)]">
                &copy; {new Date().getFullYear()} Electrical Automation Services, Inc. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
