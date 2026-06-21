import { Repeat } from "lucide-react-native";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { PressableScale } from "@/components/ui";
import Colors from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import type { SupplyCluster } from "@/utils/clusters";

/** Horizontal "Supply near you" carousel shown above the listing feed. */
export function SupplyPools({
  pools,
  onSelect,
  onSeeMap,
}: {
  pools: SupplyCluster[];
  onSelect: (cluster: SupplyCluster) => void;
  onSeeMap: () => void;
}) {
  return (
    <View style={styles.poolSection}>
      <View style={styles.poolHeader}>
        <View style={styles.poolHeaderLeft}>
          <Text style={styles.poolTitle}>Supply near you</Text>
          <Text style={styles.poolCount}>
            {pools.length} {pools.length === 1 ? "area" : "areas"}
          </Text>
        </View>
        <PressableScale onPress={onSeeMap} hitSlop={8}>
          <Text style={styles.poolSeeMap}>See map →</Text>
        </PressableScale>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.poolRow}
      >
        {pools.map((p) => (
          <PressableScale key={p.key} onPress={() => onSelect(p)}>
            <View style={styles.poolCard}>
              <View style={styles.poolCardTop}>
                <Text style={styles.poolArea} numberOfLines={1}>
                  {p.area}
                </Text>
                {p.hasRegular ? (
                  <View style={styles.regularDot}>
                    <Repeat color={Colors.success} size={11} />
                  </View>
                ) : null}
              </View>
              <Text style={styles.poolKg}>
                {p.totalKg > 0 ? `${p.totalKg}kg` : `${p.listings.length}`}
              </Text>
              <Text style={styles.poolMeta}>
                {p.vendorCount} {p.vendorCount === 1 ? "vendor" : "vendors"}
              </Text>
              <Text style={styles.poolCta}>Combine supply →</Text>
            </View>
          </PressableScale>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  poolSection: {
    marginBottom: 16,
  },
  poolHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  poolHeaderLeft: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  poolTitle: {
    fontFamily: Fonts.serif,
    fontSize: 18,
    color: Colors.charcoal,
  },
  poolCount: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12.5,
    color: Colors.mist,
  },
  poolSeeMap: { fontFamily: Fonts.sansSemibold, fontSize: 13, color: Colors.sky },
  poolRow: { gap: 12, paddingRight: 16 },
  poolCard: {
    width: 160,
    backgroundColor: Colors.skySoft,
    borderRadius: 16,
    padding: 14,
    gap: 4,
    borderWidth: 1,
    borderColor: "#CFE3F9",
  },
  poolCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  poolArea: {
    flex: 1,
    fontFamily: Fonts.sansSemibold,
    fontSize: 14,
    color: Colors.skyDeep,
  },
  regularDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.successSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  poolKg: {
    fontFamily: Fonts.monoBold,
    fontSize: 24,
    color: Colors.skyDeep,
  },
  poolMeta: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.slate,
  },
  poolCta: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 13,
    color: Colors.sky,
    marginTop: 2,
  },
});
