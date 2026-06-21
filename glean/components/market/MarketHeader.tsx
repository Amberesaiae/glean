import {
  List,
  Map as MapIcon,
  Megaphone,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react-native";
import React, { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import {
  PressableScale,
  Segmented,
  type SegmentOption,
} from "@/components/ui";
import { FilterPanel } from "@/components/market/FilterPanel";
import { MessagesButton } from "@/components/messages-button";
import Colors, { MATERIALS, MaterialKey } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import type { KindFilter, ViewMode } from "@/hooks/useMarket";

const KIND_OPTIONS: SegmentOption<KindFilter>[] = [
  { key: "all", label: "All" },
  { key: "have", label: "Have", tint: Colors.success, tintSoft: Colors.successSoft },
  { key: "need", label: "Need", tint: Colors.amberInk, tintSoft: Colors.amberSoft },
];

type MarketHeaderProps = {
  query: string;
  onQueryChange: (value: string) => void;
  kind: KindFilter;
  onKindChange: (value: KindFilter) => void;
  material: MaterialKey | "all";
  onMaterialChange: (value: MaterialKey | "all") => void;
  region: string;
  onRegionChange: (value: string) => void;
  view: ViewMode;
  onViewChange: (value: ViewMode) => void;
  onOpenDrives: () => void;
  onPost: () => void;
  radius: "all" | number;
  onRadiusChange: (value: "all" | number) => void;
};

/** Sticky Market home header: wordmark, actions, search, the Have/Need switch,
 * a single Filters button (with active count) and active-filter chips. */
export function MarketHeader({
  query,
  onQueryChange,
  kind,
  onKindChange,
  material,
  onMaterialChange,
  region,
  onRegionChange,
  view,
  onViewChange,
  onOpenDrives,
  onPost,
  radius,
  onRadiusChange,
}: MarketHeaderProps) {
  const [panelOpen, setPanelOpen] = useState<boolean>(false);

  const activeCount =
    (material !== "all" ? 1 : 0) + (region !== "all" ? 1 : 0) + (radius !== "all" ? 1 : 0);
  const hasActive = activeCount > 0;

  const resetFilters = () => {
    onMaterialChange("all");
    onRegionChange("all");
    onRadiusChange("all");
  };

  return (
    <>
      <View style={styles.headerTop}>
        <Text style={styles.wordmark}>glean</Text>
        <View style={styles.headerBtns}>
          <PressableScale hapticStyle="light" onPress={onOpenDrives} style={styles.drivesBtn}>
            <Megaphone color={Colors.skyDeep} size={19} />
          </PressableScale>
          <MessagesButton />
          <PressableScale hapticStyle="medium" onPress={onPost} style={styles.postBtn}>
            <Plus color={Colors.white} size={20} strokeWidth={2.5} />
          </PressableScale>
        </View>
      </View>

      <View style={styles.searchRow}>
        <Search color={Colors.mist} size={18} />
        <TextInput
          value={query}
          onChangeText={onQueryChange}
          placeholder="Search materials, areas…"
          placeholderTextColor={Colors.mist}
          style={styles.searchInput}
        />
      </View>

      <View style={styles.controlRow}>
        <Segmented
          options={KIND_OPTIONS}
          value={kind}
          onChange={onKindChange}
          style={styles.kindSegment}
        />
        <PressableScale
          hapticStyle="light"
          onPress={() => setPanelOpen(true)}
          style={[styles.filtersBtn, hasActive && styles.filtersBtnActive]}
        >
          <SlidersHorizontal color={hasActive ? Colors.skyDeep : Colors.slate} size={19} />
          {hasActive ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{activeCount}</Text>
            </View>
          ) : null}
        </PressableScale>
        <PressableScale
          hapticStyle="light"
          onPress={() => onViewChange(view === "list" ? "map" : "list")}
          style={styles.viewToggle}
        >
          {view === "list" ? (
            <MapIcon color={Colors.skyDeep} size={18} />
          ) : (
            <List color={Colors.skyDeep} size={18} />
          )}
          <Text style={styles.viewToggleText}>{view === "list" ? "Map" : "List"}</Text>
        </PressableScale>
      </View>

      {hasActive ? (
        <View style={styles.activeChips}>
          {material !== "all" ? (
            <ActiveChip
              label={MATERIALS[material].label}
              color={MATERIALS[material].color}
              soft={MATERIALS[material].soft}
              onRemove={() => onMaterialChange("all")}
            />
          ) : null}
          {region !== "all" ? (
            <ActiveChip label={region} onRemove={() => onRegionChange("all")} />
          ) : null}
          {radius !== "all" ? (
            <ActiveChip label={`${radius} km`} onRemove={() => onRadiusChange("all")} />
          ) : null}
        </View>
      ) : null}

      <FilterPanel
        visible={panelOpen}
        onClose={() => setPanelOpen(false)}
        material={material}
        onMaterialChange={onMaterialChange}
        region={region}
        onRegionChange={onRegionChange}
        radius={radius}
        onRadiusChange={onRadiusChange}
        onReset={resetFilters}
      />
    </>
  );
}

function ActiveChip({
  label,
  color = Colors.skyDeep,
  soft = Colors.skySoft,
  onRemove,
}: {
  label: string;
  color?: string;
  soft?: string;
  onRemove: () => void;
}) {
  return (
    <PressableScale
      hapticStyle="light"
      onPress={onRemove}
      style={[styles.activeChip, { backgroundColor: soft, borderColor: color }]}
    >
      <Text style={[styles.activeChipText, { color }]}>{label}</Text>
      <X color={color} size={13} strokeWidth={2.6} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  wordmark: {
    fontFamily: Fonts.script,
    fontSize: 40,
    color: Colors.skyDeep,
    lineHeight: 46,
    transform: [{ translateY: 4 }],
  },
  headerBtns: { flexDirection: "row", alignItems: "center", gap: 10 },
  drivesBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.skySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  postBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.sky,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.sky,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.line,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 15,
    color: Colors.charcoal,
  },
  controlRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  kindSegment: { flex: 1 },
  filtersBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.line,
    backgroundColor: Colors.card,
  },
  filtersBtnActive: {
    backgroundColor: Colors.skySoft,
    borderColor: "#CFE3F9",
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    backgroundColor: Colors.sky,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontFamily: Fonts.sansBold,
    fontSize: 11,
    color: Colors.white,
  },
  activeChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  activeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingLeft: 12,
    paddingRight: 10,
    height: 32,
    borderRadius: 999,
    borderWidth: 1,
  },
  activeChipText: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 13,
  },
  viewToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 46,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#CFE3F9",
    backgroundColor: Colors.skySoft,
  },
  viewToggleText: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 14,
    color: Colors.skyDeep,
  },
});
