/** Lee el cuerpo como JSON. Si el servidor devolvió texto (timeout, crash), no revienta el parseo. */
export async function readResponseJson(res: Response): Promise<{
  error?: string;
  checkoutUrl?: string;
  booking?: { id?: string };
  [key: string]: unknown;
}> {
  const raw = await res.text();
  if (!raw) return {};
  try {
    const data = JSON.parse(raw);
    if (data && typeof data === "object") return data;
    return {};
  } catch {
    return {};
  }
}
