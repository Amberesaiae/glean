/**
 * Tiny native equivalent of `class-variance-authority` (the shadcn variant
 * pattern), but for React Native style objects instead of class strings.
 *
 * Define a base style plus named variant groups, and `createVariants` returns a
 * resolver that merges base + selected variants + defaults into one flat style.
 */
import { StyleProp } from "react-native";

type StyleValue = object;

type VariantGroups = Record<string, Record<string, StyleValue>>;

type VariantSelection<V extends VariantGroups> = {
  [K in keyof V]?: keyof V[K];
};

interface VariantConfig<V extends VariantGroups> {
  base?: StyleValue;
  variants: V;
  defaultVariants?: VariantSelection<V>;
}

/**
 * Build a style resolver from a base style and a set of variant groups.
 *
 * @example
 * const button = createVariants({
 *   base: { borderRadius: 14 },
 *   variants: { variant: { primary: {...}, ghost: {...} } },
 *   defaultVariants: { variant: "primary" },
 * });
 * const style = button({ variant: "ghost" });
 */
export function createVariants<V extends VariantGroups>(config: VariantConfig<V>) {
  return (selection?: VariantSelection<V>): StyleProp<StyleValue> => {
    const merged: StyleValue[] = [];
    if (config.base) merged.push(config.base);

    const keys = Object.keys(config.variants) as (keyof V)[];
    for (const key of keys) {
      const chosen = selection?.[key] ?? config.defaultVariants?.[key];
      if (chosen == null) continue;
      const group = config.variants[key];
      const style = group[chosen as string];
      if (style) merged.push(style);
    }

    return merged;
  };
}
