import React from "react";
import { StyleSheet, View } from "react-native";
import Colors from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { spacing } from "@/constants/theme";
import { EcoImage, EcoKey } from "../illustrations";
import { Button } from "./Button";
import { Text } from "./Text";

export function EmptyState({
  illustration,
  title,
  message,
  actionLabel,
  onAction,
}: {
  illustration: EcoKey;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.emptyState}>
      <EcoImage name={illustration} size={70} style={styles.emptyArt} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{message}</Text>
      {actionLabel && onAction ? (
        <Button
          label={actionLabel}
          onPress={onAction}
          variant="outline"
          size="sm"
          style={styles.emptyAction}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    alignItems: "center",
    paddingVertical: 56,
    paddingHorizontal: spacing["2xl"],
    gap: spacing.xs + 2,
  },
  emptyArt: { marginBottom: spacing.sm, opacity: 0.95 },
  emptyTitle: {
    fontFamily: Fonts.serif,
    fontSize: 19,
    color: Colors.charcoal,
    textAlign: "center",
  },
  emptyText: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.slate,
    textAlign: "center",
    lineHeight: 20,
  },
  emptyAction: { marginTop: spacing.lg },
});
