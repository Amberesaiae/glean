import { router } from "expo-router";
import { Check } from "lucide-react-native";
import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, PressableScale, Text, haptic } from "@/components/ui";
import { EcoImage } from "@/components/illustrations";
import Colors from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { ROLES } from "@/constants/roles";
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
  const [role, setRole] = useState<UserRole>(me?.role ?? "collector");
  const [saving, setSaving] = useState<boolean>(false);

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await updateMe({ role });
      haptic("success");
      completeRolePick();
      router.replace("/(tabs)");
    } catch {
      haptic("medium");
      setSaving(false);
      Alert.alert(
        "Connection Issue",
        "We couldn't save your profile role selection. Would you like to try again or configure it in settings later?",
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
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.kicker}>WELCOME TO GLEAN</Text>
        <Text style={styles.title}>What best describes you?</Text>
        <Text style={styles.sub}>
          This shapes your profile and how your impact is counted. You can change it anytime.
        </Text>

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
      </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <Button label="Continue" onPress={save} loading={saving} fullWidth />
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },
  content: { padding: 20, paddingBottom: 40 },
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
  sub: {
    fontFamily: Fonts.sans,
    fontSize: 14.5,
    color: Colors.slate,
    lineHeight: 21,
    marginTop: 8,
  },
  list: { gap: 12, marginTop: 22 },
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
