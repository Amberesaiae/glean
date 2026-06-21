import type { EcoKey } from "@/components/illustrations";
import type { UserRole } from "@/types";
import Colors from "@/constants/colors";

export interface RoleConfig {
  /** Short label shown on the role chip. */
  label: string;
  /** Accent color used for the chip and impact chart. */
  color: string;
  /** Soft tint behind the chip. */
  soft: string;
  /** Eco illustration that represents this role. */
  illustration: EcoKey;
  /** True for organizations (anchor buyers) — gets a distinct treatment. */
  isOrg: boolean;
  /** Labels for the three header stats: [materialsMovedKg, deals, listings]. */
  statLabels: [string, string, string];
  /** Verb completing "X kg ___" on the impact card. */
  impactVerb: string;
}

export const ROLES: Record<UserRole, RoleConfig> = {
  collector: {
    label: "Collector",
    color: Colors.sky,
    soft: Colors.skySoft,
    illustration: "recycleBottle",
    isOrg: false,
    statLabels: ["kg moved", "deals", "listings"],
    impactVerb: "diverted from landfill",
  },
  maker: {
    label: "Maker",
    color: Colors.amber,
    soft: Colors.amberSoft,
    illustration: "sustainability",
    isOrg: false,
    statLabels: ["kg processed", "deals", "listings"],
    impactVerb: "given a second life",
  },
  processor: {
    label: "Processor",
    color: Colors.success,
    soft: Colors.successSoft,
    illustration: "organic",
    isOrg: false,
    statLabels: ["kg composted", "deals", "listings"],
    impactVerb: "composted, not burned",
  },
  farmer: {
    label: "Farmer",
    color: Colors.success,
    soft: Colors.successSoft,
    illustration: "reduce",
    isOrg: false,
    statLabels: ["kg sourced", "deals", "listings"],
    impactVerb: "grown from waste",
  },
  anchor: {
    label: "Anchor buyer",
    color: Colors.skyDeep,
    soft: Colors.skySoft,
    illustration: "community",
    isOrg: true,
    statLabels: ["kg recycled", "suppliers", "pickups"],
    impactVerb: "recycled at scale",
  },
};
