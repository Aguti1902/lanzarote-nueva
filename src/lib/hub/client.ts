import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getHubServiceKey, getHubUrl, isHubConfigured } from "./config";

let hubClient: SupabaseClient | null = null;
let hubClientKey = "";

export function getHubAdmin(): SupabaseClient {
  const url = getHubUrl();
  const key = getHubServiceKey();
  if (!url || !key) {
    throw new Error(
      "Hub no configurado. Define HUB_SUPABASE_URL y HUB_SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  const cacheKey = `${url}::${key.slice(0, 12)}`;
  if (!hubClient || hubClientKey !== cacheKey) {
    hubClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    hubClientKey = cacheKey;
  }
  return hubClient;
}

export { isHubConfigured };
