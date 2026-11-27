
import { resend, RESEND_FROM_EMAIL } from "../../config/resend.js";

export async function sendTestEmail(toEmail: string) {
  const { data, error } = await resend.emails.send({
    from: RESEND_FROM_EMAIL,
    to: toEmail,
    subject: "Resend Integration Test",
    html: `
      <h2>Hello!</h2>
      <p>Your Employee Management SaaS backend
      is successfully connected to Resend.</p>
      <p>This is your first test email.</p>
    `,
  });

  if (error) {
    console.error("Resend email error:", error);
    throw new Error(error.message);
  }

  console.log("Test email accepted by Resend:", data?.id);

  return data;
}
