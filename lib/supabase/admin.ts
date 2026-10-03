import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Server-side Supabase administration is not configured.");
  return createClient<Database>(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
}
