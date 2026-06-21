import React from "react";
import { StyleSheet, View } from "react-native";
import Colors from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { spacing } from "@/constants/theme";
import { PressableScale } from "./PressableScale";
import { Text } from "./Text";

export function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionLabel && onAction ? (
        <PressableScale onPress={onAction} hitSlop={12}>
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </PressableScale>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: Fonts.serif,
    fontSize: 20,
    color: Colors.charcoal,
  },
  sectionAction: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 14,
    color: Colors.sky,
  },
});
