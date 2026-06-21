import { BadgeCheck, Boxes, Truck, Users } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import Colors from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import type { UserProfile } from "@/types";
import { groupNumber } from "@/utils/format";

/** Verified-anchor banner shown at the top of an organization profile. */
export function AnchorBanner() {
  return (
    <View style={styles.banner}>
      <View style={styles.bannerIcon}>
        <BadgeCheck color={Colors.white} size={18} />
      </View>
      <View style={styles.flex1}>
        <Text style={styles.bannerTitle}>Verified anchor buyer</Text>
        <Text style={styles.bannerSub}>
          Reviewed organization buying at scale
        </Text>
      </View>
    </View>
  );
}

/** Credibility block (instead of achievements) for anchor-buyer organizations. */
export function AnchorCredibility({ profile }: { profile: UserProfile }) {
  const years = Math.max(1, new Date().getFullYear() - profile.joinedYear);
  const items = [
    {
      icon: <Boxes color={Colors.skyDeep} size={20} />,
      value: `${groupNumber(profile.stats.materialsMovedKg)} kg`,
      label: "recycled to date",
    },
    {
      icon: <Users color={Colors.skyDeep} size={20} />,
      value: groupNumber(profile.stats.deals),
      label: "suppliers served",
    },
    {
      icon: <Truck color={Colors.skyDeep} size={20} />,
      value: `${years} yr`,
      label: "buying on Glean",
    },
  ];
  return (
    <View>
      <View style={styles.suppliesCard}>
        <Text style={styles.suppliesTitle}>Supplies wanted</Text>
        <Text style={styles.suppliesText}>
          {profile.name} buys baled or loose material at volume with reliable
          weekly payment. Reach out to arrange a first drop-off.
        </Text>
      </View>
      <View style={styles.credRow}>
        {items.map((it) => (
          <View key={it.label} style={styles.credItem}>
            {it.icon}
            <Text style={styles.credValue}>{it.value}</Text>
            <Text style={styles.credLabel}>{it.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.skySoft,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.sky,
  },
  bannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.skyDeep,
    alignItems: "center",
    justifyContent: "center",
  },
  bannerTitle: {
    fontFamily: Fonts.sansBold,
    fontSize: 15,
    color: Colors.skyDeep,
  },
  bannerSub: { fontFamily: Fonts.sans, fontSize: 12.5, color: Colors.slate },
  flex1: { flex: 1 },
  suppliesCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  suppliesTitle: {
    fontFamily: Fonts.sansBold,
    fontSize: 14,
    color: Colors.charcoal,
    marginBottom: 6,
  },
  suppliesText: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    color: Colors.ink,
  },
  credRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  credItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  credValue: {
    fontFamily: Fonts.monoBold,
    fontSize: 15,
    color: Colors.skyDeep,
    marginTop: 2,
  },
  credLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    color: Colors.slate,
    textAlign: "center",
  },
});
