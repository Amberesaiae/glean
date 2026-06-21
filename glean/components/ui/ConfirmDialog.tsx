import React from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import Colors from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { radius, spacing, fontSize as fontSizeRef } from "@/constants/theme";
import { Button } from "./Button";
import { Text } from "./Text";

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  destructive,
  busy,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
  busy?: boolean;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.dialogOverlay} onPress={onCancel}>
        <Pressable style={styles.dialogCard}>
          <Text style={styles.dialogTitle}>{title}</Text>
          <Text style={styles.dialogMessage}>{message}</Text>
          <View style={styles.dialogActions}>
            <Button
              label={cancelLabel}
              onPress={onCancel}
              variant="outline"
              disabled={busy}
              fullWidth
            />
            <Button
              label={confirmLabel}
              onPress={onConfirm}
              variant={destructive ? "destructive" : "primary"}
              loading={busy}
              fullWidth
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dialogOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(20,28,28,0.45)",
    paddingHorizontal: spacing["3xl"],
  },
  dialogCard: {
    width: "100%",
    backgroundColor: Colors.paper,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  dialogTitle: {
    fontFamily: Fonts.serifBold,
    fontSize: fontSizeRef["2xl"],
    color: Colors.charcoal,
  },
  dialogMessage: {
    fontFamily: Fonts.sans,
    fontSize: 14.5,
    lineHeight: 21,
    color: Colors.slate,
  },
  dialogActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
  },
});
