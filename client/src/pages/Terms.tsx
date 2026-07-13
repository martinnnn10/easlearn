/**
 * Terms of Service Page
 * Legal terms governing use of EAS platform
 */
import SEO from "@/components/SEO";

export default function Terms() {
  return (
    <div>
      <SEO
        title="Terms of Service"
        description="Terms of Service for Electrical Automation Services platform. Read our usage policies, intellectual property protections, and subscription terms."
        path="/terms"
      />

      <section className="py-20 sm:py-28">
        <div className="container max-w-3xl">
          <h1 className="text-3xl font-heading text-white tracking-wide mb-2">
            TERMS OF SERVICE
          </h1>
          <p className="font-mono-industrial text-[11px] text-[oklch(0.45_0.006_250)] tracking-wider mb-10">
            LAST UPDATED: MAY 2026
          </p>

          <div className="space-y-8 text-[14px] text-[oklch(0.7_0.008_250)] leading-relaxed">
            <div>
              <h2 className="text-lg font-heading text-white tracking-wide mb-3">1. ACCEPTANCE OF TERMS</h2>
              <p>
                By accessing or using the Electrical Automation Services, Inc. ("EAS") platform, website, simulator, 
                training materials, and related services (collectively, the "Service"), you agree to be bound by these 
                Terms of Service. If you do not agree to these terms, do not use the Service.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-heading text-white tracking-wide mb-3">2. INTELLECTUAL PROPERTY</h2>
              <p className="mb-3">
                All content on this platform — including but not limited to troubleshooting scenarios, decision trees, 
                scoring algorithms, training materials, assessment frameworks, AI-generated content, user interface designs, 
                source code, graphics, logos, and text — is the exclusive property of Electrical Automation Services, Inc. 
                and is protected by United States copyright, trademark, and intellectual property laws.
              </p>
              <p className="mb-3">
                <strong className="text-white">Prohibited activities include:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-[oklch(0.6_0.008_250)]">
                <li>Copying, reproducing, or redistributing any scenario content, decision trees, or training materials</li>
                <li>Reverse-engineering, decompiling, or attempting to extract the source code or algorithms</li>
                <li>Scraping, crawling, or using automated tools to collect content from the platform</li>
                <li>Creating derivative works based on EAS scenarios or training methodology</li>
                <li>Sharing login credentials or subscription access with unauthorized users</li>
                <li>Recording, screenshotting, or capturing simulator sessions for redistribution</li>
                <li>Using any content for competing products or services</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-heading text-white tracking-wide mb-3">3. SUBSCRIPTION & PAYMENT</h2>
              <p className="mb-3">
                Access to premium features requires a paid subscription. By subscribing, you agree to:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-[oklch(0.6_0.008_250)]">
                <li>Pay all applicable fees at the rates in effect when charges are incurred</li>
                <li>Provide accurate and complete billing information</li>
                <li>Accept that subscriptions auto-renew unless canceled before the renewal date</li>
                <li>Understand that refunds are handled on a case-by-case basis at EAS's discretion</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-heading text-white tracking-wide mb-3">4. CANDIDATE ASSESSMENTS</h2>
              <p>
                Assessment results are confidential and shared only with the party that issued the assessment 
                invitation. Candidates may not share, reproduce, or discuss specific assessment scenarios or questions 
                with third parties. Violation of assessment confidentiality may result in disqualification and legal action.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-heading text-white tracking-wide mb-3">5. USER CONDUCT</h2>
              <p>You agree not to:</p>
              <ul className="list-disc list-inside space-y-1.5 text-[oklch(0.6_0.008_250)] mt-2">
                <li>Use the Service for any unlawful purpose</li>
                <li>Attempt to gain unauthorized access to any part of the Service</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Transmit viruses, malware, or other harmful code</li>
                <li>Impersonate another person or entity</li>
                <li>Use the Service to develop a competing product</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-heading text-white tracking-wide mb-3">6. LIMITATION OF LIABILITY</h2>
              <p>
                The Service is provided "as is" without warranties of any kind. EAS shall not be liable for any 
                indirect, incidental, special, consequential, or punitive damages arising from your use of the Service. 
                Our total liability shall not exceed the amount paid by you in the twelve (12) months preceding the claim.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-heading text-white tracking-wide mb-3">7. TERMINATION</h2>
              <p>
                EAS reserves the right to suspend or terminate your access to the Service at any time, with or without 
                cause, including for violation of these Terms. Upon termination, your right to use the Service ceases 
                immediately, and any content or data associated with your account may be deleted.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-heading text-white tracking-wide mb-3">8. GOVERNING LAW</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the State of Illinois, 
                without regard to its conflict of law provisions. Any disputes arising under these Terms shall be 
                resolved in the courts located in Will County, Illinois.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-heading text-white tracking-wide mb-3">9. CONTACT</h2>
              <p>
                For questions about these Terms, contact us at:
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
                Unauthorized reproduction or distribution of any content on this platform is strictly prohibited 
                and may result in civil and criminal penalties.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
