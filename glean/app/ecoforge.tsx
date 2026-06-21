import { Image } from "expo-image";
import { Stack } from "expo-router";
import {
  Hammer,
  Leaf,
  Recycle,
  Users,
} from "lucide-react-native";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { Text } from "@/components/ui";
import { ECOFORGE, ECOFORGE_LOGO } from "@/components/illustrations";
import Colors from "@/constants/colors";
import { Fonts } from "@/constants/fonts";

const PRINCIPLES = [
  { icon: Hammer, label: "Local manufacturing" },
  { icon: Recycle, label: "Reclaimed materials" },
  { icon: Leaf, label: "Mechanical simplicity" },
  { icon: Users, label: "Community-centred design" },
] as const;

const ECOFIBER_USES = [
  "Broom fibres",
  "Packaging straps",
  "Agricultural ties",
  "Woven products",
  "Filament feedstock",
];

export default function EcoForgeScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: "EcoForge",
          headerStyle: { backgroundColor: ECOFORGE.charcoal },
          headerTintColor: Colors.white,
          headerTitleStyle: { fontFamily: Fonts.sansSemibold },
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.banner}>
          <View style={styles.logoTile}>
            <Image
              source={ECOFORGE_LOGO}
              style={styles.logo}
              contentFit="contain"
            />
          </View>
          <Text style={styles.bannerKicker}>COMMUNITY ENGINEERING INITIATIVE</Text>
          <Text style={styles.bannerTitle}>EcoForge</Text>
          <Text style={styles.bannerSub}>
            Turning local challenges into economic opportunity.
          </Text>
        </View>

        <View style={styles.body}>
          <Section title="What is EcoForge?">
            <Text style={styles.para}>
              EcoForge is a community-focused engineering initiative that designs
              and fabricates affordable technologies that transform local
              challenges into economic opportunities.
            </Text>
            <Text style={styles.para}>
              Built around four guiding principles, EcoForge develops practical
              machines that can be built, repaired, and replicated by local
              fabricators using readily available materials. Its mission is to
              strengthen local manufacturing, create jobs, reduce waste, and
              support a circular economy.
            </Text>

            <View style={styles.principleGrid}>
              {PRINCIPLES.map((p) => {
                const Icon = p.icon;
                return (
                  <View key={p.label} style={styles.principle}>
                    <View style={styles.principleIcon}>
                      <Icon color={ECOFORGE.greenDeep} size={20} />
                    </View>
                    <Text style={styles.principleLabel}>{p.label}</Text>
                  </View>
                );
              })}
            </View>
          </Section>

          <Section title="What does EcoForge do?">
            <Text style={styles.para}>
              EcoForge identifies everyday challenges faced by communities and
              develops low-cost engineering solutions through direct
              collaboration with the people who will use them. These solutions
              focus on waste recovery, climate resilience, local production, and
              income generation.
            </Text>
            <Text style={styles.para}>
              Community feedback drives every design iteration.
            </Text>
          </Section>

          <View style={styles.productCard}>
            <Text style={styles.productFlag}>THE FIRST INNOVATION</Text>
            <Text style={styles.productTitle}>EcoFiber</Text>
            <Text style={styles.productPara}>
              EcoFiber converts discarded PET plastic bottles into continuous PET
              strips that can be sold as raw manufacturing material or used to
              create products such as:
            </Text>
            <View style={styles.useList}>
              {ECOFIBER_USES.map((u) => (
                <View key={u} style={styles.useChip}>
                  <Text style={styles.useChipText}>{u}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.productPara}>
              The machine uses a simple tabletop direct-drive mechanism, requires
              no electricity, and is fabricated from locally available materials.
            </Text>
          </View>

          <Section title="Vision">
            <View style={styles.quote}>
              <Text style={styles.quoteText}>
                EcoForge exists to build practical, locally manufactured
                technologies that transform waste and community challenges into
                economic opportunity.
              </Text>
            </View>
            <Text style={styles.para}>
              EcoFiber is the first step in that vision — a low-cost machine that
              converts plastic waste into valuable manufacturing material,
              creating jobs while supporting a circular economy.
            </Text>
          </Section>
        </View>
      </ScrollView>
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },
  content: { paddingBottom: 60 },

  banner: {
    backgroundColor: ECOFORGE.charcoal,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
    alignItems: "center",
  },
  logoTile: {
    width: 92,
    height: 92,
    borderRadius: 24,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  logo: { width: 72, height: 72 },
  bannerKicker: {
    fontFamily: Fonts.monoBold,
    fontSize: 10,
    color: ECOFORGE.green,
    letterSpacing: 2,
  },
  bannerTitle: {
    fontFamily: Fonts.serifBold,
    fontSize: 34,
    color: Colors.white,
    marginTop: 6,
  },
  bannerSub: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    color: "#C9D1D9",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 22,
  },

  body: { padding: 22 },
  section: { marginBottom: 28 },
  sectionTitle: {
    fontFamily: Fonts.serifBold,
    fontSize: 22,
    color: Colors.charcoal,
    marginBottom: 12,
  },
  para: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    color: Colors.ink,
    lineHeight: 26,
    marginBottom: 14,
  },

  principleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 4,
  },
  principle: {
    flexBasis: "47%",
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: ECOFORGE.greenSoft,
    borderRadius: 14,
    padding: 12,
  },
  principleIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  principleLabel: {
    flex: 1,
    fontFamily: Fonts.sansSemibold,
    fontSize: 13.5,
    color: ECOFORGE.charcoal,
    lineHeight: 18,
  },

  productCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.line,
    borderLeftWidth: 4,
    borderLeftColor: ECOFORGE.green,
    padding: 20,
    marginBottom: 28,
  },
  productFlag: {
    fontFamily: Fonts.monoBold,
    fontSize: 10,
    color: ECOFORGE.greenDeep,
    letterSpacing: 1.5,
  },
  productTitle: {
    fontFamily: Fonts.serifBold,
    fontSize: 26,
    color: Colors.charcoal,
    marginTop: 4,
    marginBottom: 12,
  },
  productPara: {
    fontFamily: Fonts.sans,
    fontSize: 15.5,
    color: Colors.ink,
    lineHeight: 25,
  },
  useList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginVertical: 14,
  },
  useChip: {
    backgroundColor: ECOFORGE.greenSoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  useChipText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    color: ECOFORGE.greenDeep,
  },

  quote: {
    borderLeftWidth: 4,
    borderLeftColor: ECOFORGE.green,
    paddingLeft: 16,
    paddingVertical: 4,
    marginBottom: 16,
  },
  quoteText: {
    fontFamily: Fonts.serif,
    fontSize: 19,
    color: Colors.charcoal,
    lineHeight: 29,
  },
});
