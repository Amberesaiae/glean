import React from "react";
import { ActivityIndicator, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import Colors from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { radius, spacing } from "@/constants/theme";
import { createVariants } from "./variants";
import { PressableScale } from "./PressableScale";
import { Text } from "./Text";

export type ButtonVariant =
  | "primary"
  | "amber"
  | "ghost"
  | "outline"
  | "destructive";
export type ButtonSize = "sm" | "default" | "lg";

const buttonContainer = createVariants({
  base: {
    borderRadius: radius.button,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  variants: {
    variant: {
      primary: {
        backgroundColor: Colors.sky,
        shadowColor: Colors.sky,
        shadowOpacity: 0.12,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
        elevation: 2,
      },
      amber: {
        backgroundColor: Colors.amber,
        shadowColor: Colors.amber,
        shadowOpacity: 0.12,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
        elevation: 2,
      },
      ghost: {
        backgroundColor: "transparent",
      },
      outline: {
        backgroundColor: "transparent",
        borderColor: Colors.line,
      },
      destructive: {
        backgroundColor: Colors.dangerSoft,
        borderColor: Colors.dangerSoft,
      },
    },
    size: {
      sm: { height: 36, paddingHorizontal: spacing.md },
      default: { height: 46, paddingHorizontal: spacing.xl },
      lg: { height: 54, paddingHorizontal: spacing["2xl"] },
    },
    disabled: {
      true: {
        opacity: 0.45,
        shadowOpacity: 0,
        elevation: 0,
      },
    },
  },
});

const labelColor = (variant: ButtonVariant) => {
  if (variant === "ghost" || variant === "outline") return Colors.sky;
  if (variant === "destructive") return Colors.danger;
  return Colors.white;
};

export function Button({
  label,
  variant = "primary",
  size = "default",
  onPress,
  disabled,
  loading,
  fullWidth,
  icon,
  style,
}: {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const container = buttonContainer({ variant, size, disabled: (disabled || loading) ? "true" : undefined });
  const fontColor = labelColor(variant);
  const fontSize = size === "sm" ? "bodySm" : "body";

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled || loading}
      containerStyle={fullWidth ? styles.flex1 : null}
      style={[container, fullWidth && { width: "100%" }, style]}
    >
      <View style={styles.buttonInner}>
        {loading ? (
          <ActivityIndicator color={fontColor} size="small" />
        ) : (
          <>
            {icon}
            <Text variant={fontSize} color={fontColor} style={styles.buttonLabel}>
              {label}
            </Text>
          </>
        )}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  buttonInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  buttonLabel: {
    fontFamily: Fonts.sansSemibold,
  },
  flex1: { flex: 1 },
});
