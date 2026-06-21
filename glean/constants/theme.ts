/**
 * Glean's canonical design tokens — the single source of truth for spacing,
 * radii, type scale, and elevation. Colors live in `constants/colors.ts` and
 * are re-exported here so components import everything from one place.
 *
 * This is the native equivalent of a Tailwind theme: every spacing/radius/size
 * value in the app should come from these tokens, never a magic number.
 */
import { Platform, TextStyle, ViewStyle } from "react-native";

import Colors from "@/constants/colors";
import { Fonts } from "@/constants/fonts";

export { default as Colors } from "@/constants/colors";
export { Fonts } from "@/constants/fonts";

/** 4pt spacing scale. Use `spacing.md` etc. instead of raw numbers. */
export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 44,
} as const;

/** Corner radii. `card`/`button`/`pill` are semantic aliases. */
export const radius = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
  card: 18,
  button: 14,
} as const;

/** Type scale paired with sensible line heights. */
export const fontSize = {
  xs: 11,
  sm: 13,
  base: 14,
  md: 15,
  lg: 17,
  xl: 19,
  "2xl": 22,
  "3xl": 26,
  "4xl": 32,
} as const;

/** Canonical screen padding used by every screen container. */
export const screenPadding = spacing.lg;

/** Soft, consistent elevation presets (iOS shadow + Android elevation). */
export const elevation: Record<"none" | "sm" | "md" | "lg", ViewStyle> = {
  none: {},
  sm: Platform.select<ViewStyle>({
    ios: {
      shadowColor: Colors.charcoal,
      shadowOpacity: 0.06,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
    },
    default: { elevation: 2 },
  }),
  md: Platform.select<ViewStyle>({
    ios: {
      shadowColor: Colors.charcoal,
      shadowOpacity: 0.1,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
    },
    default: { elevation: 5 },
  }),
  lg: Platform.select<ViewStyle>({
    ios: {
      shadowColor: Colors.charcoal,
      shadowOpacity: 0.14,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 12 },
    },
    default: { elevation: 9 },
  }),
};

/**
 * Canonical text style presets tied to the type scale. Components and screens
 * spread these instead of redefining font/size/color inline.
 */
export const typography: Record<string, TextStyle> = {
  display: { fontFamily: Fonts.serifBold, fontSize: fontSize["4xl"], color: Colors.charcoal, lineHeight: 38 },
  title: { fontFamily: Fonts.serif, fontSize: fontSize["2xl"], color: Colors.charcoal, lineHeight: 28 },
  heading: { fontFamily: Fonts.serif, fontSize: fontSize.xl, color: Colors.charcoal, lineHeight: 24 },
  subtitle: { fontFamily: Fonts.sansSemibold, fontSize: fontSize.lg, color: Colors.charcoal, lineHeight: 22 },
  body: { fontFamily: Fonts.sans, fontSize: fontSize.base, color: Colors.ink, lineHeight: 20 },
  bodyMedium: { fontFamily: Fonts.sansMedium, fontSize: fontSize.base, color: Colors.ink, lineHeight: 20 },
  label: { fontFamily: Fonts.sansSemibold, fontSize: fontSize.md, color: Colors.charcoal },
  caption: { fontFamily: Fonts.sans, fontSize: fontSize.sm, color: Colors.slate, lineHeight: 18 },
  overline: { fontFamily: Fonts.sansSemibold, fontSize: fontSize.xs, color: Colors.mist, letterSpacing: 0.6, textTransform: "uppercase" },
  mono: { fontFamily: Fonts.mono, fontSize: fontSize.base, color: Colors.charcoal },
  monoBold: { fontFamily: Fonts.monoBold, fontSize: fontSize.lg, color: Colors.charcoal },
};

export type TypographyVariant = keyof typeof typography;
