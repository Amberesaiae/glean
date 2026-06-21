import React from "react";
import { Bookmark } from "lucide-react-native";
import Colors from "@/constants/colors";
import { PressableScale } from "./PressableScale";

export function SaveButton({
  saved,
  onPress,
  size = 22,
}: {
  saved: boolean;
  onPress?: () => void;
  size?: number;
}) {
  return (
    <PressableScale
      hapticStyle="light"
      onPress={onPress}
      hitSlop={12}
    >
      <Bookmark
        color={saved ? Colors.skyDeep : Colors.slate}
        fill={saved ? Colors.skyDeep : "transparent"}
        size={size}
        strokeWidth={1.85}
      />
    </PressableScale>
  );
}
