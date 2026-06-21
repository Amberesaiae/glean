import React from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { X } from "lucide-react-native";
import Colors from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { radius, spacing, fontSize as fontSizeRef } from "@/constants/theme";
import { PressableScale } from "./PressableScale";
import { Text } from "./Text";

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Sheet({ visible, onClose, title, children }: SheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.sheetBackdrop} onPress={onClose} />
      <View style={styles.sheetAnchor}>
        <View style={styles.sheetPanel}>
          <View style={styles.sheetGrabber} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <PressableScale onPress={onClose} style={styles.sheetClose} hitSlop={8}>
              <X color={Colors.charcoal} size={16} strokeWidth={2.4} />
            </PressableScale>
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(20,28,28,0.45)",
  },
  sheetAnchor: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheetPanel: {
    backgroundColor: Colors.paper,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing["3xl"],
    paddingHorizontal: spacing.xl,
    maxHeight: "78%",
  },
  sheetGrabber: {
    alignSelf: "center",
    width: 40,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: Colors.line,
    marginBottom: spacing.md,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  sheetTitle: {
    fontFamily: Fonts.serif,
    fontSize: fontSizeRef.xl,
    color: Colors.charcoal,
  },
  sheetClose: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.cardAlt,
    alignItems: "center",
    justifyContent: "center",
  },
});
