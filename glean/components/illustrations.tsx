import { Image } from "expo-image";
import React from "react";
import { ImageStyle, StyleProp, StyleSheet, Text, View } from "react-native";

import Colors, { MATERIALS, MaterialKey } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";

/** Keys for the 10 bundled eco illustrations. */
export type EcoKey =
  | "organic"
  | "metal"
  | "reduce"
  | "pet"
  | "community"
  | "zeroWaste"
  | "sustainability"
  | "recycling"
  | "recycleBottle"
  | "clothing"
  | "foodScraps"
  | "aluminumCan"
  | "reuseBag"
  | "paperBin"
  | "petBottle";

const ECO_SOURCES = {
  organic: require("../assets/eco/organic.png"),
  metal: require("../assets/eco/metal.png"),
  reduce: require("../assets/eco/reduce.png"),
  pet: require("../assets/eco/pet.png"),
  community: require("../assets/eco/community.png"),
  zeroWaste: require("../assets/eco/zero-waste.png"),
  sustainability: require("../assets/eco/sustainability.png"),
  recycling: require("../assets/eco/recycling.png"),
  recycleBottle: require("../assets/eco/recycle-bottle.png"),
  clothing: require("../assets/eco/clothing.png"),
  foodScraps: require("../assets/eco/food-scraps.png"),
  aluminumCan: require("../assets/eco/aluminum-can.png"),
  reuseBag: require("../assets/eco/reuse-bag.png"),
  paperBin: require("../assets/eco/paper-bin.png"),
  petBottle: require("../assets/eco/pet-bottle.png"),
} as const;

/** Maps each material category to its full-color illustration. */
export const MATERIAL_ECO: Record<MaterialKey, EcoKey> = {
  plastics: "petBottle",
  metals: "aluminumCan",
  organic: "foodScraps",
  textiles: "clothing",
  other: "paperBin",
};

/** The EcoForge brand mark. */
export const ECOFORGE_LOGO = require("../assets/images/ecoforge-logo.png");

/** EcoForge brand accents, sampled from the logo. */
export const ECOFORGE = {
  green: "#4FA82E",
  greenDeep: "#2E7D1E",
  greenSoft: "#E6F3DF",
  charcoal: "#2C3540",
} as const;

/** A bare illustration rendered crisply at any size. */
export function EcoImage({
  name,
  size = 40,
  style,
}: {
  name: EcoKey;
  size?: number;
  style?: StyleProp<ImageStyle>;
}) {
  return (
    <Image
      source={ECO_SOURCES[name]}
      style={[{ width: size, height: size }, style]}
      contentFit="contain"
      transition={150}
    />
  );
}

/** Material illustration seated in a soft, tinted rounded tile. */
export function MaterialIcon({
  material,
  size = 48,
  radius = 14,
}: {
  material: MaterialKey;
  size?: number;
  radius?: number;
}) {
  const m = MATERIALS[material];
  return (
    <View
      style={[
        styles.tile,
        { width: size, height: size, borderRadius: radius, backgroundColor: m.soft },
      ]}
    >
      <EcoImage name={MATERIAL_ECO[material]} size={Math.round(size * 0.64)} />
    </View>
  );
}

interface Badge {
  key: string;
  illustration: EcoKey;
  label: string;
  earned: boolean;
  hint: string;
}

/** Computes which achievement badges a member has earned from their stats. */
export function badgesFor(stats: {
  materialsMovedKg: number;
  deals: number;
  listings: number;
}): Badge[] {
  return [
    {
      key: "zero-waste",
      illustration: "zeroWaste",
      label: "Zero Waste",
      earned: stats.deals >= 20,
      hint: "20 deals",
    },
    {
      key: "rrr",
      illustration: "reduce",
      label: "Reduce·Reuse",
      earned: stats.listings >= 5,
      hint: "5 listings",
    },
    {
      key: "growing",
      illustration: "sustainability",
      label: "Growing Impact",
      earned: stats.materialsMovedKg >= 1000,
      hint: "1,000 kg moved",
    },
  ];
}

/** Horizontal strip of achievement badges; locked ones appear faded. */
export function Achievements({
  stats,
}: {
  stats: { materialsMovedKg: number; deals: number; listings: number };
}) {
  const badges = badgesFor(stats);
  return (
    <View style={styles.badgeRow}>
      {badges.map((b) => (
        <View key={b.key} style={styles.badge}>
          <View style={[styles.badgeTile, !b.earned && styles.badgeTileLocked]}>
            <EcoImage
              name={b.illustration}
              size={44}
              style={!b.earned ? styles.locked : undefined}
            />
          </View>
          <Text style={[styles.badgeLabel, !b.earned && styles.badgeLabelLocked]}>
            {b.label}
          </Text>
          <Text style={styles.badgeHint}>{b.earned ? "Earned" : b.hint}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: "center",
    justifyContent: "center",
  },
  badgeRow: {
    flexDirection: "row",
    gap: 10,
  },
  badge: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  badgeTile: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeTileLocked: {
    backgroundColor: Colors.cardAlt,
    borderColor: "transparent",
  },
  locked: {
    opacity: 0.28,
  },
  badgeLabel: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 12,
    color: Colors.charcoal,
    textAlign: "center",
  },
  badgeLabelLocked: {
    color: Colors.mist,
  },
  badgeHint: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.mist,
  },
});
