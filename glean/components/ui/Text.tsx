import React from "react";
import { Text as RNText, StyleProp, TextStyle } from "react-native";
import Colors from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { typography, TypographyVariant } from "@/constants/theme";

interface TextProps {
  children: React.ReactNode;
  variant?: TypographyVariant;
  color?: string;
  align?: TextStyle["textAlign"];
  numberOfLines?: number;
  style?: StyleProp<TextStyle>;
}

export function Text({
  children,
  variant = "body",
  color,
  align,
  numberOfLines,
  style,
}: TextProps) {
  return (
    <RNText
      numberOfLines={numberOfLines}
      style={[
        typography[variant],
        color ? { color } : null,
        align ? { textAlign: align } : null,
        style,
      ]}
    >
      {children}
    </RNText>
  );
}

export const text: Record<string, TextStyle> = {
  serif: { fontFamily: Fonts.serif, color: Colors.charcoal },
  serifBold: { fontFamily: Fonts.serifBold, color: Colors.charcoal },
  body: { fontFamily: Fonts.sans, color: Colors.ink },
  medium: { fontFamily: Fonts.sansMedium, color: Colors.ink },
  semibold: { fontFamily: Fonts.sansSemibold, color: Colors.charcoal },
  mono: { fontFamily: Fonts.mono, color: Colors.charcoal },
  monoBold: { fontFamily: Fonts.monoBold, color: Colors.charcoal },
};
