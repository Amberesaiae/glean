import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";

import { callApi, newClientToken } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import type { EcoKey } from "@/components/illustrations";
import type { MaterialKey, Region } from "@/constants/colors";
import type {
  ClimateEvent,
  Conversation,
  Deal,
  DealStatus,
  Drive,
  DriveCommitment,
  DriveStatus,
  FeedComment,
  FeedPost,
  Guide,
  GuideIconKey,
  Listing,
  ListingKind,
  ListingStatus,
  Message,
  UserProfile,
  UserRole,
} from "@/types";

const ONBOARDED_KEY = "glean.onboarded.v1";
const ROLE_PICKED_KEY = "glean.rolePicked.v1";
const DEMO_THREADS_KEY = "glean.demoThreads.v1";
const DEMO_DEAL_KEY = "glean.demoDeal.v1";
const DEMO_FULFILLED_KEY = "glean.demoFulfilled.v1";

const MARKET_QUERY_KEY = "glean.marketQuery.v1";
const MARKET_KIND_KEY = "glean.marketKind.v1";
const MARKET_MATERIAL_KEY = "glean.marketMaterial.v1";
const MARKET_REGION_KEY = "glean.marketRegion.v1";
const MARKET_SHOW_REGIONS_KEY = "glean.marketShowRegions.v1";
const MARKET_VIEW_KEY = "glean.marketView.v1";
const MARKET_RADIUS_KEY = "glean.marketRadius.v1";

const FALLBACK_AVATAR =
  "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&q=70&auto=format&fit=crop";

const toMs = (value: string): number => new Date(value).getTime();

interface ProfileRow {
  id: string;
  name: string;
  handle: string;
  avatar_url: string | null;
  region: string;
  bio: string;
  trade: string;
  verified: boolean;
  official: boolean;
  role: string;
  joined_year: number;
  materials_moved_kg: number;
  deals: number;
}

function mapProfile(row: ProfileRow, listingCount: number): UserProfile {
  return {
    id: row.id,
    name: row.name,
    handle: row.handle,
    avatar: row.avatar_url ?? FALLBACK_AVATAR,
    region: row.region as Region,
    bio: row.bio,
    trade: row.trade,
    verified: row.verified,
    official: !!row.official,
    role: row.role as UserRole,
    joinedYear: row.joined_year,
    stats: {
      materialsMovedKg: Number(row.materials_moved_kg) || 0,
      listings: listingCount,
      deals: row.deals,
    },
  };
}

