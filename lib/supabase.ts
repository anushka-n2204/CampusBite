import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireEnv } from "./env";

let client: SupabaseClient | null = null;

/**
 * Students often copy the URL with "/rest/v1/" or a trailing slash.
 * Supabase needs only the base address, for example https://abcdxyz.supabase.co
 */
function cleanSupabaseUrl(raw: string): string {
  return raw.trim().replace(/\/+$/, "").replace(/\/rest\/v1$/i, "").replace(/\/+$/, "");
}

/**
 * Server-side Supabase client.
 * It uses the secret (service_role) key, so use it ONLY in API routes and agent tools.
 */
export function getSupabase(): SupabaseClient {
  if (!client) {
    const secretKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
      requireEnv("SUPABASE_SECRET_KEY");
    client = createClient(cleanSupabaseUrl(requireEnv("SUPABASE_URL")), secretKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
