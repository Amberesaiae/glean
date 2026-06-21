import React from "react";
import { StyleSheet, View } from "react-native";
import Colors, { MATERIALS, MaterialKey } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { radius } from "@/constants/theme";
import { MaterialIcon } from "../illustrations";
import { Text } from "./Text";

export function Badge({
  text,
  icon,
  color = Colors.slate,
  softColor = Colors.cardAlt,
}: {
  text: string;
  icon?: React.ReactNode;
  color?: string;
  softColor?: string;
}) {
  return (
    <View style={[styles.badge, { backgroundColor: softColor }]}>
      {icon}
      <Text color={color} style={styles.badgeText}>
        {text}
      </Text>
    </View>
  );
}

export function MaterialTag({
  material,
  small,
}: {
  material: MaterialKey;
  small?: boolean;
}) {
  const m = MATERIALS[material];
  return (
    <View
      style={[
        styles.tag,
        { backgroundColor: m.soft },
        small && styles.tagSmall,
      ]}
    >
      <MaterialIcon material={material} size={small ? 14 : 17} />
      <Text color={m.color} style={styles.tagText}>
        {m.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 12.5,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    alignSelf: "flex-start",
  },
  tagSmall: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 12.5,
  },
});
