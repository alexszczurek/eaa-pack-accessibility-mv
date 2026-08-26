import { Resend } from "resend";

interface SendEmailArgs {
  to: string;
  subject: string;
  text: string;
}

/**
 * Sends an email via Resend when RESEND_API_KEY is configured; otherwise
 * prints the message to the console so the flow works without credentials.
 */
export async function sendEmail({ to, subject, text }: SendEmailArgs): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(
      [
        "",
        "================ EAA Pack email (RESEND_API_KEY not set) ================",
        `To:      ${to}`,
        `Subject: ${subject}`,
        "--------------------------------------------------------------------------",
        text,
        "==========================================================================",
        "",
      ].join("\n")
    );
    return;
  }
  const resend = new Resend(apiKey);
  const from = process.env.EMAIL_FROM || "EAA Pack <onboarding@resend.dev>";
  const { error } = await resend.emails.send({ from, to, subject, text });
  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
}
