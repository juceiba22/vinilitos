const RESEND_API_URL = "https://api.resend.com/emails";

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

// Usa Resend (https://resend.com) vía su API HTTP simple, sin SDK. Sin
// RESEND_API_KEY configurada, cae a loguear el mail en consola — así el
// flujo se puede probar en desarrollo sin dar de alta una cuenta.
export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "Vinilitos <onboarding@resend.dev>";

  if (!apiKey) {
    console.log(
      `[email:dev] No hay RESEND_API_KEY configurada, se loguea en vez de enviar.\nPara: ${to}\nAsunto: ${subject}\n${html}`
    );
    return;
  }

  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Resend respondió ${res.status}: ${text}`);
  }
}
