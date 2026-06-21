import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

export function haptic(style: "light" | "medium" | "success" = "light") {
  if (Platform.OS === "web") return;
  if (style === "success") {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } else {
    Haptics.impactAsync(
      style === "medium"
        ? Haptics.ImpactFeedbackStyle.Medium
        : Haptics.ImpactFeedbackStyle.Light,
    );
  }
}
