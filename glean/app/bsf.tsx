import { Image } from "expo-image";
import { Stack } from "expo-router";
import { Bug, Leaf, Recycle, Sprout } from "lucide-react-native";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { Text } from "@/components/ui";
import { ECOFORGE } from "@/components/illustrations";
import Colors from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { PHOTOS } from "@/constants/photos";

const BSF_GREEN = "#5E8E2B";
const BSF_SOFT = "#EAF2DD";

const INPUTS = [
  { icon: Recycle, label: "Food & market waste" },
  { icon: Leaf, label: "Brewery & agri by-products" },
  { icon: Sprout, label: "Spoiled produce" },
  { icon: Bug, label: "Manure & organic residue" },
] as const;

const OUTPUTS = [
  "Live larvae for poultry & fish",
  "Dried larvae meal (60%+ protein)",
  "Frass organic fertiliser",
  "Reduced waste to landfill",
];

const STEPS = [
  {
    n: "1",
    title: "Collect organic waste",
    body: "Food scraps, market spoilage and agri by-products are gathered as feedstock — the same streams Glean members already move.",
  },
  {
    n: "2",
    title: "Feed the larvae",
    body: "Black soldier fly larvae eat through the waste in days, converting it into body mass far faster than composting.",
  },
  {
    n: "3",
    title: "Harvest larvae",
    body: "Mature larvae are sieved out and sold live or dried as a protein-rich animal feed for poultry and fish farms.",
  },
  {
    n: "4",
    title: "Sell the frass",
    body: "What's left behind — frass — is a nutrient-dense organic fertiliser that farmers buy to enrich their soil.",
  },
];

export default function BsfScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: "BSF Production",
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
          <Image
            source={{ uri: PHOTOS.bsfLarvae }}
            style={styles.bannerImage}
            contentFit="cover"
            transition={200}
          />
          <View style={styles.bannerOverlay} />
          <View style={styles.bannerBody}>
            <Text style={styles.bannerKicker}>ORGANIC LOOP</Text>
            <Text style={styles.bannerTitle}>Black Soldier Fly production</Text>
          </View>
        </View>

        <View style={styles.body}>
          <Section title="What is it?">
            <Text style={styles.para}>
              Black soldier fly (BSF) production rears the larvae of a harmless
              fly on organic waste. In just a couple of weeks the larvae devour
              food and market waste and turn it into two valuable products:
              protein-rich animal feed and a natural fertiliser called frass.
            </Text>
            <Text style={styles.para}>
              It's one of the fastest, lowest-cost ways to close the organic
              loop — diverting waste from dumpsites while creating feed and
              fertiliser that local farmers actually pay for.
            </Text>
          </Section>

          <Section title="What goes in">
            <View style={styles.inputGrid}>
              {INPUTS.map((item) => {
                const Icon = item.icon;
                return (
                  <View key={item.label} style={styles.input}>
                    <View style={styles.inputIcon}>
                      <Icon color={BSF_GREEN} size={20} />
                    </View>
                    <Text style={styles.inputLabel}>{item.label}</Text>
                  </View>
                );
              })}
            </View>
          </Section>

          <View style={styles.outputCard}>
            <Text style={styles.outputFlag}>WHAT COMES OUT</Text>
            <Text style={styles.outputTitle}>Feed, fertiliser & income</Text>
            <View style={styles.useList}>
              {OUTPUTS.map((u) => (
                <View key={u} style={styles.useChip}>
                  <Text style={styles.useChipText}>{u}</Text>
                </View>
              ))}
            </View>
          </View>

          <Section title="How it works">
            <View style={styles.steps}>
              {STEPS.map((s) => (
                <View key={s.n} style={styles.step}>
                  <View style={styles.stepNum}>
                    <Text style={styles.stepNumText}>{s.n}</Text>
                  </View>
                  <View style={styles.stepBody}>
                    <Text style={styles.stepTitle}>{s.title}</Text>
                    <Text style={styles.stepText}>{s.body}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Section>

          <Section title="Why it matters">
            <View style={styles.quote}>
              <Text style={styles.quoteText}>
                A handful of waste today becomes a kilo of feed and a bag of
                fertiliser in two weeks — turning a disposal cost into a
                recurring income stream.
              </Text>
            </View>
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
    height: 220,
    backgroundColor: ECOFORGE.charcoal,
    justifyContent: "flex-end",
  },
  bannerImage: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(20,28,16,0.42)",
  },
  bannerBody: { padding: 22 },
  bannerKicker: {
    fontFamily: Fonts.monoBold,
    fontSize: 10,
    color: "#C7E59A",
    letterSpacing: 2,
  },
  bannerTitle: {
    fontFamily: Fonts.serifBold,
    fontSize: 30,
    color: Colors.white,
    marginTop: 6,
    lineHeight: 36,
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

  inputGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 4,
  },
  input: {
    flexBasis: "47%",
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: BSF_SOFT,
    borderRadius: 14,
    padding: 12,
  },
  inputIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  inputLabel: {
    flex: 1,
    fontFamily: Fonts.sansSemibold,
    fontSize: 13.5,
    color: ECOFORGE.charcoal,
    lineHeight: 18,
  },

  outputCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.line,
    borderLeftWidth: 4,
    borderLeftColor: BSF_GREEN,
    padding: 20,
    marginBottom: 28,
  },
  outputFlag: {
    fontFamily: Fonts.monoBold,
    fontSize: 10,
    color: BSF_GREEN,
    letterSpacing: 1.5,
  },
  outputTitle: {
    fontFamily: Fonts.serifBold,
    fontSize: 24,
    color: Colors.charcoal,
    marginTop: 4,
    marginBottom: 4,
  },
  useList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  useChip: {
    backgroundColor: BSF_SOFT,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  useChipText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    color: BSF_GREEN,
  },

  steps: { gap: 16 },
  step: { flexDirection: "row", gap: 14 },
  stepNum: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BSF_GREEN,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumText: {
    fontFamily: Fonts.monoBold,
    fontSize: 14,
    color: Colors.white,
  },
  stepBody: { flex: 1 },
  stepTitle: {
    fontFamily: Fonts.sansBold,
    fontSize: 16,
    color: Colors.charcoal,
    marginBottom: 3,
  },
  stepText: {
    fontFamily: Fonts.sans,
    fontSize: 14.5,
    color: Colors.slate,
    lineHeight: 22,
  },

  quote: {
    borderLeftWidth: 4,
    borderLeftColor: BSF_GREEN,
    paddingLeft: 16,
    paddingVertical: 4,
  },
  quoteText: {
    fontFamily: Fonts.serif,
    fontSize: 19,
    color: Colors.charcoal,
    lineHeight: 29,
  },
});
