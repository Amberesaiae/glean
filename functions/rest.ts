// Thin Supabase REST helper for the Worker. Every call carries the caller's
// access token, so Row Level Security is still the ultimate guard — the Worker
// adds validation, shaping, and friendly errors on top.

export type Env = {
  EXPO_PUBLIC_SUPABASE_URL: string;
  EXPO_PUBLIC_SUPABASE_ANON_KEY: string;
  /** JWT secret from Supabase project settings → API → JWT Secret */
  SUPABASE_JWT_SECRET?: string;
  DO?: Fetcher;
};

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export interface AuthedUser {
  id: string;
  email: string | null;
}

/**
 * Encodes a dynamic value before embedding it in a PostgREST filter string.
 * PostgREST filter values must be URL-encoded when passed as query parameters,
 * especially UUIDs/slugs that might contain characters that break query parsing.
 * Always wrap user-supplied values (ids, slugs, keys) with this helper.
 *
 * Example: `user_id=eq.${encodeFilterValue(user.id)}`
 */
export function encodeFilterValue(value: string): string {
  return encodeURIComponent(value);
}


function baseHeaders(env: Env, token: string): Record<string, string> {
  return {
    apikey: env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

/* -------------------------------------------------------------------------- */
/* Local JWT verification via Web Crypto API                                  */
/* -------------------------------------------------------------------------- */

/**
 * Decode a base64url string to a Uint8Array, handling standard base64 padding.
 */
function base64UrlToUint8Array(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), "=");
  const binary = atob(padded);
  return new Uint8Array([...binary].map((c) => c.charCodeAt(0)));
}

/**
 * Verify a Supabase JWT locally using HMAC-SHA256 (HS256).
 * Returns the decoded payload if valid, throws HttpError 401 if invalid or
 * expired. Falls back to a remote auth check when SUPABASE_JWT_SECRET is not
 * set — this allows zero-config deploys while still supporting the optimised
 * path once the secret is wired in.
 */
