import React from "react";
import { StyleSheet } from "react-native";
import { Image } from "expo-image";
import Colors from "@/constants/colors";

export function Avatar({ uri, size = 40 }: { uri: string; size?: number }) {
  return (
    <Image
      source={{ uri }}
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
      contentFit="cover"
      transition={150}
    />
  );
}

const styles = StyleSheet.create({
  avatar: { backgroundColor: Colors.cardAlt },
});
