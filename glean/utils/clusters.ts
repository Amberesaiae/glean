import type { MaterialKey, Region } from "@/constants/colors";
import type { Listing, SupplyFrequency } from "@/types";
import { convertToKg } from "./format";

/** Rough centroids (decimal degrees) for Ghana's 16 regions. Used to place
 * supply on the neighbourhood map when a listing has no precise pin. */
export const REGION_CENTROIDS: Record<Region, { lat: number; lng: number }> = {
  "Greater Accra": { lat: 5.78, lng: 0.05 },
  Ashanti: { lat: 6.75, lng: -1.5 },
  Western: { lat: 5.3, lng: -2.4 },
  Central: { lat: 5.55, lng: -1.0 },
  Eastern: { lat: 6.4, lng: -0.5 },
  Volta: { lat: 6.6, lng: 0.5 },
  Northern: { lat: 9.5, lng: -0.85 },
  "Upper East": { lat: 10.7, lng: -0.9 },
  "Upper West": { lat: 10.3, lng: -2.3 },
  Bono: { lat: 7.7, lng: -2.3 },
  "Bono East": { lat: 7.75, lng: -1.05 },
  Ahafo: { lat: 6.9, lng: -2.5 },
  Savannah: { lat: 9.0, lng: -1.8 },
  "North East": { lat: 10.5, lng: -0.4 },
  Oti: { lat: 7.9, lng: 0.3 },
  "Western North": { lat: 6.3, lng: -2.85 },
};

/** Stable pseudo-random in [-1, 1] from a string seed. */
function hashUnit(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // Map the 32-bit int to [-1, 1].
  return ((h >>> 0) / 0xffffffff) * 2 - 1;
}

/** Resolve a coordinate for a listing: its real pin, or null if location-less. */
export function coordFor(listing: Listing): { lat: number; lng: number } | null {
  if (typeof listing.lat === "number" && typeof listing.lng === "number") {
    return { lat: listing.lat, lng: listing.lng };
  }
  return null;
}

export interface SupplyCluster {
  key: string;
  area: string;
  region: Region;
  listings: Listing[];
  /** Distinct authors offering supply here. */
  vendorCount: number;
  /** Combined weight in kg (only kg-denominated listings count toward this). */
  totalKg: number;
  /** Whether any supplier here is a regular supplier. */
  hasRegular: boolean;
  lat: number;
  lng: number;
}

interface ClusterOptions {
  material?: MaterialKey | "all";
  region?: string;
}

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dy = lat1 - lat2;
  const dx = lng1 - lng2;
  return Math.sqrt(dx * dx + dy * dy);
}

/** Group "have" supply into clusters by town/area within the current filters.
 * Spatially groups pins within 0.02 degrees (~2km) calculating the exact average centroid. */
export function clusterSupply(
  listings: Listing[],
  opts: ClusterOptions = {},
): SupplyCluster[] {
  const material = opts.material ?? "all";
  const region = opts.region ?? "all";
  const clusters: SupplyCluster[] = [];

  for (const l of listings) {
    if (l.kind !== "have") continue;
    if (material !== "all" && l.material !== material) continue;
    if (region !== "all" && l.region !== region) continue;

    const point = coordFor(l);
    if (!point) continue;

    let foundCluster: SupplyCluster | null = null;
    for (const c of clusters) {
      if (getDistance(point.lat, point.lng, c.lat, c.lng) < 0.02) {
        foundCluster = c;
        break;
      }
    }

    if (foundCluster) {
      foundCluster.listings.push(l);
      foundCluster.totalKg += convertToKg(l.quantity, l.unit);
      if (l.recurring) foundCluster.hasRegular = true;
      
      // Calculate exact average centroid of all listings in the cluster
      let sumLat = 0;
      let sumLng = 0;
      for (const list of foundCluster.listings) {
        const pt = coordFor(list);
        if (pt) {
          sumLat += pt.lat;
          sumLng += pt.lng;
        }
      }
      foundCluster.lat = sumLat / foundCluster.listings.length;
      foundCluster.lng = sumLng / foundCluster.listings.length;
    } else {
      clusters.push({
        key: `cluster_${l.id}`,
        area: l.area.trim().length > 0 ? l.area.trim() : l.region,
        region: l.region,
        listings: [l],
        vendorCount: 0,
        totalKg: convertToKg(l.quantity, l.unit),
        hasRegular: l.recurring,
        lat: point.lat,
        lng: point.lng,
      });
    }
  }

  for (const c of clusters) {
    c.vendorCount = new Set(c.listings.map((l) => l.authorId)).size;
  }
  return clusters.sort((a, b) => b.listings.length - a.listings.length);
}

const FREQUENCY_LABEL: Record<SupplyFrequency, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

/** Human label for a supply frequency, or null if not recurring. */
export function frequencyLabel(
  recurring: boolean,
  frequency?: SupplyFrequency,
): string | null {
  if (!recurring) return null;
  return frequency ? FREQUENCY_LABEL[frequency] : "Regular";
}
