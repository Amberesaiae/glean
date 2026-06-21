import React from "react";
import { StyleSheet } from "react-native";
import Colors from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { radius, spacing } from "@/constants/theme";
import { PressableScale } from "./PressableScale";
import { Text } from "./Text";

export function Chip({
  label,
  active,
  onPress,
  icon,
  color = Colors.sky,
  softColor = Colors.skySoft,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: React.ReactNode;
  color?: string;
  softColor?: string;
}) {
  const bg = active ? softColor : Colors.card;
  const border = active ? color : Colors.line;
  const fontColor = active ? color : Colors.slate;

  return (
    <PressableScale
      onPress={onPress}
      style={[
        styles.chip,
        { backgroundColor: bg, borderColor: border },
        !!icon && styles.chipWithIcon,
      ]}
    >
      {icon}
      <Text color={fontColor} style={styles.chipText}>
        {label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingLeft: 10,
  },
  chipText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
  },
});
