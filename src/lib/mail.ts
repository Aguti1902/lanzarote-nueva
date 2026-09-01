/**
 * Envío de correo vía Resend (HTTPS).
 * Requiere RESEND_API_KEY en el entorno.
 * From por defecto: Lanzarote Experience Tours <onboarding@resend.dev>
 *   (cámbialo con MAIL_FROM cuando el dominio esté verificado en Resend).
 */

type SendEmailInput = {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
};

export type SendEmailResult =
  | { ok: true; id?: string; skipped?: boolean }
  | { ok: false; error: string };

function fromAddress() {
  return (
    process.env.MAIL_FROM?.trim() ||
    "Lanzarote Experience Tours <onboarding@resend.dev>"
  );
}

export async function sendEmail(
  input: SendEmailInput
): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.warn(
      "[mail] RESEND_API_KEY no configurada; email no enviado:",
      input.subject,
      "→",
      input.to
    );
    return { ok: true, skipped: true };
  }

  const to = Array.isArray(input.to) ? input.to : [input.to];
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress(),
        to,
        subject: input.subject,
        text: input.text,
        html: input.html || undefined,
        reply_to: input.replyTo || undefined,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
      error?: { message?: string };
    };
    if (!res.ok) {
      const msg =
        data.error?.message || data.message || `HTTP ${res.status}`;
      console.error("[mail] Resend error:", msg);
      return { ok: false, error: msg };
    }
    return { ok: true, id: data.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error de red";
    console.error("[mail] send failed:", msg);
    return { ok: false, error: msg };
  }
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function textToHtml(text: string) {
  return `<pre style="font-family:ui-sans-serif,system-ui,sans-serif;white-space:pre-wrap;line-height:1.5">${escapeHtml(text)}</pre>`;
}
