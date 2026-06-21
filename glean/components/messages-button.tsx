import { router } from "expo-router";
import { MessageCircle } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { PressableScale } from "@/components/ui";
import Colors from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { useApp } from "@/providers/AppProvider";

/** Soft circular header button that opens the inbox, with an unread count badge. */
export function MessagesButton() {
  const { unreadConversationIds } = useApp();
  const count = unreadConversationIds.size;
  return (
    <PressableScale
      hapticStyle="light"
      onPress={() => router.push("/inbox")}
      style={styles.btn}
    >
      <MessageCircle color={Colors.skyDeep} size={19} />
      {count > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 9 ? "9+" : count}</Text>
        </View>
      ) : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.skySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.danger,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: Colors.paper,
  },
  badgeText: { fontFamily: Fonts.monoBold, fontSize: 9.5, color: Colors.white },
});
