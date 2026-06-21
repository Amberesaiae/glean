import { router } from "expo-router";
import { Bell, BellRing, Megaphone } from "lucide-react-native";
import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { PressableScale, Sheet } from "@/components/ui";
import Colors from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { useApp } from "@/providers/AppProvider";
import type { Drive } from "@/types";
import type { SupplyCluster } from "@/utils/clusters";

import { SupplierRow } from "./SupplierRow";

/** Bottom sheet listing every supplier within a tapped area cluster. */
export function ClusterSheet({
  cluster,
  onClose,
}: {
  cluster: SupplyCluster | null;
  onClose: () => void;
}) {
  const { followedHubKeys, toggleFollowHub, drives } = useApp();
  const following = cluster ? followedHubKeys.includes(cluster.key) : false;

  const hubDrives = useMemo<Drive[]>(() => {
    if (!cluster) return [];
    return drives.filter(
      (d) =>
        d.status === "open" &&
        d.region === cluster.region &&
        d.area.trim().toLowerCase() === cluster.area.trim().toLowerCase(),
    );
  }, [drives, cluster]);

  return (
    <Sheet
      visible={!!cluster}
      onClose={onClose}
      title={cluster ? `${cluster.area} · supply` : ""}
    >
      {cluster ? (
        <>
          <View style={styles.hubActions}>
            <PressableScale
              onPress={() => toggleFollowHub(cluster.key)}
              style={[styles.followBtn, following && styles.followBtnActive]}
            >
              {following ? (
                <BellRing color={Colors.white} size={15} />
              ) : (
                <Bell color={Colors.skyDeep} size={15} />
              )}
              <Text style={[styles.followText, following && styles.followTextActive]}>
                {following ? "Following hub" : "Follow hub"}
              </Text>
            </PressableScale>
            <PressableScale
              onPress={() => {
                onClose();
                router.push(
                  `/start-drive?region=${encodeURIComponent(cluster.region)}&area=${encodeURIComponent(cluster.area)}`,
                );
              }}
              style={styles.driveCta}
            >
              <Megaphone color={Colors.white} size={15} />
              <Text style={styles.driveCtaText}>Start a drive</Text>
            </PressableScale>
          </View>

          {hubDrives.length > 0 ? (
            <View style={styles.hubDrives}>
              {hubDrives.map((d) => (
                <PressableScale
                  key={d.id}
                  onPress={() => {
                    onClose();
                    router.push("/drives");
                  }}
                  style={styles.hubDriveRow}
                >
                  <Megaphone color={Colors.skyDeep} size={15} />
                  <Text style={styles.hubDriveText} numberOfLines={1}>
                    {d.title}
                  </Text>
                  <Text style={styles.hubDriveKg}>{d.targetKg}kg</Text>
                </PressableScale>
              ))}
            </View>
          ) : null}

          <View style={styles.sheetSummary}>
            <View style={styles.sheetSummaryItem}>
              <Text style={styles.sheetSummaryValue}>{cluster.vendorCount}</Text>
              <Text style={styles.sheetSummaryLabel}>
                {cluster.vendorCount === 1 ? "vendor" : "vendors"}
              </Text>
            </View>
            {cluster.totalKg > 0 ? (
              <View style={styles.sheetSummaryItem}>
                <Text style={styles.sheetSummaryValue}>{cluster.totalKg}</Text>
                <Text style={styles.sheetSummaryLabel}>kg available</Text>
              </View>
            ) : null}
            <View style={styles.sheetSummaryItem}>
              <Text style={styles.sheetSummaryValue}>{cluster.listings.length}</Text>
              <Text style={styles.sheetSummaryLabel}>listings</Text>
            </View>
          </View>
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {cluster.listings
              .slice()
              .sort((a, b) => Number(b.recurring) - Number(a.recurring))
              .map((l) => (
                <SupplierRow key={l.id} listing={l} onNavigate={onClose} />
              ))}
          </ScrollView>
        </>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  hubActions: { flexDirection: "row", gap: 10, marginBottom: 14 },
  followBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.skySoft,
    borderWidth: 1.5,
    borderColor: "#CFE3F9",
  },
  followBtnActive: { backgroundColor: Colors.skyDeep, borderColor: Colors.skyDeep },
  followText: { fontFamily: Fonts.sansSemibold, fontSize: 13.5, color: Colors.skyDeep },
  followTextActive: { color: Colors.white },
  driveCta: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.sky,
  },
  driveCtaText: { fontFamily: Fonts.sansBold, fontSize: 13.5, color: Colors.white },
  hubDrives: { gap: 8, marginBottom: 14 },
  hubDriveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.skySoft,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  hubDriveText: { flex: 1, fontFamily: Fonts.sansSemibold, fontSize: 13.5, color: Colors.skyDeep },
  hubDriveKg: { fontFamily: Fonts.monoBold, fontSize: 13, color: Colors.skyDeep },
  sheetSummary: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  sheetSummaryItem: {
    flex: 1,
    backgroundColor: Colors.skySoft,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  sheetSummaryValue: {
    fontFamily: Fonts.monoBold,
    fontSize: 22,
    color: Colors.skyDeep,
  },
  sheetSummaryLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11.5,
    color: Colors.slate,
    marginTop: 2,
  },
  scroll: { maxHeight: 380 },
});
