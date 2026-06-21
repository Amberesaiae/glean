import { router } from "expo-router";
import { MapPin, Navigation, X } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LayoutChangeEvent, RefreshControl, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BottomSheet, { BottomSheetFlatList } from "@gorhom/bottom-sheet";

import {
  EmptyState,
  ListingCardSkeleton,
  PressableScale,
  SupplyPoolSkeleton,
  Text,
} from "@/components/ui";
import { MATERIAL_ECO } from "@/components/illustrations";
import { MarketMap } from "@/components/market-map";
import type { Listing } from "@/types";
import { ClusterSheet } from "@/components/market/ClusterSheet";
import { ListingCard } from "@/components/market/ListingCard";
import { MarketHeader } from "@/components/market/MarketHeader";
import { SupplyPools } from "@/components/market/SupplyPools";
import Colors, { MaterialKey } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { KindFilter, useMarket, ViewMode } from "@/hooks/useMarket";

export default function MarketScreen() {
  const insets = useSafeAreaInsets();
  const m = useMarket();
  const sheetRef = useRef<BottomSheet>(null);
  const [hideOnboardingTip, setHideOnboardingTip] = useState<boolean>(false);
  const [headerHeight, setHeaderHeight] = useState<number>(0);

  const onHeaderLayout = useCallback((e: LayoutChangeEvent) => {
    setHeaderHeight(e.nativeEvent.layout.height);
  }, []);

  // Set up snap points: 14% (collapsed), 50% (half screen), 92% (expanded)
  const snapPoints = useMemo(() => ["14%", "50%", "92%"], []);

  // Sync bottom sheet position with the view selection hook
  useEffect(() => {
    if (m.view === "list") {
      sheetRef.current?.snapToIndex(2);
    } else {
      sheetRef.current?.snapToIndex(0);
    }
  }, [m.view]);

  // Sync user drag gestures back to the view state
  const handleSheetChange = useCallback(
    (index: number) => {
      if (index === 2) {
        m.setView("list");
      } else if (index === 0) {
        m.setView("map");
      }
    },
    [m]
  );

  const renderItem = useCallback(({ item }: { item: any }) => (
    <ListingCard listing={item} />
  ), []);

  return (
    <View style={styles.container}>
      {/* Floating Header */}
      <View style={[styles.header, { paddingTop: insets.top + 4 }]} onLayout={onHeaderLayout}>
        <MarketHeader
          query={m.query}
          onQueryChange={m.setQuery}
          kind={m.kind as KindFilter}
          onKindChange={m.setKind as any}
          material={m.material as MaterialKey | "all"}
          onMaterialChange={m.setMaterial as any}
          region={m.region}
          onRegionChange={m.setRegion}
          view={m.view as ViewMode}
          onViewChange={m.setView as any}
          onOpenDrives={() => router.push("/drives")}
          onPost={() => router.push("/post-listing")}
          radius={m.radius}
          onRadiusChange={m.changeRadius}
        />
      </View>

      {/* Map View Container */}
      <View style={styles.mapContainer}>
        <MarketMap
          clusters={m.clusters}
          onSelect={m.setSelected}
          selectedKey={m.selected?.key ?? null}
        />
        {m.view === "map" && !m.userLocation && !hideOnboardingTip && (
          <View style={[styles.onboardingCard, styles.floatingCard, { top: insets.top + 140 }]}>
            <View style={styles.onboardingHeader}>
              <View style={styles.onboardingTitleRow}>
                <Navigation color={Colors.skyDeep} size={18} />
                <Text style={styles.onboardingTitle}>Find nearby supply</Text>
              </View>
              <PressableScale onPress={() => setHideOnboardingTip(true)} hitSlop={8}>
                <X color={Colors.slate} size={16} />
              </PressableScale>
            </View>
            <Text style={styles.onboardingBody}>
              {"Glean works best when you filter by distance. Share your location to see active listings near you."}
            </Text>
            <PressableScale
              onPress={m.requestLocation}
              disabled={m.requestingLocation}
              style={styles.onboardingBtn}
            >
              <Text style={styles.onboardingBtnText}>
                {m.requestingLocation ? "Locating..." : "Share Location"}
              </Text>
            </PressableScale>
          </View>
        )}
        {m.view === "map" && !!m.locationError && (
          <View style={[styles.onboardingCard, styles.errorCard, styles.floatingCard, { top: insets.top + 140 }]}>
            <View style={styles.onboardingHeader}>
              <View style={styles.onboardingTitleRow}>
                <MapPin color={Colors.danger} size={18} />
                <Text style={[styles.onboardingTitle, styles.errorTitle]}>Location Access Needed</Text>
              </View>
            </View>
            <Text style={styles.onboardingBody}>
              {"We couldn't get your location. Please check your system settings to enable location access for Glean."}
            </Text>
          </View>
        )}
        {m.view === "map" && m.clusters.length > 0 && (
          <View style={[styles.mapHint, { bottom: insets.bottom + 110 }]}>
            <MapPin color={Colors.skyDeep} size={14} />
            <Text style={styles.mapHintText}>
              {m.clusters.length} {m.clusters.length === 1 ? "area" : "areas"} with supply · tap a pin
            </Text>
          </View>
        )}
      </View>

      {/* Bottom Sheet overlay */}
      <BottomSheet
        ref={sheetRef}
        index={m.view === "list" ? 2 : 0}
        snapPoints={snapPoints}
        onChange={handleSheetChange}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.sheetIndicator}
      >
        <BottomSheetFlatList
          data={m.loading ? [] : m.filtered}
          keyExtractor={(item: Listing) => item.id}
          contentContainerStyle={[
            styles.list,
            { paddingTop: Math.max(headerHeight - insets.top, 16) },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={m.refreshing}
              onRefresh={m.refresh}
              tintColor={Colors.sky}
            />
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              {!m.userLocation && !hideOnboardingTip && (
                <View style={styles.onboardingCard}>
                  <View style={styles.onboardingHeader}>
                    <View style={styles.onboardingTitleRow}>
                      <Navigation color={Colors.skyDeep} size={18} />
                      <Text style={styles.onboardingTitle}>Find nearby supply</Text>
                    </View>
                    <PressableScale onPress={() => setHideOnboardingTip(true)} hitSlop={8}>
                      <X color={Colors.slate} size={16} />
                    </PressableScale>
                  </View>
                  <Text style={styles.onboardingBody}>
                    {"Glean works best when you filter by distance. Share your location to see active listings near you."}
                  </Text>
                  <PressableScale
                    onPress={m.requestLocation}
                    disabled={m.requestingLocation}
                    style={styles.onboardingBtn}
                  >
                    <Text style={styles.onboardingBtnText}>
                      {m.requestingLocation ? "Locating..." : "Share Location"}
                    </Text>
                  </PressableScale>
                </View>
              )}
              {!!m.locationError && (
                <View style={[styles.onboardingCard, styles.errorCard]}>
                  <View style={styles.onboardingHeader}>
                    <View style={styles.onboardingTitleRow}>
                      <MapPin color={Colors.danger} size={18} />
                      <Text style={[styles.onboardingTitle, styles.errorTitle]}>Location Access Needed</Text>
                    </View>
                  </View>
                  <Text style={styles.onboardingBody}>
                    {"We couldn't get your location. Please check your system settings to enable location access for Glean."}
                  </Text>
                </View>
              )}
              {m.loading ? (
                <View style={styles.poolSkeletonWrap}>
                  <View style={styles.poolSkeletonRow}>
                    {[0, 1, 2].map((i) => (
                      <SupplyPoolSkeleton key={i} />
                    ))}
                  </View>
                </View>
              ) : m.pools.length > 0 && m.kind !== "need" ? (
                <SupplyPools
                  pools={m.pools}
                  onSelect={m.setSelected}
                  onSeeMap={() => m.setView("map")}
                />
              ) : null}
            </View>
          }
          renderItem={renderItem}
          ListEmptyComponent={
            m.loading ? (
              <View style={styles.skeletonList}>
                {[0, 1, 2, 3].map((i) => (
                  <ListingCardSkeleton key={i} />
                ))}
              </View>
            ) : (
              <EmptyState
                illustration={m.material === "all" ? "recycling" : MATERIAL_ECO[m.material as MaterialKey]}
                title="No listings here yet"
                message="Try clearing filters, or post the first one."
              />
            )
          }
        />
      </BottomSheet>

      <ClusterSheet cluster={m.selected} onClose={() => m.setSelected(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },
  skeletonList: { gap: 14 },
  poolSkeletonWrap: { marginBottom: 16 },
  poolSkeletonRow: { flexDirection: "row", gap: 12 },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.paper,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    zIndex: 10,
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  mapHint: {
    position: "absolute",
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.card,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.line,
    shadowColor: Colors.charcoal,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    zIndex: 5,
  },
  mapHintText: { fontFamily: Fonts.sansSemibold, fontSize: 12.5, color: Colors.charcoal },
  list: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  listHeader: {
    gap: 14,
  },
  onboardingCard: {
    backgroundColor: Colors.skySoft,
    borderWidth: 1,
    borderColor: "#CFE3F9",
    borderRadius: 14,
    padding: 16,
    gap: 8,
  },
  onboardingHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  onboardingTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  onboardingTitle: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 14.5,
    color: Colors.skyDeep,
  },
  onboardingBody: {
    fontFamily: Fonts.sans,
    fontSize: 13.5,
    color: Colors.charcoal,
    lineHeight: 19,
  },
  onboardingBtn: {
    backgroundColor: Colors.sky,
    height: 38,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  onboardingBtnText: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 13.5,
    color: Colors.white,
  },
  errorCard: {
    backgroundColor: "#FCE8E6",
    borderColor: "#FAD2CF",
  },
  errorTitle: {
    color: Colors.danger,
  },
  floatingCard: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 15,
    shadowColor: Colors.charcoal,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  sheetBackground: {
    backgroundColor: Colors.paper,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: Colors.charcoal,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  sheetIndicator: {
    backgroundColor: Colors.line,
    width: 40,
    height: 4,
  },
});
