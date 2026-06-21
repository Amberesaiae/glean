import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/src/integrations/supabase/types";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * A fetch wrapper that transparently retries transient network failures
 * ("TypeError: Failed to fetch"), which intermittently hit token auto-refresh
 * and queries on the web preview when a request is dropped. Retrying a couple of
 * times with a short backoff keeps these blips from surfacing as visible errors.
 */
const resilientFetch: typeof fetch = async (input, init) => {
  const maxAttempts = 3;
  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return await fetch(input, init);
    } catch (error) {
      lastError = error;
      // Only network/"Failed to fetch" errors throw here; HTTP errors resolve.
      if (attempt < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
      }
    }
  }
  throw lastError;
};

/** Single shared Supabase client. supabase-js owns the session in native auth mode. */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: { fetch: resilientFetch },
});
