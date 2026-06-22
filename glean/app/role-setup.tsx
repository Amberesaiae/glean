import { router } from "expo-router";
import { Camera, Check } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar, Button, Input, Label, PressableScale, Text, haptic } from "@/components/ui";
import { useMediaPicker } from "@/components/media-picker";
import { EcoImage } from "@/components/illustrations";
import Colors from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { ROLES } from "@/constants/roles";
import { uploadMedia } from "@/lib/upload";
import { useApp } from "@/providers/AppProvider";
import type { UserRole } from "@/types";

const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  collector: "I gather and sell recyclable materials.",
  maker: "I turn waste into new products.",
  processor: "I compost or process organic waste.",
  farmer: "I source materials to grow with.",
  anchor: "I buy in bulk and run collection drives.",
};

const ORDER: UserRole[] = ["collector", "maker", "processor", "farmer", "anchor"];

export default function RoleSetupScreen() {
  const insets = useSafeAreaInsets();
  const { me, updateMe, completeRolePick } = useApp();
  const { pick, element: mediaSheet } = useMediaPicker();

  const [role, setRole] = useState<UserRole>(me?.role ?? "collector");
  const [trade, setTrade] = useState<string>(me?.trade ?? "");
  const [bio, setBio] = useState<string>(me?.bio ?? "");
  const [avatar, setAvatar] = useState<string | undefined>(me?.avatar);
  const [uploading, setUploading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const pickAvatar = async () => {
    const asset = await pick({ mediaTypes: "images", allowsEditing: true, aspect: [1, 1] });
    if (!asset) return;
    setError(null);
    setUploading(true);
    try {
      const url = await uploadMedia(asset, "avatars");
      setAvatar(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't upload photo.");
    } finally {
      setUploading(false);
    }
  };

  const save = async (bypass = false) => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      // If bypassing, we can default role to collector (or leave as is) and not send custom bio/trade
      const payload = bypass
        ? { role: "collector" as UserRole }
        : {
            role,
            trade: trade.trim(),
            bio: bio.trim(),
            ...(avatar ? { avatar } : {}),
          };

      await updateMe(payload);
      haptic("success");
      completeRolePick();
      router.replace("/(tabs)");
    } catch (e) {
      haptic("medium");
      setSaving(false);
      Alert.alert(
        "Connection Issue",
        "We couldn't save your profile setup. Would you like to try again or configure it in settings later?",
        [
          { text: "Retry", style: "cancel" },
          {
            text: "Proceed anyway",
            onPress: () => {
              completeRolePick();
              router.replace("/(tabs)");
            },
          },
        ]
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 24 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.kicker}>WELCOME TO GLEAN</Text>
            <Text style={styles.title}>Set up your profile</Text>
          </View>
          <PressableScale onPress={() => save(true)} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip</Text>
          </PressableScale>
        </View>

        <Text style={styles.sub}>
          Customize how you appear in the community. You can update these details anytime.
        </Text>

        <View style={styles.avatarRow}>
          <PressableScale onPress={pickAvatar} disabled={uploading}>
            <Avatar uri={avatar ?? me?.avatar ?? ""} size={84} />
            <View style={styles.avatarBadge}>
              {uploading ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Camera color={Colors.white} size={14} />
              )}
            </View>
          </PressableScale>
          <Text style={styles.avatarHint}>Tap to upload a profile photo</Text>
        </View>

        <Label text="Bio" />
        <Input
          value={bio}
          onChangeText={setBio}
          placeholder="Tell the community about yourself, your goals, or your project..."
          textarea
        />

        <Label text="What best describes your role?" />
        <View style={styles.list}>
          {ORDER.map((key) => {
            const r = ROLES[key];
            const active = role === key;
            return (
              <PressableScale key={key} onPress={() => { haptic("light"); setRole(key); }}>
                <View style={getRoleCardStyle(r.soft, r.color, active)}>
                  <View style={getRoleArtStyle(active)}>
                    <EcoImage name={r.illustration} size={30} />
                  </View>
                  <View style={styles.flex1}>
                    <Text style={getRoleLabelStyle(r.color, active)}>{r.label}</Text>
                    <Text style={styles.roleDesc}>{ROLE_DESCRIPTIONS[key]}</Text>
                  </View>
                  {active ? (
                    <View style={getCheckStyle(r.color)}>
                      <Check color={Colors.white} size={15} />
                    </View>
                  ) : null}
                </View>
              </PressableScale>
            );
          })}
        </View>

        <Label text="Trade (Optional)" />
        <Input
          value={trade}
          onChangeText={setTrade}
          placeholder="e.g. PET collector, organic compost, etc."
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Button label="Save & Continue" onPress={() => save(false)} loading={saving} fullWidth />
      </View>
      {mediaSheet}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },
  content: { padding: 20, paddingBottom: 40 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: { flex: 1 },
  kicker: {
    fontFamily: Fonts.monoBold,
    fontSize: 11,
    letterSpacing: 1,
    color: Colors.sky,
  },
  title: {
    fontFamily: Fonts.serifBold,
    fontSize: 28,
    color: Colors.charcoal,
    marginTop: 8,
  },
  skipBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.cardAlt,
  },
  skipText: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 13,
    color: Colors.slate,
  },
  sub: {
    fontFamily: Fonts.sans,
    fontSize: 14.5,
    color: Colors.slate,
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 20,
  },
  avatarRow: {
    alignItems: "center",
    marginBottom: 20,
    gap: 8,
  },
  avatarBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.sky,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.paper,
  },
  avatarHint: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12.5,
    color: Colors.slate,
  },
  list: { gap: 12, marginTop: 10, marginBottom: 20 },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 14,
  },
  roleArt: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  roleLabel: { fontFamily: Fonts.sansBold, fontSize: 16, color: Colors.charcoal },
  roleDesc: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.slate,
    marginTop: 2,
  },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  error: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13.5,
    color: Colors.danger,
    marginTop: 14,
    lineHeight: 19,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Colors.paper,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
  },
  flex1: { flex: 1 },
});

function getRoleCardStyle(activeBg: string, activeBorder: string, active: boolean) {
  return [
    styles.roleCard,
    active
      ? { backgroundColor: activeBg, borderColor: activeBorder }
      : { backgroundColor: Colors.card, borderColor: Colors.line },
  ];
}

function getRoleArtStyle(active: boolean) {
  return [
    styles.roleArt,
    { backgroundColor: active ? Colors.white : Colors.cardAlt },
  ];
}

function getRoleLabelStyle(color: string, active: boolean) {
  return [styles.roleLabel, active ? { color } : null];
}

function getCheckStyle(color: string) {
  return [styles.check, { backgroundColor: color }];
}

