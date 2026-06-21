import { supabase } from "@/lib/supabase";

const BACKEND_URL = process.env.EXPO_PUBLIC_RORK_FUNCTIONS_URL ?? "";

/**
 * A short idempotency key for a single logical create. Generate it once when a
 * draft/form is started and reuse it across retries: the server dedupes so a
 * double-tap or network retry can never create a duplicate record.
 */
export function newClientToken(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

/**
 * Calls the Glean server layer. Every data-changing action in the app goes
 * through here: it attaches the signed-in user's access token, sends JSON, and
 * surfaces the server's friendly error message if the action is rejected.
 */
export async function callApi<T = unknown>(
  path: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("You need to be signed in.");

  let res: Response;
  try {
    res = await fetch(`${BACKEND_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body ?? {}),
    });
  } catch {
    throw new Error("Network problem — check your connection and try again.");
  }

  const payload = (await res.json().catch(() => null)) as ApiResponse<T> | null;
  if (!res.ok || !payload?.ok) {
    throw new Error(payload?.error ?? "Something went wrong. Please try again.");
  }
  return payload.data as T;
}
