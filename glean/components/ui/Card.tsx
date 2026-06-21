import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import Colors from "@/constants/colors";
import { radius, spacing } from "@/constants/theme";
import { PressableScale } from "./PressableScale";

export function Card({
  children,
  padded = true,
  onPress,
  style,
}: {
  children: React.ReactNode;
  padded?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  if (onPress) {
    return (
      <PressableScale
        onPress={onPress}
        containerStyle={styles.cardPressable}
        style={[styles.card, padded && styles.cardPadded, style]}
      >
        {children}
      </PressableScale>
    );
  }

  return (
    <View style={[styles.card, padded && styles.cardPadded, style]}>
      {children}
    </View>
  );
}

export function CardHeader({ children }: { children: React.ReactNode }) {
  return <View style={styles.cardHeader}>{children}</View>;
}

export function CardContent({ children }: { children: React.ReactNode }) {
  return <View style={styles.cardContent}>{children}</View>;
}

export function CardFooter({ children }: { children: React.ReactNode }) {
  return <View style={styles.cardFooter}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  cardPadded: { padding: spacing.lg },
  cardPressable: { borderRadius: radius.card },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  cardContent: { gap: spacing.sm },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    marginTop: spacing.md,
  },
});
