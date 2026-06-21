import React from "react";
import { StyleSheet, View } from "react-native";
import Colors from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { spacing } from "@/constants/theme";
import { Text } from "./Text";

export function Label({
  text,
  hint,
  required,
}: {
  text: string;
  hint?: string;
  required?: boolean;
}) {
  return (
    <View style={styles.labelRow}>
      <Text style={styles.label}>
        {text}
        {required ? <Text color={Colors.danger}> *</Text> : null}
      </Text>
      {hint ? <Text style={styles.labelHint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  label: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 14,
    color: Colors.charcoal,
  },
  labelHint: {
    fontFamily: Fonts.sans,
    fontSize: 12.5,
    color: Colors.mist,
  },
});
