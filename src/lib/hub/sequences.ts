import { getHubAdmin } from "./client";
import { isHubConfigured } from "./config";

export async function hubNextNumber(
  key: string,
  minNext: number
): Promise<number> {
  const sb = getHubAdmin();
  const { data, error } = await sb.rpc("hub_next_number", {
    p_key: key,
    p_min_next: minNext,
  });
  if (error) {
    throw new Error(`No se pudo reservar el número ${key}: ${error.message}`);
  }
  const n = Number(data);
  if (!Number.isFinite(n) || n < 1) {
    throw new Error(`Número de hub inválido para ${key}`);
  }
  return n;
}

export async function tryHubNextNumber(
  key: string,
  minNext: number
): Promise<number | null> {
  if (!isHubConfigured()) return null;
  return hubNextNumber(key, minNext);
}

export async function hubRaiseFloor(key: string, lastIssued: number): Promise<void> {
  if (!isHubConfigured()) return;
  const { error } = await getHubAdmin().rpc("hub_raise_floor", {
    p_key: key,
    p_last: lastIssued,
  });
  if (error) {
    console.error("[hub] raise floor failed", key, error.message);
  }
}
