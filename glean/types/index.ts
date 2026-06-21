import type { EcoKey } from "@/components/illustrations";
import type { MaterialKey, Region } from "@/constants/colors";

export type ListingKind = "have" | "need";

export type ListingStatus = "active" | "fulfilled";

export type SupplyFrequency = "daily" | "weekly" | "monthly";

export type DealStatus = "proposed" | "confirmed" | "declined";

export type DriveStatus = "open" | "closed";

export type UserRole =
  | "collector"
  | "maker"
  | "processor"
  | "farmer"
  | "anchor";

export type GuideIconKey =
  | "recycle"
  | "flame"
  | "handshake"
  | "scale"
  | "sprout"
  | "blocks";

export interface UserProfile {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  region: Region;
  bio: string;
  trade: string;
  verified: boolean;
  /** A built-in verified organisation account (EcoForge, UNEP, councils, …). */
  official: boolean;
  role: UserRole;
  joinedYear: number;
  stats: {
    materialsMovedKg: number;
    listings: number;
    deals: number;
  };
}

export interface Listing {
  id: string;
  kind: ListingKind;
  title: string;
  material: MaterialKey;
  quantity: number;
  unit: string;
  region: Region;
  area: string;
  description: string;
  photo?: string;
  authorId: string;
  createdAt: number;
  pricePerUnit?: number;
  /** Whether this is standing supply the vendor produces on a regular basis. */
  recurring: boolean;
  /** How often the recurring supply is produced. */
  frequency?: SupplyFrequency;
  /** Optional pinned location (decimal degrees). */
  lat?: number;
  lng?: number;
  /** Lifecycle state. Fulfilled listings drop out of live discovery. */
  status: ListingStatus;
}

export interface Deal {
  id: string;
  conversationId?: string;
  listingId?: string;
  proposerId: string;
  counterpartyId: string;
  material: MaterialKey;
  quantity: number;
  unit: string;
  status: DealStatus;
  createdAt: number;
  confirmedAt?: number;
}

export interface Drive {
  id: string;
  organizerId: string;
  title: string;
  material: MaterialKey;
  region: Region;
  area: string;
  targetKg: number;
  date: number;
  note: string;
  status: DriveStatus;
  createdAt: number;
  commitments: DriveCommitment[];
}

export interface DriveCommitment {
  driveId: string;
  userId: string;
  amountKg: number;
  confirmed: boolean;
}

export interface FeedComment {
  id: string;
  authorId: string;
  text: string;
  createdAt: number;
}

export interface FeedPost {
  id: string;
  authorId: string;
  text: string;
  material?: MaterialKey;
  photo?: string;
  createdAt: number;
  likes: number;
  likedByMe: boolean;
  comments: FeedComment[];
  flagged?: boolean;
}

export interface ClimateEvent {
  id: string;
  title: string;
  type: "event" | "forum" | "job fair";
  date: number;
  region: Region;
  location: string;
  organizer: string;
  description: string;
  contact: string;
  photo?: string;
  pending?: boolean;
}

export interface Guide {
  id: string;
  title: string;
  material: MaterialKey;
  readMinutes: number;
  summary: string;
  body: string;
  sponsor?: string;
  icon: GuideIconKey;
  illustration: EcoKey;
  /** Optional hero image shown at the top of the guide. */
  heroImage?: string;
  /** Optional gallery of images, shown as a swipeable carousel. */
  images?: string[];
  /** Optional how-to video embedded in the guide. */
  videoUrl?: string;
}

export interface Message {
  id: string;
  fromMe: boolean;
  text: string;
  createdAt: number;
}

export interface Conversation {
  id: string;
  withUserId: string;
  listingId?: string;
  messages: Message[];
}
