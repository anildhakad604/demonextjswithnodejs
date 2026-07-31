import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

let transporterPromise: Promise<Transporter> | null = null;

function getTransporter(): Promise<Transporter> {
  if (transporterPromise) return transporterPromise;

  transporterPromise = (async () => {
    if (process.env.SMTP_HOST) {
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === "true",
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
      });
    }

    // Dev fallback: an auto-provisioned Ethereal test inbox. Nothing is
    // really delivered, but sendEmail() logs a preview URL to view it.
    const testAccount = await nodemailer.createTestAccount();
    console.log(`[email] No SMTP_HOST configured — using an Ethereal test inbox (${testAccount.user})`);
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
  })();

  return transporterPromise;
}

export async function sendEmail(opts: { to: string; subject: string; html: string }): Promise<void> {
  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"SweetyNX" <no-reply@sweetynx.example>',
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) console.log(`[email] "${opts.subject}" to ${opts.to} — preview: ${previewUrl}`);
  } catch (err) {
    // Email delivery is best-effort — never let a notification failure
    // break the request that triggered it (order creation, signup, etc.).
    console.error(`[email] Failed to send "${opts.subject}" to ${opts.to}:`, err);
  }
}
