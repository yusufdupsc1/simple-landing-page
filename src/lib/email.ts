// src/lib/email.ts
// Email delivery via Resend (falls back to console.log in development)

import { env } from "@/lib/env";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

interface EmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

export async function sendEmail({ to, subject, html, from }: SendEmailOptions): Promise<EmailResult> {
  const sender = from ?? env.EMAIL_FROM;

  // Fallback: log to console when no API key is configured
  if (!env.RESEND_API_KEY) {
    console.log("\n📧 [DEV EMAIL] ─────────────────────────");
    console.log(`  To:      ${to}`);
    console.log(`  From:    ${sender}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Body:    ${html.replace(/<[^>]+>/g, "").slice(0, 300)}`);
    console.log("─────────────────────────────────────────\n");
    return { success: true, id: `dev-${Date.now()}` };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: sender, to, subject, html }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return { success: false, error: (err as { message?: string }).message ?? "Failed to send email" };
    }

    const data = (await response.json()) as { id: string };
    return { success: true, id: data.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[email] Send failed:", message);
    return { success: false, error: message };
  }
}

// ─── Branded email templates ───────────────────────────────────────────────

const baseLayout = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ScholaOPS</title>
</head>
<body style="margin:0;padding:0;background:#0f1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f1117;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#1a1d27;border:1px solid #2d3148;border-radius:12px;overflow:hidden;max-width:100%;">
          <!-- Header -->
          <tr>
            <td style="padding:28px 32px;border-bottom:1px solid #2d3148;">
              <span style="font-size:22px;font-weight:700;color:#7c6fff;letter-spacing:-0.5px;">ScholaOPS</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #2d3148;text-align:center;">
              <p style="margin:0;font-size:12px;color:#6b7280;">
                © ${new Date().getFullYear()} ScholaOPS · Precision School Management<br/>
                This email was sent automatically. Please do not reply.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const textStyle = "color:#e5e7eb;font-size:15px;line-height:1.6;margin:0 0 16px 0;";
const headingStyle = "color:#f9fafb;font-size:24px;font-weight:700;margin:0 0 12px 0;letter-spacing:-0.5px;";
const btnStyle = "display:inline-block;padding:12px 28px;background:#7c6fff;color:#fff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;margin:8px 0 24px;";
const mutedStyle = "color:#9ca3af;font-size:13px;line-height:1.5;margin:0;";

export function passwordResetEmail(resetUrl: string, expiresMinutes = 60) {
  return baseLayout(`
    <h1 style="${headingStyle}">Reset your password</h1>
    <p style="${textStyle}">We received a request to reset the password for your ScholaOPS account. Click the button below to choose a new password.</p>
    <a href="${resetUrl}" style="${btnStyle}">Reset Password</a>
    <p style="${mutedStyle}">This link will expire in ${expiresMinutes} minutes. If you didn't request a password reset, you can safely ignore this email — your password won't change.</p>
    <p style="${mutedStyle};margin-top:12px;">Or copy this URL into your browser:<br/>
      <span style="color:#7c6fff;word-break:break-all;">${resetUrl}</span>
    </p>
  `);
}

export function welcomeEmail(name: string, institutionName: string, loginUrl: string) {
  return baseLayout(`
    <h1 style="${headingStyle}">Welcome to ScholaOPS! 🎉</h1>
    <p style="${textStyle}">Hi ${name},</p>
    <p style="${textStyle}">Your account has been created for <strong style="color:#7c6fff;">${institutionName}</strong>. You can now sign in to access the dashboard.</p>
    <a href="${loginUrl}" style="${btnStyle}">Sign In Now</a>
    <p style="${mutedStyle}">If you have any questions, contact your institution administrator.</p>
  `);
}

export function newStudentEmail(studentName: string, studentId: string, institutionName: string) {
  return baseLayout(`
    <h1 style="${headingStyle}">New Student Enrolled</h1>
    <p style="${textStyle}">A new student has been registered at <strong style="color:#7c6fff;">${institutionName}</strong>.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#12141f;border:1px solid #2d3148;border-radius:8px;padding:16px;margin:16px 0;">
      <tr><td style="color:#9ca3af;font-size:13px;padding:4px 0;">Name</td><td style="color:#f9fafb;font-size:14px;font-weight:600;padding:4px 0;">${studentName}</td></tr>
      <tr><td style="color:#9ca3af;font-size:13px;padding:4px 0;">Student ID</td><td style="color:#7c6fff;font-size:14px;font-family:monospace;padding:4px 0;">${studentId}</td></tr>
    </table>
  `);
}
