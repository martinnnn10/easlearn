import { Resend } from "resend";
import { notifyOwner } from "./_core/notification";

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Sender addresses
const FROM_SUPPORT = "EAS Platform <support@easlearn.org>";
const FROM_NOREPLY = "EAS Platform <noreply@easlearn.org>";

// Base URL for links
function getBaseUrl(): string {
  return process.env.NODE_ENV === "production"
    ? "https://easlearn.org"
    : "http://localhost:3000";
}

// ─── Branded Email Template ───────────────────────────────────────────────────

function emailLayout(content: string, preheader: string = ""): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>EAS Platform</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100%; }
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; padding: 16px !important; }
      .content { padding: 24px 20px !important; }
      .button { padding: 14px 24px !important; font-size: 15px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #060906; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  ${preheader ? `<div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">${preheader}</div>` : ""}
  
  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #060906;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" class="container" width="560" cellpadding="0" cellspacing="0" style="max-width: 560px; width: 100%;">
          
          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 10px; padding: 10px 12px;">
                    <span style="color: #34d399; font-size: 20px; font-weight: bold;">⚡</span>
                  </td>
                  <td style="padding-left: 10px;">
                    <span style="color: #ffffff; font-size: 18px; font-weight: 700; letter-spacing: 0.5px;">EAS</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Main Content Card -->
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0d120d; border: 1px solid rgba(55, 65, 55, 0.4); border-radius: 16px; overflow: hidden;">
                <tr>
                  <td class="content" style="padding: 40px 36px;">
                    ${content}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding-top: 32px; text-align: center;">
              <p style="color: #6b7280; font-size: 12px; line-height: 1.5; margin: 0;">
                Electrical Automation Services, Inc.<br>
                Industrial training and troubleshooting simulation<br>
                built from real plant-floor experience.
              </p>
              <p style="color: #4b5563; font-size: 11px; margin-top: 16px;">
                This is an automated message from EAS Platform. Please do not reply directly to this email.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buttonHtml(text: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin: 28px auto;">
    <tr>
      <td align="center" style="border-radius: 8px; background-color: #059669;">
        <a href="${url}" class="button" target="_blank" style="display: inline-block; padding: 14px 32px; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 8px; background-color: #059669; mso-padding-alt: 0;">
          <!--[if mso]><i style="letter-spacing: 32px; mso-font-width: -100%; mso-text-raise: 21pt;">&nbsp;</i><![endif]-->
          <span style="mso-text-raise: 10pt;">${text}</span>
          <!--[if mso]><i style="letter-spacing: 32px; mso-font-width: -100%;">&nbsp;</i><![endif]-->
        </a>
      </td>
    </tr>
  </table>`;
}

// ─── Email Templates ──────────────────────────────────────────────────────────

function passwordResetTemplate(name: string, resetUrl: string): string {
  return emailLayout(`
    <h1 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 8px 0; text-align: center;">
      Reset Your Password
    </h1>
    <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
      Hi ${name}, we received a request to reset your password.
    </p>
    
    ${buttonHtml("Reset Password", resetUrl)}
    
    <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin: 0; text-align: center;">
      This link expires in <strong style="color: #9ca3af;">1 hour</strong>. If you didn't request this, you can safely ignore this email.
    </p>
    
    <hr style="border: none; border-top: 1px solid rgba(55, 65, 55, 0.3); margin: 24px 0;">
    
    <p style="color: #4b5563; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="${resetUrl}" style="color: #34d399; word-break: break-all; font-size: 11px;">${resetUrl}</a>
    </p>
  `, "Reset your EAS Platform password");
}

function emailVerificationTemplate(name: string, verifyUrl: string): string {
  return emailLayout(`
    <h1 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 8px 0; text-align: center;">
      Verify Your Email
    </h1>
    <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
      Hi ${name}, welcome to EAS Platform. Please verify your email address to activate your account.
    </p>
    
    ${buttonHtml("Verify Email Address", verifyUrl)}
    
    <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin: 0; text-align: center;">
      This link expires in <strong style="color: #9ca3af;">24 hours</strong>. If you didn't create an account, you can safely ignore this email.
    </p>
    
    <hr style="border: none; border-top: 1px solid rgba(55, 65, 55, 0.3); margin: 24px 0;">
    
    <p style="color: #4b5563; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="${verifyUrl}" style="color: #34d399; word-break: break-all; font-size: 11px;">${verifyUrl}</a>
    </p>
  `, "Verify your email to get started with EAS Platform");
}

function welcomeTemplate(name: string, loginUrl: string): string {
  return emailLayout(`
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 56px; height: 56px; line-height: 56px; border-radius: 50%; background-color: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); font-size: 24px; text-align: center;">
        ✓
      </div>
    </div>
    
    <h1 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 8px 0; text-align: center;">
      Welcome to EAS Platform
    </h1>
    <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin: 0 0 28px 0; text-align: center;">
      Hi ${name}, your email has been verified and your account is ready. You now have full access to industrial training simulations and courses.
    </p>
    
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
      <tr>
        <td style="padding: 16px; background-color: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.15); border-radius: 10px;">
          <p style="color: #d1d5db; font-size: 13px; line-height: 1.6; margin: 0;">
            <strong style="color: #ffffff;">What's next:</strong><br>
            • Explore hands-on troubleshooting simulations<br>
            • Access structured training programs<br>
            • Track your progress and earn certifications
          </p>
        </td>
      </tr>
    </table>
    
    ${buttonHtml("Start Learning", loginUrl)}
  `, "Your EAS Platform account is ready — start learning today");
}

// ─── Email Sending Functions ──────────────────────────────────────────────────

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  token: string
): Promise<SendEmailResult> {
  const baseUrl = getBaseUrl();
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;
  const html = passwordResetTemplate(name, resetUrl);

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_NOREPLY,
      to: [to],
      subject: "Reset Your Password — EAS Platform",
      html,
    });

    if (error) {
      console.error("[Email] Resend failed for password reset:", error);
      // Fallback: send via Manus notification to owner
      const fallbackResult = await sendPasswordResetViaNotification(to, name, resetUrl);
      return fallbackResult;
    }

    console.log(`[Email] Password reset sent to ${to}, messageId: ${data?.id}`);
    return { success: true, messageId: data?.id };
  } catch (err) {
    console.error("[Email] Exception sending password reset:", err);
    // Fallback: send via Manus notification to owner
    const fallbackResult = await sendPasswordResetViaNotification(to, name, resetUrl);
    return fallbackResult;
  }
}

/**
 * Fallback: sends password reset link via Manus notification system
 * This is used when Resend domain verification is pending/failed
 */
async function sendPasswordResetViaNotification(
  to: string,
  name: string,
  resetUrl: string
): Promise<SendEmailResult> {
  try {
    const sent = await notifyOwner({
      title: `Password Reset Request for ${to}`,
      content: `User ${name} (${to}) requested a password reset.\n\nReset link: ${resetUrl}\n\nPlease forward this link to the user. This link expires in 1 hour.\n\nNote: This notification is sent because Resend domain verification is pending. Once easlearn.org DKIM is verified, emails will be sent directly.`,
    });

    if (sent) {
      console.log(`[Email] Password reset sent via notification fallback for ${to}`);
      return { success: true, messageId: "notification-fallback" };
    } else {
      console.error("[Email] Notification fallback also failed");
      return { success: false, error: "All email delivery methods failed" };
    }
  } catch (err) {
    console.error("[Email] Notification fallback exception:", err);
    return { success: false, error: "All email delivery methods failed" };
  }
}

export async function sendVerificationEmail(
  to: string,
  name: string,
  token: string
): Promise<SendEmailResult> {
  const baseUrl = getBaseUrl();
  const verifyUrl = `${baseUrl}/verify-email?token=${token}`;
  const html = emailVerificationTemplate(name, verifyUrl);

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_NOREPLY,
      to: [to],
      subject: "Verify Your Email — EAS Platform",
      html,
    });

    if (error) {
      console.error("[Email] Failed to send verification:", error);
      return { success: false, error: error.message };
    }

    console.log(`[Email] Verification sent to ${to}, messageId: ${data?.id}`);
    return { success: true, messageId: data?.id };
  } catch (err) {
    console.error("[Email] Exception sending verification:", err);
    return { success: false, error: "Failed to send email" };
  }
}

export async function sendWelcomeEmail(
  to: string,
  name: string
): Promise<SendEmailResult> {
  const baseUrl = getBaseUrl();
  const loginUrl = `${baseUrl}/login`;
  const html = welcomeTemplate(name, loginUrl);

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_SUPPORT,
      to: [to],
      subject: "Welcome to EAS Platform — Your Account is Ready",
      html,
    });

    if (error) {
      console.error("[Email] Failed to send welcome:", error);
      return { success: false, error: error.message };
    }

    console.log(`[Email] Welcome email sent to ${to}, messageId: ${data?.id}`);
    return { success: true, messageId: data?.id };
  } catch (err) {
    console.error("[Email] Exception sending welcome:", err);
    return { success: false, error: "Failed to send email" };
  }
}
