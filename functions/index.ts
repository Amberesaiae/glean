// Glean backend — a validating server layer in front of the Supabase database.
// Every data-changing action goes through here: the Worker verifies the caller,
// validates the input, then writes via Supabase REST using the caller's own
// access token (so Row Level Security stays the final guard). Reads and realtime
// stay on the client (RLS-protected); this layer owns the writes.

import {
  type AuthedUser,
  type Env,
  encodeFilterValue,
  HttpError,
  num,
  oneOf,
  optStr,
  Rest,
  requireUser,
  str,
} from "./rest";

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const MATERIALS = ["plastics", "organic", "metals", "textiles", "other"] as const;
const REGIONS = [
  "Greater Accra", "Ashanti", "Western", "Central", "Eastern", "Volta",
  "Northern", "Upper East", "Upper West", "Bono", "Bono East", "Ahafo",
  "Savannah", "North East", "Oti", "Western North",
] as const;
const EVENT_TYPES = ["event", "forum", "job fair"] as const;
const FREQUENCIES = ["daily", "weekly", "monthly"] as const;
const LISTING_STATUS = ["active", "fulfilled", "deleted", "expired"] as const;
const ROLES = ["collector", "maker", "processor", "farmer", "anchor"] as const;
const UNITS = ["kg", "bag-small", "bag-medium", "bag-large", "crate", "bale", "tons", "bags"] as const;

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

function bearer(request: Request): string {
  const header = request.headers.get("Authorization") ?? "";
  return header.startsWith("Bearer ") ? header.slice(7) : "";
}

type Handler = (body: Record<string, unknown>, ctx: { rest: Rest; user: AuthedUser }) => Promise<unknown>;

function deriveHandle(seed: string, id: string): string {
  const slug = seed.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 20);
  const base = slug.length > 1 ? slug : "member";
  return `${base}_${id.slice(0, 4)}`;
}

