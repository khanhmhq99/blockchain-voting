"use client";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { getSupabaseEnv } from "./env";

let client: ReturnType<typeof createBrowserClient<Database>> | undefined;
export function createClient() {
  const { url, anonKey } = getSupabaseEnv();
  client ??= createBrowserClient<Database>(url, anonKey);
  return client;
}
