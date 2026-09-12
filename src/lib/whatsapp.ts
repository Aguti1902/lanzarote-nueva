/** E.164 without + — Lanzarote Experience Tours */
export const WHATSAPP_PHONE = "34646080585";

const DEFAULT_TEXT: Record<string, string> = {
  es: "Hola, me gustaría información sobre excursiones o traslados en Lanzarote.",
  en: "Hello, I would like information about excursions or transfers in Lanzarote.",
  de: "Hallo, ich hätte gerne Informationen zu Ausflügen oder Transfers auf Lanzarote.",
};

function messageFor(locale = "es", text?: string): string {
  return (text?.trim() || DEFAULT_TEXT[locale] || DEFAULT_TEXT.es).slice(0, 500);
}

/**
 * Universal WhatsApp click-to-chat URL (works on iOS, desktop, and as Android fallback).
 * Prefer api.whatsapp.com over wa.me — on some Androids wa.me opens WhatsApp Business first.
 */
export function whatsappUrl(locale = "es", text?: string): string {
  const params = new URLSearchParams({
    phone: WHATSAPP_PHONE,
    text: messageFor(locale, text),
    type: "phone_number",
    app_absent: "0",
  });
  return `https://api.whatsapp.com/send/?${params.toString()}`;
}

/**
 * Android intent that targets WhatsApp Messenger (com.whatsapp), not WhatsApp Business.
 * Avoids the "number not registered in WhatsApp Business" system dialog.
 */
export function whatsappAndroidMessengerIntent(
  locale = "es",
  text?: string
): string {
  const msg = encodeURIComponent(messageFor(locale, text));
  return `intent://send?phone=${WHATSAPP_PHONE}&text=${msg}#Intent;scheme=whatsapp;package=com.whatsapp;S.browser_fallback_url=${encodeURIComponent(whatsappUrl(locale, text))};end`;
}

export function isAndroidUserAgent(ua?: string): boolean {
  const value = ua ?? (typeof navigator !== "undefined" ? navigator.userAgent : "");
  return /Android/i.test(value);
}
