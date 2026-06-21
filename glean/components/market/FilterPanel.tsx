import React from "react";
import { StyleSheet, View } from "react-native";

import { Button, Chip, Sheet, Text } from "@/components/ui";
import { EcoImage, MATERIAL_ECO } from "@/components/illustrations";
import Colors, { MATERIALS, MaterialKey, REGIONS } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";

const RADII = [5, 10, 25, 50] as const;

type FilterPanelProps = {
  visible: boolean;
  onClose: () => void;
  material: MaterialKey | "all";
  onMaterialChange: (value: MaterialKey | "all") => void;
  region: string;
  onRegionChange: (value: string) => void;
  radius: "all" | number;
  onRadiusChange: (value: "all" | number) => void;
  onReset: () => void;
};

/** Slide-up panel consolidating materials, regions and distance filters. */
export function FilterPanel({
  visible,
  onClose,
  material,
  onMaterialChange,
  region,
  onRegionChange,
  radius,
  onRadiusChange,
  onReset,
}: FilterPanelProps) {
  return (
    <Sheet visible={visible} onClose={onClose} title="Filters">
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Material</Text>
        <View style={styles.chipWrap}>
          <Chip
            label="All materials"
            active={material === "all"}
            onPress={() => onMaterialChange("all")}
          />
          {(Object.keys(MATERIALS) as MaterialKey[]).map((m) => (
            <Chip
              key={m}
              label={MATERIALS[m].label}
              active={material === m}
              onPress={() => onMaterialChange(m)}
              color={MATERIALS[m].color}
              softColor={MATERIALS[m].soft}
              icon={<EcoImage name={MATERIAL_ECO[m]} size={16} />}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Region</Text>
        <View style={styles.chipWrap}>
          <Chip
            label="All regions"
            active={region === "all"}
            onPress={() => onRegionChange("all")}
          />
          {REGIONS.map((r) => (
            <Chip key={r} label={r} active={region === r} onPress={() => onRegionChange(r)} />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Near me</Text>
        <View style={styles.chipWrap}>
          <Chip
            label="Anywhere"
            active={radius === "all"}
            onPress={() => onRadiusChange("all")}
          />
          {RADII.map((r) => (
            <Chip
              key={r}
              label={`${r} km`}
              active={radius === r}
              onPress={() => onRadiusChange(r)}
            />
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Button label="Reset" variant="outline" onPress={onReset} style={styles.resetBtn} />
        <Button label="Done" onPress={onClose} style={styles.doneBtn} />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 18,
    gap: 10,
  },
  sectionLabel: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 13,
    color: Colors.slate,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  footer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 24,
  },
  resetBtn: { flex: 1 },
  doneBtn: { flex: 1 },
});
