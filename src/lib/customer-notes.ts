/**
 * Notas visibles para el cliente (voucher / confirmación).
 * Excluye metadatos internos de Stripe u otros sistemas.
 */
export function customerFacingNotes(notes?: string | null): string {
  if (!notes?.trim()) return "";

  const parts = notes
    .split(/\s*·\s*/)
    .map((p) => p.trim())
    .filter(Boolean)
    .filter((p) => {
      if (/^Stripe\s+session:/i.test(p)) return false;
      if (/^Stripe\s+PI:/i.test(p)) return false;
      if (/^(cs_test_|cs_live_|pi_)/i.test(p)) return false;
      return true;
    });

  return parts
    .join(" · ")
    .replace(/\s*Stripe\s+session:\s*\S+/gi, "")
    .replace(/\s*Stripe\s+PI:\s*\S+/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}