export const [AppProvider, useApp] = createContextHook(() => {
  const { userId, email, displayName, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  const [rolePicked, setRolePicked] = useState<boolean | null>(null);

  const [marketQuery, setMarketQuery] = useState<string>("");
  const [marketKind, setMarketKind] = useState<string>("all");
  const [marketMaterial, setMarketMaterial] = useState<string>("all");
  const [marketRegion, setMarketRegion] = useState<string>("all");
  const [marketShowRegions, setMarketShowRegions] = useState<boolean>(false);
  const [marketView, setMarketView] = useState<string>("list");
  const [marketRadius, setMarketRadius] = useState<any>("all");

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDED_KEY)
      .then((value) => setOnboarded(value === "true"))
      .catch(() => setOnboarded(false));
    AsyncStorage.getItem(ROLE_PICKED_KEY)
      .then((value) => setRolePicked(value === "true"))
      .catch(() => setRolePicked(false));

    // Load market filters on mount
    AsyncStorage.getItem(MARKET_QUERY_KEY).then(val => val !== null && setMarketQuery(val)).catch(() => {});
    AsyncStorage.getItem(MARKET_KIND_KEY).then(val => val !== null && setMarketKind(val)).catch(() => {});
    AsyncStorage.getItem(MARKET_MATERIAL_KEY).then(val => val !== null && setMarketMaterial(val)).catch(() => {});
    AsyncStorage.getItem(MARKET_REGION_KEY).then(val => val !== null && setMarketRegion(val)).catch(() => {});
    AsyncStorage.getItem(MARKET_SHOW_REGIONS_KEY).then(val => val !== null && setMarketShowRegions(val === "true")).catch(() => {});
    AsyncStorage.getItem(MARKET_VIEW_KEY).then(val => val !== null && setMarketView(val)).catch(() => {});
    AsyncStorage.getItem(MARKET_RADIUS_KEY).then(val => {
      if (val !== null) {
        try {
          setMarketRadius(JSON.parse(val));
        } catch {
          setMarketRadius(val);
        }
      }
    }).catch(() => {});
  }, []);

  const updateMarketQuery = useCallback((val: string) => {
    setMarketQuery(val);
    AsyncStorage.setItem(MARKET_QUERY_KEY, val).catch(() => {});
  }, []);

  const updateMarketKind = useCallback((val: string) => {
    setMarketKind(val);
    AsyncStorage.setItem(MARKET_KIND_KEY, val).catch(() => {});
  }, []);

  const updateMarketMaterial = useCallback((val: string) => {
    setMarketMaterial(val);
    AsyncStorage.setItem(MARKET_MATERIAL_KEY, val).catch(() => {});
  }, []);

  const updateMarketRegion = useCallback((val: string) => {
    setMarketRegion(val);
    AsyncStorage.setItem(MARKET_REGION_KEY, val).catch(() => {});
  }, []);

  const updateMarketShowRegions = useCallback((val: boolean) => {
    setMarketShowRegions(val);
    AsyncStorage.setItem(MARKET_SHOW_REGIONS_KEY, String(val)).catch(() => {});
  }, []);

  const updateMarketView = useCallback((val: string) => {
    setMarketView(val);
    AsyncStorage.setItem(MARKET_VIEW_KEY, val).catch(() => {});
  }, []);

  const updateMarketRadius = useCallback((val: any) => {
    setMarketRadius(val);
    AsyncStorage.setItem(MARKET_RADIUS_KEY, typeof val === "object" ? JSON.stringify(val) : String(val)).catch(() => {});
  }, []);

  const completeOnboarding = useCallback(() => {
    setOnboarded(true);
    AsyncStorage.setItem(ONBOARDED_KEY, "true").catch(() => {});
  }, []);

  const completeRolePick = useCallback(() => {
    setRolePicked(true);
    AsyncStorage.setItem(ROLE_PICKED_KEY, "true").catch(() => {});
  }, []);

  const invalidate = useCallback(
    (keys: string[]) => {
      for (const key of keys) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
    [queryClient],
  );

  // Guarantee a profile exists for the signed-in account. The DB trigger creates
  // one on signup; this server call self-heals accounts created before the
  // trigger (or after a reseed) without bypassing the server layer.
  useEffect(() => {
    if (!userId) return;
    callApi("/profile.ensure", { name: displayName ?? undefined })
      .then(() => invalidate(["profiles"]))
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "unknown";
        console.log("[profiles] ensure failed", message);
      });
  }, [userId, displayName, email, invalidate]);

  // Once per device, seed a couple of demo conversations so the inbox feels
  // alive on first open. The DB function is idempotent and only acts when the
  // user has no conversations yet, so it never disturbs real chats.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      try {
        const threadsDone = await AsyncStorage.getItem(DEMO_THREADS_KEY);
        if (!cancelled && threadsDone !== "true") {
          const { error } = await supabase.rpc("seed_demo_threads");
          if (error) throw error;
          await AsyncStorage.setItem(DEMO_THREADS_KEY, "true");
        }
        // A confirmed deal in one demo thread so the full deal-confirmation
        // flow is visible on first open. The DB function is idempotent and
        // only acts when the user has no deals yet.
        const dealDone = await AsyncStorage.getItem(DEMO_DEAL_KEY);
        if (!cancelled && dealDone !== "true") {
          const { error } = await supabase.rpc("seed_demo_deal");
          if (error) throw error;
          await AsyncStorage.setItem(DEMO_DEAL_KEY, "true");
        }
        // Close the loop: mark the listing tied to that confirmed deal as
        // fulfilled so the full lifecycle shows. Pool-safe and idempotent in
        // the DB, so it never collapses a "Supply near you" pool.
        const fulfilledDone = await AsyncStorage.getItem(DEMO_FULFILLED_KEY);
        if (!cancelled && fulfilledDone !== "true") {
          const { error } = await supabase.rpc("seed_demo_fulfilled");
          if (error) throw error;
          await AsyncStorage.setItem(DEMO_FULFILLED_KEY, "true");
        }
        if (!cancelled) invalidate(["conversations", "deals", "profiles", "listings"]);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "unknown";
        console.log("[conversations] demo seed skipped", message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, invalidate]);

  /* ------------------------------- Realtime ------------------------------- */

  useEffect(() => {
    if (!isAuthenticated) return;
    const channel = supabase
      .channel("glean-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "feed_posts" },
        () => invalidate(["feed"]),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "feed_likes" },
        () => invalidate(["feed"]),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "feed_comments" },
        () => invalidate(["feed"]),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "feed_flags" },
        () => invalidate(["feed"]),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "listings" },
        () => invalidate(["listings", "profiles"]),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events" },
        () => invalidate(["events"]),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "deals" },
        () => invalidate(["deals", "profiles"]),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "drives" },
        () => invalidate(["drives"]),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "drive_commitments" },
        () => invalidate(["drives"]),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversation_reads" },
        () => invalidate(["reads"]),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "hub_follows" },
        () => invalidate(["hubFollows"]),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "saved_listings" },
        () => queryClient.invalidateQueries({ queryKey: ["saved"] }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "saved_posts" },
        () => queryClient.invalidateQueries({ queryKey: ["saved"] }),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, invalidate]);

  /* ----------------------------- Queries ----------------------------- */

  const listingsQuery = useQuery({
    queryKey: ["listings"],
    enabled: isAuthenticated,
    queryFn: async (): Promise<Listing[]> => {
      const { data, error } = await supabase
        .from("listings")
        .select(
          "id,kind,title,material,quantity,unit,region,area,description,photo,author_id,created_at,price_per_unit,recurring,frequency,lat,lng,status",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row) => ({
        id: row.id,
        kind: row.kind as ListingKind,
        title: row.title,
        material: row.material as MaterialKey,
        quantity: Number(row.quantity) || 0,
        unit: row.unit,
        region: row.region as Region,
        area: row.area,
        description: row.description,
        photo: row.photo ?? undefined,
        authorId: row.author_id,
        createdAt: toMs(row.created_at),
        pricePerUnit:
          row.price_per_unit != null ? Number(row.price_per_unit) : undefined,
        recurring: !!row.recurring,
        frequency:
          (row.frequency as Listing["frequency"] | null) ?? undefined,
        lat: row.lat != null ? Number(row.lat) : undefined,
        lng: row.lng != null ? Number(row.lng) : undefined,
        status: ((row.status as ListingStatus | null) ?? "active"),
      }));
    },
  });

  const profilesQuery = useQuery({
    queryKey: ["profiles"],
    enabled: isAuthenticated,
    queryFn: async (): Promise<ProfileRow[]> => {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id,name,handle,avatar_url,region,bio,trade,verified,official,role,joined_year,materials_moved_kg,deals",
        );
      if (error) throw error;
      return (data ?? []) as ProfileRow[];
    },
  });

  const guidesQuery = useQuery({
    queryKey: ["guides"],
    enabled: isAuthenticated,
    queryFn: async (): Promise<Guide[]> => {
      const { data, error } = await supabase
        .from("guides")
        .select(
          "id,title,material,read_minutes,summary,body,sponsor,icon,illustration,hero_image,video_url",
        )
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((row): Guide => ({
        id: row.id,
        title: row.title,
        material: row.material as MaterialKey,
        readMinutes: Number(row.read_minutes) || 4,
        summary: row.summary,
        body: row.body,
        sponsor: row.sponsor ?? undefined,
        icon: row.icon as GuideIconKey,
        illustration: row.illustration as EcoKey,
        heroImage: row.hero_image ?? undefined,
        videoUrl: row.video_url ?? undefined,
      }));
    },
  });

  const feedQuery = useQuery({
    queryKey: ["feed", userId],
    enabled: isAuthenticated,
    queryFn: async (): Promise<FeedPost[]> => {
      const { data, error } = await supabase
        .from("feed_posts")
        .select(
          "id,author_id,text,material,photo,created_at,feed_comments(id,author_id,text,created_at),feed_likes(user_id),feed_flags(user_id)",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row): FeedPost => {
        const likes = (row.feed_likes ?? []) as { user_id: string }[];
        const flags = (row.feed_flags ?? []) as { user_id: string }[];
        const comments = ((row.feed_comments ?? []) as {
          id: string;
          author_id: string;
          text: string;
          created_at: string;
        }[])
          .map(
            (c): FeedComment => ({
              id: c.id,
              authorId: c.author_id,
              text: c.text,
              createdAt: toMs(c.created_at),
            }),
          )
          .sort((a, b) => a.createdAt - b.createdAt);
        return {
          id: row.id,
          authorId: row.author_id,
          text: row.text,
          material: (row.material as MaterialKey | null) ?? undefined,
          photo: row.photo ?? undefined,
          createdAt: toMs(row.created_at),
          likes: likes.length,
          likedByMe: !!userId && likes.some((l) => l.user_id === userId),
          comments,
          flagged: flags.length > 0 || undefined,
        };
      });
    },
  });

  const eventsQuery = useQuery({
    queryKey: ["events"],
    enabled: isAuthenticated,
    queryFn: async (): Promise<ClimateEvent[]> => {
      const { data, error } = await supabase
        .from("events")
        .select(
          "id,title,type,date,region,location,organizer,description,contact,photo,pending,status,author_id",
        )
        // Show approved events (pending=false) or events owned by the current user.
        .or(`pending.eq.false,author_id.eq.${userId}`)
        .order("date", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((row): ClimateEvent => ({
        id: row.id,
        title: row.title,
        type: row.type as ClimateEvent["type"],
        date: toMs(row.date),
        region: row.region as Region,
        location: row.location,
        organizer: row.organizer,
        description: row.description,
        contact: row.contact,
        photo: row.photo ?? undefined,
        pending: row.pending,
      }));
    },
  });

  const conversationsQuery = useQuery({
    queryKey: ["conversations", userId],
    enabled: isAuthenticated && !!userId,
    queryFn: async (): Promise<Conversation[]> => {
      const { data, error } = await supabase
        .from("conversations")
        .select(
          "id,user_a,user_b,listing_id,updated_at,messages(id,sender_id,text,created_at)",
        )
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row): Conversation => {
        const withUserId = row.user_a === userId ? row.user_b : row.user_a;
        const messages = ((row.messages ?? []) as {
          id: string;
          sender_id: string;
          text: string;
          created_at: string;
        }[])
          .map(
            (m): Message => ({
              id: m.id,
              fromMe: m.sender_id === userId,
              text: m.text,
              createdAt: toMs(m.created_at),
            }),
          )
          .sort((a, b) => a.createdAt - b.createdAt);
        return {
          id: row.id,
          withUserId,
          listingId: row.listing_id ?? undefined,
          messages,
        };
      });
    },
  });

  const savedQuery = useQuery({
    queryKey: ["saved", userId],
    enabled: isAuthenticated && !!userId,
    queryFn: async (): Promise<{ listings: string[]; posts: string[] }> => {
      const [l, p] = await Promise.all([
        supabase.from("saved_listings").select("listing_id"),
        supabase.from("saved_posts").select("post_id"),
      ]);
      if (l.error) throw l.error;
      if (p.error) throw p.error;
      return {
        listings: (l.data ?? []).map((r) => r.listing_id),
        posts: (p.data ?? []).map((r) => r.post_id),
      };
    },
  });

  const dealsQuery = useQuery({
    queryKey: ["deals", userId],
    enabled: isAuthenticated && !!userId,
    queryFn: async (): Promise<Deal[]> => {
      const { data, error } = await supabase
        .from("deals")
        .select(
          "id,conversation_id,listing_id,proposer_id,counterparty_id,material,quantity,unit,status,created_at,confirmed_at",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row): Deal => ({
        id: row.id,
        conversationId: row.conversation_id ?? undefined,
        listingId: row.listing_id ?? undefined,
        proposerId: row.proposer_id,
        counterpartyId: row.counterparty_id,
        material: row.material as MaterialKey,
        quantity: Number(row.quantity) || 0,
        unit: row.unit,
        status: row.status as DealStatus,
        createdAt: toMs(row.created_at),
        confirmedAt: row.confirmed_at ? toMs(row.confirmed_at) : undefined,
      }));
    },
  });

  const readsQuery = useQuery({
    queryKey: ["reads", userId],
    enabled: isAuthenticated && !!userId,
    queryFn: async (): Promise<Record<string, number>> => {
      const { data, error } = await supabase
        .from("conversation_reads")
        .select("conversation_id,last_read_at");
      if (error) throw error;
      const map: Record<string, number> = {};
      for (const r of data ?? []) map[r.conversation_id] = toMs(r.last_read_at);
      return map;
    },
  });

  const hubFollowsQuery = useQuery({
    queryKey: ["hubFollows", userId],
    enabled: isAuthenticated && !!userId,
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase.from("hub_follows").select("hub_key");
      if (error) throw error;
      return (data ?? []).map((r) => r.hub_key);
    },
  });

  const drivesQuery = useQuery({
    queryKey: ["drives"],
    enabled: isAuthenticated,
    queryFn: async (): Promise<Drive[]> => {
      const { data, error } = await supabase
        .from("drives")
        .select(
          "id,organizer_id,title,material,region,area,target_kg,date,note,status,created_at,drive_commitments(drive_id,user_id,amount_kg,confirmed)",
        )
        .order("date", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((row): Drive => ({
        id: row.id,
        organizerId: row.organizer_id,
        title: row.title,
        material: row.material as MaterialKey,
        region: row.region as Region,
        area: row.area,
        targetKg: Number(row.target_kg) || 0,
        date: toMs(row.date),
        note: row.note,
        status: row.status as DriveStatus,
        createdAt: toMs(row.created_at),
        commitments: ((row.drive_commitments ?? []) as {
          drive_id: string;
          user_id: string;
          amount_kg: number;
          confirmed: boolean;
        }[]).map(
          (c): DriveCommitment => ({
            driveId: c.drive_id,
            userId: c.user_id,
            amountKg: Number(c.amount_kg) || 0,
            confirmed: !!c.confirmed,
          }),
        ),
      }));
    },
  });

  const listings = useMemo<Listing[]>(
    () => listingsQuery.data ?? [],
    [listingsQuery.data],
  );

  /** Only active supply — what live discovery (market, map, pools) should show. */
  const liveListings = useMemo<Listing[]>(
    () => listings.filter((l) => l.status === "active"),
    [listings],
  );

  const listingCountByAuthor = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of listings) {
      map.set(l.authorId, (map.get(l.authorId) ?? 0) + 1);
    }
    return map;
  }, [listings]);

  const profiles = useMemo<UserProfile[]>(
    () =>
      (profilesQuery.data ?? []).map((row) =>
        mapProfile(row, listingCountByAuthor.get(row.id) ?? 0),
      ),
    [profilesQuery.data, listingCountByAuthor],
  );

  const feed = useMemo<FeedPost[]>(() => feedQuery.data ?? [], [feedQuery.data]);
  const guides = useMemo<Guide[]>(() => guidesQuery.data ?? [], [guidesQuery.data]);
  const events = useMemo<ClimateEvent[]>(
    () => eventsQuery.data ?? [],
    [eventsQuery.data],
  );
  const conversations = useMemo<Conversation[]>(
    () => conversationsQuery.data ?? [],
    [conversationsQuery.data],
  );
  const savedListingIds = savedQuery.data?.listings ?? [];
  const savedPostIds = savedQuery.data?.posts ?? [];
  const deals = useMemo<Deal[]>(() => dealsQuery.data ?? [], [dealsQuery.data]);
  const reads = useMemo<Record<string, number>>(
    () => readsQuery.data ?? {},
    [readsQuery.data],
  );
  const followedHubKeys = hubFollowsQuery.data ?? [];
  const drives = useMemo<Drive[]>(() => drivesQuery.data ?? [], [drivesQuery.data]);

  /** Conversations with an unread incoming message (last message not mine, newer than my last read). */
  const unreadConversationIds = useMemo<Set<string>>(() => {
    const set = new Set<string>();
    for (const c of conversations) {
      const last = c.messages[c.messages.length - 1];
      if (!last || last.fromMe) continue;
      const lastRead = reads[c.id] ?? 0;
      if (last.createdAt > lastRead) set.add(c.id);
    }
    return set;
  }, [conversations, reads]);

  const profilesMap = useMemo<Map<string, UserProfile>>(
    () => new Map(profiles.map((p) => [p.id, p])),
    [profiles],
  );

  const me = useMemo<UserProfile | null>(
    () => (userId ? profilesMap.get(userId) ?? null : null),
    [profilesMap, userId],
  );

  const getProfile = useCallback(
    (id: string): UserProfile | undefined => profilesMap.get(id),
    [profilesMap],
  );

  const loading =
    isAuthenticated &&
    (listingsQuery.isLoading ||
      profilesQuery.isLoading ||
      feedQuery.isLoading);

  const guidesLoading = isAuthenticated && guidesQuery.isLoading;
  const drivesLoading = isAuthenticated && drivesQuery.isLoading;
  const conversationsLoading =
    isAuthenticated && !!userId && conversationsQuery.isLoading;

  /* ----------------------------- Mutations ----------------------------- */

  const refresh = useCallback(async () => {
    await Promise.all([
      listingsQuery.refetch(),
      profilesQuery.refetch(),
      feedQuery.refetch(),
      eventsQuery.refetch(),
      conversationsQuery.refetch(),
      guidesQuery.refetch(),
    ]);
  }, [
    listingsQuery,
    profilesQuery,
    feedQuery,
    eventsQuery,
    conversationsQuery,
    guidesQuery,
  ]);

  const addListing = useCallback(
    async (
      data: Omit<Listing, "id" | "authorId" | "createdAt" | "status">,
      clientToken?: string,
    ) => {
      // --- Optimistic update: add a local-only listing immediately ---
      const tempId = `temp_${Date.now()}`;
      const optimisticListing: Listing = {
        ...data,
        id: tempId,
        authorId: userId ?? "",
        createdAt: Date.now(),
        status: "active",
      };
      queryClient.setQueryData<Listing[]>(["listings"], (prev) =>
        prev ? [optimisticListing, ...prev] : [optimisticListing],
      );
      try {
        await callApi("/listings.create", {
          kind: data.kind,
          title: data.title,
          material: data.material,
          quantity: data.quantity,
          unit: data.unit,
          region: data.region,
          area: data.area,
          description: data.description,
          photo: data.photo ?? null,
          pricePerUnit: data.pricePerUnit ?? null,
          recurring: data.recurring ?? false,
          frequency: data.frequency ?? null,
          lat: data.lat ?? null,
          lng: data.lng ?? null,
          clientToken: clientToken ?? null,
        });
        invalidate(["listings", "profiles"]);
      } catch (err) {
        // Rollback: remove the temp listing on failure
        queryClient.setQueryData<Listing[]>(["listings"], (prev) =>
          prev ? prev.filter((l) => l.id !== tempId) : [],
        );
        throw err;
      }
    },
    [userId, queryClient, invalidate],
  );

  const addPost = useCallback(
    async (
      data: Pick<FeedPost, "text" | "material" | "photo">,
      clientToken?: string,
    ) => {
      await callApi("/feed.post", {
        text: data.text,
        material: data.material ?? null,
        photo: data.photo ?? null,
        clientToken: clientToken ?? null,
      });
      invalidate(["feed"]);
    },
    [invalidate],
  );

  const toggleLike = useCallback(
    async (postId: string) => {
      const prevFeed = queryClient.getQueryData<FeedPost[]>(["feed", userId]);
      // Optimistic toggle: flip immediately in cache
      queryClient.setQueryData<FeedPost[]>(["feed", userId], (prev) =>
        prev
          ? prev.map((p) =>
              p.id === postId
                ? { ...p, likedByMe: !p.likedByMe, likes: p.likedByMe ? p.likes - 1 : p.likes + 1 }
                : p,
            )
          : [],
      );
      try {
        await callApi("/feed.like", { postId });
      } catch (err) {
        // Rollback on error
        if (prevFeed) queryClient.setQueryData(["feed", userId], prevFeed);
        throw err;
      } finally {
        invalidate(["feed"]);
      }
    },
    [userId, queryClient, invalidate],
  );

  const addComment = useCallback(
    async (postId: string, text: string) => {
      await callApi("/feed.comment", { postId, text });
      invalidate(["feed"]);
    },
    [invalidate],
  );

  const flagPost = useCallback(
    async (postId: string) => {
      await callApi("/feed.flag", { postId });
      invalidate(["feed"]);
    },
    [invalidate],
  );

  const addEvent = useCallback(
    async (data: Omit<ClimateEvent, "id" | "pending">) => {
      await callApi("/events.submit", {
        title: data.title,
        type: data.type,
        date: data.date,
        region: data.region,
        location: data.location,
        organizer: data.organizer,
        description: data.description,
        contact: data.contact,
        photo: data.photo ?? null,
      });
      invalidate(["events"]);
    },
    [invalidate],
  );

  const updateMe = useCallback(
    async (
      patch: Partial<
        Pick<UserProfile, "name" | "bio" | "trade" | "region" | "role"> & {
          avatar: string;
        }
      >,
    ) => {
      await callApi("/profile.update", patch);
      invalidate(["profiles"]);
    },
    [invalidate],
  );

  const editListing = useCallback(
    async (id: string, patch: Partial<Omit<Listing, "id" | "authorId" | "createdAt" | "status">>) => {
      await callApi("/listings.update", { id, ...patch });
      invalidate(["listings"]);
    },
    [invalidate],
  );

  const setListingStatus = useCallback(
    async (id: string, status: ListingStatus) => {
      await callApi("/listings.status", { id, status });
      invalidate(["listings", "profiles"]);
    },
    [invalidate],
  );

  const deleteListing = useCallback(
    async (id: string) => {
      await callApi("/listings.delete", { id });
      invalidate(["listings", "profiles"]);
    },
    [invalidate],
  );

  const proposeDeal = useCallback(
    async (input: {
      withUserId: string;
      conversationId?: string;
      listingId?: string;
      material: MaterialKey;
      quantity: number;
      unit: string;
    }) => {
      await callApi("/deals.propose", {
        withUserId: input.withUserId,
        conversationId: input.conversationId ?? null,
        listingId: input.listingId ?? null,
        material: input.material,
        quantity: input.quantity,
        unit: input.unit,
      });
      invalidate(["deals"]);
    },
    [invalidate],
  );

  const confirmDeal = useCallback(
    async (dealId: string) => {
      await callApi("/deals.confirm", { dealId });
      invalidate(["deals", "profiles"]);
    },
    [invalidate],
  );

  const declineDeal = useCallback(
    async (dealId: string) => {
      await callApi("/deals.decline", { dealId });
      invalidate(["deals"]);
    },
    [invalidate],
  );

  const markConversationRead = useCallback(
    async (conversationId: string) => {
      try {
        await callApi("/conversations.read", { conversationId });
      } finally {
        invalidate(["reads"]);
      }
    },
    [invalidate],
  );

  const toggleFollowHub = useCallback(
    async (hubKey: string) => {
      try {
        await callApi("/hubs.follow", { hubKey });
      } finally {
        invalidate(["hubFollows"]);
      }
    },
    [invalidate],
  );

  const createDrive = useCallback(
    async (input: {
      title: string;
      material: MaterialKey;
      region: Region;
      area: string;
      targetKg: number;
      date: number;
      note: string;
    }) => {
      await callApi("/drives.create", input);
      invalidate(["drives"]);
    },
    [invalidate],
  );

  const commitToDrive = useCallback(
    async (driveId: string, amountKg: number) => {
      await callApi("/drives.commit", { driveId, amountKg });
      invalidate(["drives"]);
    },
    [invalidate],
  );

  const uncommitDrive = useCallback(
    async (driveId: string) => {
      await callApi("/drives.uncommit", { driveId });
      invalidate(["drives"]);
    },
    [invalidate],
  );

  const ensureConversation = useCallback(
    async (withUserId: string, listingId?: string): Promise<string> => {
      const data = await callApi<{ id: string }>("/conversations.ensure", {
        withUserId,
        listingId: listingId ?? null,
      });
      // Seed an empty cache entry optimistically if not already present
      // to prevent races when sending the first message immediately after creation.
      queryClient.setQueryData<Conversation[]>(["conversations", userId], (prev) => {
        if (!prev) return [{ id: data.id, withUserId, listingId, messages: [] }];
        if (prev.some((c) => c.id === data.id)) return prev;
        return [{ id: data.id, withUserId, listingId, messages: [] }, ...prev];
      });
      invalidate(["conversations"]);
      return data.id;
    },
    [userId, queryClient, invalidate],
  );

  const sendMessage = useCallback(
    async (conversationId: string, text: string, clientToken?: string) => {
      const tempMsg: Message = {
        id: `temp_${Date.now()}`,
        fromMe: true,
        text,
        createdAt: Date.now(),
      };
      // Optimistic: append message immediately so the chat feels instant
      queryClient.setQueryData<Conversation[]>(["conversations", userId], (prev) =>
        prev
          ? prev.map((c) =>
              c.id === conversationId
                ? { ...c, messages: [...c.messages, tempMsg] }
                : c,
            )
          : [],
      );
      try {
        await callApi("/messages.send", {
          conversationId,
          text,
          clientToken: clientToken ?? null,
        });
        invalidate(["conversations"]);
      } catch (err) {
        // Rollback temp message on failure
        queryClient.setQueryData<Conversation[]>(["conversations", userId], (prev) =>
          prev
            ? prev.map((c) =>
                c.id === conversationId
                  ? { ...c, messages: c.messages.filter((m) => m.id !== tempMsg.id) }
                  : c,
              )
            : [],
        );
        throw err;
      }
    },
    [userId, queryClient, invalidate],
  );

  const toggleSaveListing = useCallback(
    async (listingId: string) => {
      const prevSaved = queryClient.getQueryData<{ listings: string[]; posts: string[] }>(["saved", userId]);
      const isSaved = savedListingIds.includes(listingId);
      // Optimistic: immediately update saved set in cache
      queryClient.setQueryData<{ listings: string[]; posts: string[] }>(["saved", userId], (prev) => {
        if (!prev) return prev ?? { listings: [], posts: [] };
        return {
          ...prev,
          listings: isSaved
            ? prev.listings.filter((id) => id !== listingId)
            : [...prev.listings, listingId],
        };
      });
      try {
        await callApi("/saved.listing", { listingId, save: !isSaved });
      } catch (err) {
        if (prevSaved) queryClient.setQueryData(["saved", userId], prevSaved);
        throw err;
      } finally {
        queryClient.invalidateQueries({ queryKey: ["saved"] });
      }
    },
    [userId, queryClient, savedListingIds, invalidate],
  );

  const toggleSavePost = useCallback(
    async (postId: string) => {
      const prevSaved = queryClient.getQueryData<{ listings: string[]; posts: string[] }>(["saved", userId]);
      const isSaved = savedPostIds.includes(postId);
      // Optimistic: immediately update saved set in cache
      queryClient.setQueryData<{ listings: string[]; posts: string[] }>(["saved", userId], (prev) => {
        if (!prev) return prev ?? { listings: [], posts: [] };
        return {
          ...prev,
          posts: isSaved
            ? prev.posts.filter((id) => id !== postId)
            : [...prev.posts, postId],
        };
      });
      try {
        await callApi("/saved.post", { postId, save: !isSaved });
      } catch (err) {
        if (prevSaved) queryClient.setQueryData(["saved", userId], prevSaved);
        throw err;
      } finally {
        queryClient.invalidateQueries({ queryKey: ["saved"] });
      }
    },
    [userId, queryClient, savedPostIds, invalidate],
  );

  return useMemo(
    () => ({
      listings,
      liveListings,
      feed,
      events,
      guides,
      profiles,
      profilesMap,
      conversations,
      deals,
      drives,
      followedHubKeys,
      unreadConversationIds,
      me,
      onboarded,
      rolePicked,
      loading,
      guidesLoading,
      drivesLoading,
      conversationsLoading,
      refreshing: listingsQuery.isRefetching || feedQuery.isRefetching,
      savedListingIds,
      savedPostIds,
      completeOnboarding,
      refresh,
      getProfile,
      addListing,
      editListing,
      setListingStatus,
      deleteListing,
      addPost,
      toggleLike,
      addComment,
      flagPost,
      addEvent,
      updateMe,
      completeRolePick,
      ensureConversation,
      sendMessage,
      proposeDeal,
      confirmDeal,
      declineDeal,
      markConversationRead,
      toggleFollowHub,
      createDrive,
      commitToDrive,
      uncommitDrive,
      toggleSaveListing,
      toggleSavePost,
      // Persisted market filters
      marketQuery,
      setMarketQuery: updateMarketQuery,
      marketKind,
      setMarketKind: updateMarketKind,
      marketMaterial,
      setMarketMaterial: updateMarketMaterial,
      marketRegion,
      setMarketRegion: updateMarketRegion,
      marketShowRegions,
      setMarketShowRegions: updateMarketShowRegions,
      marketView,
      setMarketView: updateMarketView,
      marketRadius,
      setMarketRadius: updateMarketRadius,
    }),
    [
      listings,
      liveListings,
      feed,
      events,
      guides,
      profiles,
      profilesMap,
      conversations,
      deals,
      drives,
      followedHubKeys,
      unreadConversationIds,
      me,
      onboarded,
      rolePicked,
      loading,
      guidesLoading,
      drivesLoading,
      conversationsLoading,
      listingsQuery.isRefetching,
      feedQuery.isRefetching,
      savedListingIds,
      savedPostIds,
      completeOnboarding,
      refresh,
      getProfile,
      addListing,
      editListing,
      setListingStatus,
      deleteListing,
      addPost,
      toggleLike,
      addComment,
      flagPost,
      addEvent,
      updateMe,
      completeRolePick,
      ensureConversation,
      sendMessage,
      proposeDeal,
      confirmDeal,
      declineDeal,
      markConversationRead,
      toggleFollowHub,
      createDrive,
      commitToDrive,
      uncommitDrive,
      toggleSaveListing,
      toggleSavePost,
      marketQuery,
      updateMarketQuery,
      marketKind,
      updateMarketKind,
      marketMaterial,
      updateMarketMaterial,
      marketRegion,
      updateMarketRegion,
      marketShowRegions,
      updateMarketShowRegions,
      marketView,
      updateMarketView,
      marketRadius,
      updateMarketRadius,
    ],
  );
});