async function verifyJwtLocally(
  env: Env,
  token: string,
): Promise<{ sub: string; email?: string }> {
  const secret = env.SUPABASE_JWT_SECRET;
  if (!secret) {
    // Fallback: call the Supabase auth endpoint (original behaviour).
    const res = await fetch(`${env.EXPO_PUBLIC_SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new HttpError(401, "Your session has expired. Please sign in again.");
    const user = (await res.json()) as { id?: string; email?: string };
    if (!user?.id) throw new HttpError(401, "Your session has expired. Please sign in again.");
    return { sub: user.id, email: user.email };
  }

  // --- Local HMAC-SHA256 path ---
  const parts = token.split(".");
  if (parts.length !== 3) throw new HttpError(401, "Invalid token format.");

  const [rawHeader, rawPayload, rawSig] = parts;

  // Import the HMAC key from the raw secret bytes.
  const keyData = new TextEncoder().encode(secret);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );

  // Verify the signature over `header.payload`.
  const signingInput = new TextEncoder().encode(`${rawHeader}.${rawPayload}`);
  const signature = base64UrlToUint8Array(rawSig);
  const valid = await crypto.subtle.verify("HMAC", cryptoKey, signature, signingInput);
  if (!valid) throw new HttpError(401, "Invalid token signature.");

  // Decode and validate standard claims.
  const payload = JSON.parse(
    new TextDecoder().decode(base64UrlToUint8Array(rawPayload)),
  ) as { sub?: string; email?: string; exp?: number; role?: string };

  if (payload.exp && payload.exp * 1000 < Date.now()) {
    throw new HttpError(401, "Your session has expired. Please sign in again.");
  }
  if (!payload.sub) throw new HttpError(401, "Invalid token: missing subject.");

  // Reject anonymous tokens — only authenticated users may mutate data.
  if (payload.role === "anon") {
    throw new HttpError(401, "You need to be signed in.");
  }

  return { sub: payload.sub, email: payload.email };
}

/** Verify the bearer token and return the signed-in user, or throw 401. */
export async function requireUser(env: Env, token: string): Promise<AuthedUser> {
  if (!token) throw new HttpError(401, "You need to be signed in.");
  const claims = await verifyJwtLocally(env, token);
  return { id: claims.sub, email: claims.email ?? null };
}

async function parseError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { message?: string; hint?: string };
    return body?.message || body?.hint || `Request failed (${res.status}).`;
  } catch {
    return `Request failed (${res.status}).`;
  }
}

export class Rest {
  constructor(private env: Env, private token: string) {}

  async insert<T = unknown>(table: string, row: Record<string, unknown>): Promise<T> {
    const res = await fetch(`${this.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: { ...baseHeaders(this.env, this.token), Prefer: "return=representation" },
      body: JSON.stringify(row),
    });
    if (!res.ok) throw new HttpError(res.status === 401 || res.status === 403 ? 403 : 400, await parseError(res));
    const data = (await res.json()) as T[];
    return data[0] as T;
  }

  /**
   * Idempotent insert: on a unique-key conflict (e.g. a retried/double-tapped
   * create carrying the same client token) it returns the existing row instead
   * of creating a duplicate. `onConflict` is the unique index's columns.
   */
  async insertIdempotent<T = unknown>(
    table: string,
    row: Record<string, unknown>,
    onConflict: string,
  ): Promise<T> {
    const res = await fetch(
      `${this.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/${table}?on_conflict=${onConflict}`,
      {
        method: "POST",
        headers: {
          ...baseHeaders(this.env, this.token),
          Prefer: "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify(row),
      },
    );
    if (!res.ok) throw new HttpError(res.status === 401 || res.status === 403 ? 403 : 400, await parseError(res));
    const data = (await res.json()) as T[];
    return data[0] as T;
  }

  /** Whether at least one row matches the filter. Used for DB-authoritative toggles. */
  async exists(table: string, filter: string): Promise<boolean> {
    const rows = await this.select<{ count?: number }>(table, `${filter}&select=*&limit=1`);
    return rows.length > 0;
  }

  async update(table: string, filter: string, patch: Record<string, unknown>): Promise<void> {
    const res = await fetch(`${this.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/${table}?${filter}`, {
      method: "PATCH",
      headers: baseHeaders(this.env, this.token),
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new HttpError(400, await parseError(res));
  }

  async upsert(table: string, row: Record<string, unknown>, onConflict: string): Promise<void> {
    const res = await fetch(
      `${this.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/${table}?on_conflict=${onConflict}`,
      {
        method: "POST",
        headers: { ...baseHeaders(this.env, this.token), Prefer: "resolution=ignore-duplicates" },
        body: JSON.stringify(row),
      },
    );
    if (!res.ok) throw new HttpError(400, await parseError(res));
  }

  async remove(table: string, filter: string): Promise<void> {
    const res = await fetch(`${this.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/${table}?${filter}`, {
      method: "DELETE",
      headers: baseHeaders(this.env, this.token),
    });
    if (!res.ok) throw new HttpError(400, await parseError(res));
  }

  async select<T = unknown>(table: string, query: string): Promise<T[]> {
    const res = await fetch(`${this.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/${table}?${query}`, {
      headers: baseHeaders(this.env, this.token),
    });
    if (!res.ok) throw new HttpError(400, await parseError(res));
    return (await res.json()) as T[];
  }
}

/* --------------------------- validation helpers --------------------------- */

export function str(value: unknown, field: string, opts?: { max?: number; min?: number }): string {
  if (typeof value !== "string") throw new HttpError(422, `${field} is required.`);
  const trimmed = value.trim();
  const min = opts?.min ?? 1;
  if (trimmed.length < min) throw new HttpError(422, `${field} can't be empty.`);
  if (opts?.max && trimmed.length > opts.max)
    throw new HttpError(422, `${field} is too long (max ${opts.max} characters).`);
  return trimmed;
}

export function optStr(value: unknown, field: string, max = 4000): string | null {
  if (value === undefined || value === null || value === "") return null;
  return str(value, field, { max });
}

export function num(value: unknown, field: string, opts?: { min?: number }): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) throw new HttpError(422, `${field} must be a number.`);
  if (opts?.min !== undefined && n < opts.min) throw new HttpError(422, `${field} must be at least ${opts.min}.`);
  return n;
}

export function oneOf<T extends string>(value: unknown, allowed: readonly T[], field: string): T {
  if (typeof value !== "string" || !allowed.includes(value as T))
    throw new HttpError(422, `${field} is invalid.`);
  return value as T;
}
