import { Resend } from "resend";
import dotenv from "dotenv";
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendTestEmail() {
  console.log("Sending test email via Resend API...");
  console.log("API Key prefix:", process.env.RESEND_API_KEY?.substring(0, 10) + "...");
  
  try {
    const { data, error } = await resend.emails.send({
      from: "EAS Platform <noreply@easlearn.org>",
      to: ["eas@eautomatedstaffing.com"],
      subject: "EAS Platform — Test Email Delivery",
      html: `
        <div style="background-color: #060906; padding: 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="max-width: 500px; margin: 0 auto; background-color: #0d120d; border: 1px solid rgba(55, 65, 55, 0.4); border-radius: 16px; padding: 40px; text-align: center;">
            <div style="margin-bottom: 24px;">
              <span style="color: #34d399; font-size: 24px; font-weight: bold;">⚡ EAS</span>
            </div>
            <h1 style="color: #ffffff; font-size: 20px; margin: 0 0 16px 0;">Email Delivery Test</h1>
            <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
              This is a test email from the EAS Platform to confirm that Resend email delivery is working correctly.
            </p>
            <div style="background-color: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.15); border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <p style="color: #34d399; font-size: 14px; font-weight: 600; margin: 0;">✓ Email delivery is working</p>
            </div>
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              Sent at: ${new Date().toISOString()}<br>
              From: noreply@easlearn.org
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("❌ Resend API Error:", JSON.stringify(error, null, 2));
      return;
    }

    console.log("✅ Email sent successfully!");
    console.log("   Message ID:", data?.id);
    console.log("   Sent to: eas@eautomatedstaffing.com");
    console.log("   From: noreply@easlearn.org");
  } catch (err) {
    console.error("❌ Exception:", err.message);
  }
}

sendTestEmail();
