import React from "react";
import { StyleSheet, View } from "react-native";
import { Check } from "lucide-react-native";
import Colors from "@/constants/colors";

export function VerifiedBadge({ size = 14 }: { size?: number }) {
  return (
    <View
      style={[
        styles.verified,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Check color={Colors.white} size={size * 0.72} strokeWidth={3.8} />
    </View>
  );
}

const styles = StyleSheet.create({
  verified: {
    backgroundColor: Colors.sky,
    alignItems: "center",
    justifyContent: "center",
  },
});
