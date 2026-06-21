import { router } from "expo-router";
import { Camera, Check } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar, Button, Chip, Input, Label, PressableScale, Text, haptic } from "@/components/ui";
import { useMediaPicker } from "@/components/media-picker";
import { EcoImage } from "@/components/illustrations";
import Colors, { REGIONS } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { ROLES } from "@/constants/roles";
import { uploadMedia } from "@/lib/upload";
import { useApp } from "@/providers/AppProvider";
import type { UserRole } from "@/types";

const ROLE_ORDER: UserRole[] = ["collector", "maker", "processor", "farmer", "anchor"];

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const { me, updateMe } = useApp();
  const { pick, element: mediaSheet } = useMediaPicker();

  const [name, setName] = useState<string>(me?.name ?? "");
  const [role, setRole] = useState<UserRole>(me?.role ?? "collector");
  const [trade, setTrade] = useState<string>(me?.trade ?? "");
  const [region, setRegion] = useState<string>(me?.region ?? REGIONS[0]);
  const [bio, setBio] = useState<string>(me?.bio ?? "");
  const [avatar, setAvatar] = useState<string | undefined>(me?.avatar);
  const [uploading, setUploading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!me) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.sky} />
      </View>
    );
  }

  const valid = name.trim().length > 1 && bio.trim().length > 4;

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

  const save = async () => {
    if (!valid || saving) return;
    setSaving(true);
    setError(null);
    try {
      await updateMe({
        name: name.trim(),
        role,
        trade: trade.trim(),
        region: region as (typeof REGIONS)[number],
        bio: bio.trim(),
        ...(avatar ? { avatar } : {}),
      });
      haptic("success");
      router.back();
    } catch (e) {
      haptic("medium");
      setError(e instanceof Error ? e.message : "Couldn't save changes.");
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarRow}>
          <PressableScale onPress={pickAvatar} disabled={uploading}>
            <Avatar uri={avatar ?? me.avatar} size={92} />
            <View style={styles.avatarBadge}>
              {uploading ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Camera color={Colors.white} size={16} />
              )}
            </View>
          </PressableScale>
          <Text style={styles.avatarHint}>Tap to change your photo</Text>
        </View>

        <Label text="Name" />
        <Input value={name} onChangeText={setName} />

        <Label text="I am a…" />
        <View style={styles.roleGrid}>
          {ROLE_ORDER.map((key) => {
            const r = ROLES[key];
            const active = role === key;
            return (
              <PressableScale
                key={key}
                onPress={() => { haptic("light"); setRole(key); }}
                style={getRoleChipStyle(r.soft, r.color, active)}
              >
                <EcoImage name={r.illustration} size={18} />
                <Text style={getRoleChipTextStyle(r.color, active)}>
                  {r.label}
                </Text>
              </PressableScale>
            );
          })}
        </View>

        <Label text="Trade" />
        <Input
          value={trade}
          onChangeText={setTrade}
          placeholder="e.g. PET collector"
        />

        <Label text="Region" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {REGIONS.map((r) => (
            <Chip
              key={r}
              label={r}
              active={region === r}
              onPress={() => setRegion(r)}
            />
          ))}
        </ScrollView>

        <Label text="Bio" />
        <Input value={bio} onChangeText={setBio} textarea />

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Button
          label="Save changes"
          onPress={save}
          disabled={!valid || uploading}
          loading={saving}
          fullWidth
          icon={<Check color={Colors.white} size={18} />}
        />
      </View>
      {mediaSheet}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.paper,
  },
  content: { padding: 20, paddingBottom: 40 },
  avatarRow: { alignItems: "center", marginBottom: 12, gap: 10 },
  avatarBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.sky,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.paper,
  },
  avatarHint: { fontFamily: Fonts.sansMedium, fontSize: 13, color: Colors.slate },
  chipRow: { gap: 8, paddingRight: 20, marginBottom: 18 },
  roleGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 18 },
  roleChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  roleChipText: { fontFamily: Fonts.sansSemibold, fontSize: 13, color: Colors.ink },
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
});

function getRoleChipStyle(soft: string, color: string, active: boolean) {
  return [
    styles.roleChip,
    active
      ? { backgroundColor: soft, borderColor: color }
      : { backgroundColor: Colors.card, borderColor: Colors.line },
  ];
}

function getRoleChipTextStyle(color: string, active: boolean) {
  return [styles.roleChipText, active ? { color } : null];
}
