/**
 * Presentation metadata for the built-in organisation accounts. The accounts
 * and their posts now live in the database as real, verified profiles and
 * feed_posts (see the `official` flag on profiles). This map only carries the
 * client-side styling — a distinct accent colour per org and the EcoForge brand
 * mark — keyed by the profile's handle.
 */
export interface OfficialStyle {
  /** Distinct accent colour so each org reads as authoritative. */
  accent: string;
  /** EcoForge renders with the bundled brand mark and links to its spotlight. */
  isEcoForge?: boolean;
}

export const OFFICIAL_STYLES: Record<string, OfficialStyle> = {
  ecoforge: { accent: "#4FA82E", isEcoForge: true },
  UNEP: { accent: "#1F7AE0" },
  GlobalRecycling: { accent: "#2E9E5B" },
  OceanCleanup: { accent: "#0E7FA8" },
  ClimateAction: { accent: "#F2A104" },
  AccraWaste: { accent: "#8E5BC4" },
  TemaRecycles: { accent: "#155CAB" },
};

/** Looks up an org's styling by handle (case-insensitive). */
export function officialStyleFor(handle: string): OfficialStyle | undefined {
  return OFFICIAL_STYLES[handle] ?? OFFICIAL_STYLES[handle.toLowerCase()];
}
