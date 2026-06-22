import { supabase } from "@/lib/supabase";

const BACKEND_URL = process.env.EXPO_PUBLIC_RORK_FUNCTIONS_URL ?? "";

// Assert startup environment variables are present.
if (!BACKEND_URL) {
  console.warn("[callApi] EXPO_PUBLIC_RORK_FUNCTIONS_URL is not set. API calls will fail.");
}

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

/** Helper to delay execution */
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Calls the Glean server layer. Every data-changing action in the app goes
 * through here: it attaches the signed-in user's access token, sends JSON, and
 * surfaces the server's friendly error message if the action is rejected.
 * Retries network-level failures with exponential backoff up to 3 times.
 */
export async function callApi<T = unknown>(
  path: string,
  body?: Record<string, unknown>,
  retries = 3,
  delay = 300,
): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("You need to be signed in.");
  if (!BACKEND_URL) {
    throw new Error("Application configuration error: Backend URL is missing.");
  }

  let res: Response | null = null;
  let lastError: unknown = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      res = await fetch(`${BACKEND_URL}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body ?? {}),
      });
      break; // Success, break the retry loop
    } catch (err) {
      lastError = err;
      if (attempt < retries - 1) {
        await wait(delay * Math.pow(2, attempt)); // Exponential backoff
      }
    }
  }

  if (!res) {
    throw new Error(
      lastError instanceof Error
        ? `Network problem: ${lastError.message}`
        : "Network problem — check your connection and try again.",
    );
  }

  const payload = (await res.json().catch(() => null)) as ApiResponse<T> | null;
  if (!res.ok || !payload?.ok) {
    throw new Error(payload?.error ?? "Something went wrong. Please try again.");
  }
  return payload.data as T;
}
