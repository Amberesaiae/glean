/**
 * Glean palette — warm, grounded, anti-greenwashing.
 * Clear sky blue + amber accents on a warm off-white, deep charcoal text.
 */
const palette = {
  sky: "#1F7AE0",
  skyDeep: "#155CAB",
  skySoft: "#E3F0FD",
  amber: "#F2A104",
  amberInk: "#8A5A00",
  amberSoft: "#FCEBC7",
  charcoal: "#1B1F23",
  ink: "#2C3238",
  slate: "#5C6670",
  mist: "#8A949E",
  paper: "#FBF7F0",
  card: "#FFFFFF",
  cardAlt: "#F4EFE6",
  line: "#E7E0D4",
  success: "#2E9E5B",
  successSoft: "#DCF2E5",
  danger: "#D64545",
  dangerSoft: "#F9E1E1",
  white: "#FFFFFF",
} as const;

const Colors = {
  ...palette,
  light: {
    text: palette.charcoal,
    background: palette.paper,
    tint: palette.sky,
    tabIconDefault: palette.mist,
    tabIconSelected: palette.sky,
  },
};

/** Material categories used across the app. */
export const MATERIALS = {
  plastics: { label: "Plastics", color: palette.sky, soft: palette.skySoft },
  organic: { label: "Organic", color: palette.success, soft: palette.successSoft },
  metals: { label: "Metals", color: palette.slate, soft: palette.cardAlt },
  textiles: { label: "Textiles", color: "#8E5BC4", soft: "#EFE4F8" },
  other: { label: "Other", color: palette.amber, soft: palette.amberSoft },
} as const;

export type MaterialKey = keyof typeof MATERIALS;

/** Ghana's 16 administrative regions. */
export const REGIONS = [
  "Greater Accra",
  "Ashanti",
  "Western",
  "Central",
  "Eastern",
  "Volta",
  "Northern",
  "Upper East",
  "Upper West",
  "Bono",
  "Bono East",
  "Ahafo",
  "Savannah",
  "North East",
  "Oti",
  "Western North",
] as const;

export type Region = (typeof REGIONS)[number];

export default Colors;