const routes: Record<string, Handler> = {
  "/profile.ensure": async (body, { rest, user }) => {
    const name = optStr(body.name, "Name", 80) ?? (user.email ? user.email.split("@")[0] : "New member");
    await rest.upsert(
      "profiles",
      {
        id: user.id,
        email: user.email,
        name,
        handle: deriveHandle(name, user.id),
      },
      "id",
    );
    return { ok: true };
  },

  "/profile.update": async (body, { rest, user }) => {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.name !== undefined) patch.name = str(body.name, "Name", { max: 80 });
    if (body.bio !== undefined) patch.bio = optStr(body.bio, "Bio", 500) ?? "";
    if (body.trade !== undefined) patch.trade = optStr(body.trade, "Trade", 120) ?? "";
    if (body.region !== undefined) patch.region = oneOf(body.region, REGIONS, "Region");
    if (body.role !== undefined) patch.role = oneOf(body.role, ROLES, "Role");
    if (body.avatar !== undefined) patch.avatar_url = optStr(body.avatar, "Avatar", 2000);
    await rest.update("profiles", `id=eq.${encodeFilterValue(user.id)}`, patch);
    return { updated: true };
  },

  "/listings.create": async (body, { rest, user }) => {
    const row = {
      author_id: user.id,
      kind: oneOf(body.kind, ["have", "need"] as const, "Type"),
      title: str(body.title, "Title", { max: 120 }),
      material: oneOf(body.material, MATERIALS, "Material"),
      quantity: num(body.quantity, "Quantity", { min: 0 }),
      unit: optStr(body.unit, "Unit", 20) ?? "kg",
      region: oneOf(body.region, REGIONS, "Region"),
      area: optStr(body.area, "Area", 120) ?? "",
      description: optStr(body.description, "Description", 2000) ?? "",
      photo: optStr(body.photo, "Photo", 2000),
      price_per_unit: body.pricePerUnit == null ? null : num(body.pricePerUnit, "Price", { min: 0 }),
      recurring: body.recurring === true,
      frequency:
        body.recurring === true && body.frequency != null
          ? oneOf(body.frequency, FREQUENCIES, "Frequency")
          : null,
      lat: body.lat == null ? null : num(body.lat, "Latitude"),
      lng: body.lng == null ? null : num(body.lng, "Longitude"),
      client_token: optStr(body.clientToken, "Token", 64),
    };
    const data = row.client_token
      ? await rest.insertIdempotent<{ id: string }>("listings", row, "author_id,client_token")
      : await rest.insert<{ id: string }>("listings", row);
    return { id: data.id };
  },

  "/listings.update": async (body, { rest, user }) => {
    const id = str(body.id, "Listing");
    const patch: Record<string, unknown> = {};
    if (body.title !== undefined) patch.title = str(body.title, "Title", { max: 120 });
    if (body.material !== undefined) patch.material = oneOf(body.material, MATERIALS, "Material");
    if (body.quantity !== undefined) patch.quantity = num(body.quantity, "Quantity", { min: 0 });
    if (body.unit !== undefined) patch.unit = oneOf(body.unit, UNITS, "Unit");
    if (body.region !== undefined) patch.region = oneOf(body.region, REGIONS, "Region");
    if (body.area !== undefined) patch.area = optStr(body.area, "Area", 120) ?? "";
    if (body.description !== undefined) patch.description = optStr(body.description, "Description", 2000) ?? "";
    if (body.photo !== undefined) patch.photo = optStr(body.photo, "Photo", 2000);
    if (body.pricePerUnit !== undefined)
      patch.price_per_unit = body.pricePerUnit == null ? null : num(body.pricePerUnit, "Price", { min: 0 });
    if (body.recurring !== undefined) patch.recurring = body.recurring === true;
    if (body.frequency !== undefined)
      patch.frequency = body.frequency == null ? null : oneOf(body.frequency, FREQUENCIES, "Frequency");
    if (body.lat !== undefined) patch.lat = body.lat == null ? null : num(body.lat, "Latitude");
    if (body.lng !== undefined) patch.lng = body.lng == null ? null : num(body.lng, "Longitude");
    // author_id filter means RLS + ownership are both enforced.
    await rest.update("listings", `id=eq.${encodeFilterValue(id)}&author_id=eq.${encodeFilterValue(user.id)}`, patch);
    return { updated: true };
  },

  "/listings.status": async (body, { rest, user }) => {
    const id = str(body.id, "Listing");
    const status = oneOf(body.status, LISTING_STATUS, "Status");
    await rest.update("listings", `id=eq.${encodeFilterValue(id)}&author_id=eq.${encodeFilterValue(user.id)}`, { status });
    return { status };
  },

  "/listings.delete": async (body, { rest, user }) => {
    const id = str(body.id, "Listing");
    await rest.remove("listings", `id=eq.${encodeFilterValue(id)}&author_id=eq.${encodeFilterValue(user.id)}`);
    return { deleted: true };
  },

  "/deals.propose": async (body, { rest, user }) => {
    const counterparty = str(body.withUserId, "Recipient");
    if (counterparty === user.id) throw new HttpError(422, "You can’t make a deal with yourself.");
    const row = {
      conversation_id: optStr(body.conversationId, "Conversation", 80),
      listing_id: optStr(body.listingId, "Listing", 80),
      proposer_id: user.id,
      counterparty_id: counterparty,
      material: oneOf(body.material, MATERIALS, "Material"),
      quantity: num(body.quantity, "Quantity", { min: 0 }),
      unit: oneOf(body.unit, UNITS, "Unit"),
      status: "proposed",
    };
    const data = await rest.insert<{ id: string }>("deals", row);
    return { id: data.id };
  },

  // Only the counterparty (not the proposer) can confirm, and only while still
  // proposed — so no one can inflate their own numbers. The DB trigger credits
  // both profiles' kg/deals on confirmation.
  "/deals.confirm": async (body, { rest, user }) => {
    const id = str(body.dealId, "Deal");
    await rest.update(
      "deals",
      `id=eq.${encodeFilterValue(id)}&counterparty_id=eq.${encodeFilterValue(user.id)}&status=eq.proposed`,
      { status: "confirmed", confirmed_at: new Date().toISOString() },
    );
    return { confirmed: true };
  },

  "/deals.decline": async (body, { rest, user }) => {
    const id = str(body.dealId, "Deal");
    await rest.update(
      "deals",
      `id=eq.${encodeFilterValue(id)}&counterparty_id=eq.${encodeFilterValue(user.id)}&status=eq.proposed`,
      { status: "declined" },
    );
    return { declined: true };
  },

  "/conversations.read": async (body, { rest, user }) => {
    const conversationId = str(body.conversationId, "Conversation");
    await rest.insertIdempotent(
      "conversation_reads",
      { conversation_id: conversationId, user_id: user.id, last_read_at: new Date().toISOString() },
      "conversation_id,user_id",
    );
    return { ok: true };
  },

  "/hubs.follow": async (body, { rest, user }) => {
    const hubKey = str(body.hubKey, "Hub", { max: 120 });
    const filter = `user_id=eq.${encodeFilterValue(user.id)}&hub_key=eq.${encodeURIComponent(hubKey)}`;
    const following = await rest.exists("hub_follows", filter);
    if (following) {
      await rest.remove("hub_follows", filter);
    } else {
      await rest.upsert("hub_follows", { user_id: user.id, hub_key: hubKey }, "user_id,hub_key");
    }
    return { following: !following };
  },

  "/drives.create": async (body, { rest, user }) => {
    // RBAC check: only users with the 'anchor' role can create collection drives.
    const profiles = await rest.select<{ role: string }>("profiles", `id=eq.${encodeFilterValue(user.id)}&select=role`);
    const role = profiles[0]?.role;
    if (role !== "anchor") {
      throw new HttpError(403, "Only bulk buyers and collection anchors can create drives.");
    }

    const row = {
      organizer_id: user.id,
      title: str(body.title, "Title", { max: 120 }),
      material: oneOf(body.material, MATERIALS, "Material"),
      region: oneOf(body.region, REGIONS, "Region"),
      area: optStr(body.area, "Area", 120) ?? "",
      target_kg: num(body.targetKg, "Target", { min: 0 }),
      date: new Date(num(body.date, "Date")).toISOString(),
      note: optStr(body.note, "Note", 500) ?? "",
      status: "open",
    };
    const data = await rest.insert<{ id: string }>("drives", row);
    return { id: data.id };
  },

  "/drives.commit": async (body, { rest, user }) => {
    const driveId = str(body.driveId, "Drive");
    const amountKg = num(body.amountKg, "Amount", { min: 0 });
    await rest.insertIdempotent(
      "drive_commitments",
      { drive_id: driveId, user_id: user.id, amount_kg: amountKg, confirmed: body.confirmed === true },
      "drive_id,user_id",
    );
    return { ok: true };
  },

  "/drives.uncommit": async (body, { rest, user }) => {
    const driveId = str(body.driveId, "Drive");
    await rest.remove("drive_commitments", `drive_id=eq.${driveId}&user_id=eq.${user.id}`);
    return { ok: true };
  },

  "/feed.post": async (body, { rest, user }) => {
    const row = {
      author_id: user.id,
      text: str(body.text, "Post", { max: 2000 }),
      material: body.material == null ? null : oneOf(body.material, MATERIALS, "Material"),
      photo: optStr(body.photo, "Photo", 2000),
      client_token: optStr(body.clientToken, "Token", 64),
    };
    const data = row.client_token
      ? await rest.insertIdempotent<{ id: string }>("feed_posts", row, "author_id,client_token")
      : await rest.insert<{ id: string }>("feed_posts", row);
    return { id: data.id };
  },

  // The DB is the source of truth for the toggle: we read current state and flip
  // it, so stale client state can never produce the wrong result under races.
  "/feed.like": async (body, { rest, user }) => {
    const postId = str(body.postId, "Post");
    const filter = `post_id=eq.${encodeFilterValue(postId)}&user_id=eq.${encodeFilterValue(user.id)}`;
    const liked = await rest.exists("feed_likes", filter);
    if (liked) {
      await rest.remove("feed_likes", filter);
    } else {
      await rest.upsert("feed_likes", { post_id: postId, user_id: user.id }, "post_id,user_id");
    }
    return { liked: !liked };
  },

  "/feed.comment": async (body, { rest, user }) => {
    const row = {
      post_id: str(body.postId, "Post"),
      author_id: user.id,
      text: str(body.text, "Comment", { max: 1000 }),
    };
    const data = await rest.insert<{ id: string }>("feed_comments", row);
    return { id: data.id };
  },

  "/feed.flag": async (body, { rest, user }) => {
    const postId = str(body.postId, "Post");
    await rest.upsert("feed_flags", { post_id: postId, user_id: user.id }, "post_id,user_id");
    return { ok: true };
  },

  "/events.submit": async (body, { rest, user }) => {
    const row = {
      author_id: user.id,
      title: str(body.title, "Title", { max: 140 }),
      type: oneOf(body.type, EVENT_TYPES, "Type"),
      date: new Date(num(body.date, "Date")).toISOString(),
      region: oneOf(body.region, REGIONS, "Region"),
      location: optStr(body.location, "Location", 160) ?? "",
      organizer: optStr(body.organizer, "Organizer", 160) ?? "",
      description: optStr(body.description, "Description", 2000) ?? "",
      contact: optStr(body.contact, "Contact", 160) ?? "",
      photo: optStr(body.photo, "Photo", 2000),
      // New submissions always start in the moderation queue. Only a moderator
      // (service role) can transition status to approved/rejected.
      pending: true,
      status: "pending",
    };
    const data = await rest.insert<{ id: string }>("events", row);
    return { id: data.id };
  },

  "/conversations.ensure": async (body, { rest, user }) => {
    const withUserId = str(body.withUserId, "Recipient");
    if (withUserId === user.id) throw new HttpError(422, "You can’t message yourself.");
    const listingId = optStr(body.listingId, "Listing", 80);
    // Store the pair in a stable order so the unique index guarantees exactly
    // one conversation per pair, even under two simultaneous taps.
    const [a, b] = user.id < withUserId ? [user.id, withUserId] : [withUserId, user.id];
    const created = await rest.insertIdempotent<{ id: string }>(
      "conversations",
      { user_a: a, user_b: b, listing_id: listingId },
      "user_a,user_b",
    );
    return { id: created.id };
  },

  "/messages.send": async (body, { rest, user }) => {
    const conversationId = str(body.conversationId, "Conversation");
    const text = str(body.text, "Message", { max: 2000 });
    const clientToken = optStr(body.clientToken, "Token", 64);
    const row = {
      conversation_id: conversationId,
      sender_id: user.id,
      text,
      client_token: clientToken,
    };
    const data = clientToken
      ? await rest.insertIdempotent<{ id: string }>("messages", row, "sender_id,client_token")
      : await rest.insert<{ id: string }>("messages", row);
    await rest.update("conversations", `id=eq.${conversationId}`, {
      updated_at: new Date().toISOString(),
    });
    return { id: data.id };
  },

  "/saved.listing": async (body, { rest, user }) => {
    const listingId = str(body.listingId, "Listing");
    const filter = `user_id=eq.${encodeFilterValue(user.id)}&listing_id=eq.${encodeFilterValue(listingId)}`;
    const saved = await rest.exists("saved_listings", filter);
    if (saved) {
      await rest.remove("saved_listings", filter);
    } else {
      await rest.upsert("saved_listings", { user_id: user.id, listing_id: listingId }, "user_id,listing_id");
    }
    return { saved: !saved };
  },

  "/saved.post": async (body, { rest, user }) => {
    const postId = str(body.postId, "Post");
    const filter = `user_id=eq.${encodeFilterValue(user.id)}&post_id=eq.${encodeFilterValue(postId)}`;
    const saved = await rest.exists("saved_posts", filter);
    if (saved) {
      await rest.remove("saved_posts", filter);
    } else {
      await rest.upsert("saved_posts", { user_id: user.id, post_id: postId }, "user_id,post_id");
    }
    return { saved: !saved };
  },
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/health") return json({ ok: true, now: new Date().toISOString() });

    const handler = routes[path];
    if (!handler) return json({ ok: false, error: "Not found." }, 404);
    if (request.method !== "POST") return json({ ok: false, error: "Method not allowed." }, 405);

    try {
      const user = await requireUser(env, bearer(request));
      const rest = new Rest(env, bearer(request));
      let body: Record<string, unknown> = {};
      try {
        const raw = await request.text();
        body = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      } catch {
        throw new HttpError(422, "Invalid request body.");
      }
      const data = await handler(body, { rest, user });
      return json({ ok: true, data });
    } catch (err) {
      if (err instanceof HttpError) {
        return json({ ok: false, error: err.message }, err.status);
      }
      console.error("[glean] unhandled", err);
      return json({ ok: false, error: "Something went wrong. Please try again." }, 500);
    }
  },
};
