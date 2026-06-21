import React from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { Text } from "@/components/ui";

export function FormFooter({
  error,
  children,
  style,
  contentStyle,
}: {
  error?: string | null;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }, style]}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={contentStyle}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Colors.paper,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
  },
  error: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13.5,
    color: Colors.danger,
    marginBottom: 10,
    lineHeight: 19,
  },
});
