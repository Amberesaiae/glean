import { Image } from "expo-image";
import { router } from "expo-router";
import { ArrowRight, Clock } from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import {
  Dimensions,
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Chip,
  GlossarySkeleton,
  MaterialTag,
  PressableScale,
  Sheet,
  SpotlightSkeleton,
  StoryCardSkeleton,
  Text,
} from "@/components/ui";
import {
  EcoImage,
  ECOFORGE,
  ECOFORGE_LOGO,
  MATERIAL_ECO,
} from "@/components/illustrations";
import Colors, { MATERIALS, MaterialKey } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { GLOSSARY, type GlossaryTerm } from "@/constants/glossary";
import { PHOTOS } from "@/constants/photos";
import { useApp } from "@/providers/AppProvider";
import type { Guide } from "@/types";

const { width: SCREEN_W } = Dimensions.get("window");
const SPOTLIGHT_W = SCREEN_W - 52;
const SPOTLIGHT_GAP = 12;
const TERM_W = 168;
const TERM_GAP = 12;
const TERM_SNAP = TERM_W + TERM_GAP;

export default function LearnScreen() {
  const insets = useSafeAreaInsets();
  const { guides, loading, guidesLoading } = useApp();
  const showSkeleton = loading || guidesLoading;
  const [material, setMaterial] = useState<MaterialKey | "all">("all");
  const [activeTerm, setActiveTerm] = useState<GlossaryTerm | null>(null);

  const filtered = useMemo<Guide[]>(
    () =>
      material === "all"
        ? guides
        : guides.filter((g) => g.material === material),
    [guides, material],
  );

  const terms = useMemo<GlossaryTerm[]>(
    () =>
      material === "all"
        ? [...GLOSSARY]
        : GLOSSARY.filter((t) => t.material === material),
    [material],
  );

  const renderItem = useCallback(
    ({ item }: { item: Guide }) => <StoryCard guide={item} />,
    [],
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <Text style={styles.headerTitle}>Learn</Text>
        <Text style={styles.headerSub}>
          Stories from the green economy, plain language
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          <Chip
            label="All"
            active={material === "all"}
            onPress={() => setMaterial("all")}
          />
          {(Object.keys(MATERIALS) as MaterialKey[]).map((m) => (
            <Chip
              key={m}
              label={MATERIALS[m].label}
              active={material === m}
              onPress={() => setMaterial(m)}
              color={MATERIALS[m].color}
              softColor={MATERIALS[m].soft}
              icon={<EcoImage name={MATERIAL_ECO[m]} size={16} />}
            />
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={showSkeleton ? [] : filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          showSkeleton ? (
            <View style={styles.skeletonHeader}>
              {material === "all" ? <SpotlightSkeleton /> : null}
              <GlossarySkeleton />
            </View>
          ) : (
            <View>
              {material === "all" ? <SpotlightCarousel /> : null}
              {terms.length > 0 ? (
                <Glossary terms={terms} onSelect={setActiveTerm} />
              ) : null}
            </View>
          )
        }
        renderItem={renderItem}
        ListEmptyComponent={
          showSkeleton ? (
            <View style={styles.skeletonList}>
              {[0, 1, 2].map((i) => (
                <StoryCardSkeleton key={i} />
              ))}
            </View>
          ) : null
        }
      />

      <TermSheet term={activeTerm} onClose={() => setActiveTerm(null)} />
    </View>
  );
}

/** Horizontal strip of material-term cards that open a definition sheet. */
function Glossary({
  terms,
  onSelect,
}: {
  terms: GlossaryTerm[];
  onSelect: (term: GlossaryTerm) => void;
}) {
  const [active, setActive] = useState<number>(0);

  const onScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const idx = Math.round(e.nativeEvent.contentOffset.x / TERM_SNAP);
      setActive(Math.max(0, Math.min(terms.length - 1, idx)));
    },
    [terms.length],
  );

  const renderTerm = useCallback(
    ({ item: t }: { item: GlossaryTerm }) => (
      <PressableScale onPress={() => onSelect(t)} style={styles.termCard}>
        <Image
          source={{ uri: t.image }}
          style={styles.termImage}
          contentFit="cover"
          transition={200}
        />
        {t.tag ? (
          <View
            style={[
              styles.termTag,
              { backgroundColor: MATERIALS[t.material].soft },
            ]}
          >
            <Text
              style={[
                styles.termTagText,
                { color: MATERIALS[t.material].color },
              ]}
            >
              {t.tag}
            </Text>
          </View>
        ) : null}
        <View style={styles.termBody}>
          <Text style={styles.termName}>{t.term}</Text>
          <Text style={styles.termShort} numberOfLines={2}>
            {t.short}
          </Text>
        </View>
      </PressableScale>
    ),
    [onSelect],
  );

  return (
    <View style={styles.glossary}>
      <View style={styles.glossaryHead}>
        <Text style={styles.glossaryTitle}>Know the lingo</Text>
        <Text style={styles.glossarySub}>
          Swipe through, tap a term to learn what it means
        </Text>
      </View>
      <FlatList
        data={terms}
        keyExtractor={(t) => t.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={TERM_SNAP}
        decelerationRate="fast"
        onMomentumScrollEnd={onScrollEnd}
        contentContainerStyle={styles.termRow}
        renderItem={renderTerm}
      />
      {terms.length > 1 ? (
        <View style={styles.termDots}>
          {terms.map((t, i) => (
            <View
              key={t.id}
              style={[styles.termDot, i === active && styles.termDotActive]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** Bottom sheet showing a term's photo and full definition. */
function TermSheet({
  term,
  onClose,
}: {
  term: GlossaryTerm | null;
  onClose: () => void;
}) {
  return (
    <Sheet visible={!!term} onClose={onClose} title={term?.term ?? ""}>
      {term ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          <Image
            source={{ uri: term.image }}
            style={styles.sheetImage}
            contentFit="cover"
            transition={200}
          />
          <View style={styles.sheetMeta}>
            <MaterialTag material={term.material} small />
            {term.tag ? (
              <Text style={styles.sheetTag}>{term.tag}</Text>
            ) : null}
          </View>
          <Text style={styles.sheetBody}>{term.body}</Text>
        </ScrollView>
      ) : null}
    </Sheet>
  );
}

interface Spotlight {
  id: string;
  title: string;
  summary: string;
  cta: string;
  route: string;
  accent: string;
  /** Show the bundled EcoForge logo tile instead of a photo banner. */
  logo?: boolean;
  /** Photo banner shown across the top of the card. */
  image?: string;
}

const SPOTLIGHTS: readonly Spotlight[] = [
  {
    id: "ecoforge",
    title: "What is EcoForge?",
    summary:
      "A community engineering initiative building affordable machines that turn local waste into economic opportunity — starting with EcoFiber.",
    cta: "Read the story",
    route: "/ecoforge",
    accent: ECOFORGE.green,
    logo: true,
  },
  {
    id: "bsf",
    title: "Black soldier fly production",
    summary:
      "Turning food and market waste into protein-rich animal feed and nutrient-dense frass fertiliser — one of the fastest ways to close the organic loop.",
    cta: "See how it works",
    route: "/bsf",
    accent: "#7FB539",
    image: PHOTOS.bsfLarvae,
  },
] as const;

/** A swipeable row of spotlight stories pinned to the top of Learn. */
function SpotlightCarousel() {
  const [active, setActive] = useState<number>(0);

  const onScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const idx = Math.round(
        e.nativeEvent.contentOffset.x / (SPOTLIGHT_W + SPOTLIGHT_GAP),
      );
      setActive(idx);
    },
    [],
  );

  return (
    <View style={styles.spotlightWrap}>
      <FlatList
        data={SPOTLIGHTS}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SPOTLIGHT_W + SPOTLIGHT_GAP}
        decelerationRate="fast"
        onMomentumScrollEnd={onScrollEnd}
        contentContainerStyle={styles.spotlightRow}
        renderItem={({ item }) => <SpotlightCard item={item} />}
      />
      {SPOTLIGHTS.length > 1 ? (
        <View style={styles.dots}>
          {SPOTLIGHTS.map((s, i) => (
            <View
              key={s.id}
              style={[styles.dot, i === active && styles.dotActive]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** A single spotlight card — branded logo variant or photo-banner variant. */
function SpotlightCard({ item }: { item: Spotlight }) {
  return (
    <PressableScale
      onPress={() => router.push(item.route as never)}
      style={[styles.spotlight, { width: SPOTLIGHT_W }]}
    >
      {item.image ? (
        <View style={styles.spotlightBanner}>
          <Image
            source={{ uri: item.image }}
            style={styles.spotlightImage}
            contentFit="cover"
            transition={200}
          />
          <View
            style={[styles.spotlightFlag, { backgroundColor: "rgba(0,0,0,0.55)" }]}
          >
            <Text style={[styles.spotlightFlagText, { color: item.accent }]}>
              SPOTLIGHT
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.spotlightTop}>
          <View style={styles.logoTile}>
            <Image
              source={ECOFORGE_LOGO}
              style={styles.logo}
              contentFit="contain"
            />
          </View>
          <View
            style={[
              styles.spotlightFlag,
              { backgroundColor: "rgba(79,168,46,0.18)" },
            ]}
          >
            <Text style={[styles.spotlightFlagText, { color: item.accent }]}>
              SPOTLIGHT
            </Text>
          </View>
        </View>
      )}
      <View style={styles.spotlightBody}>
        <Text style={styles.spotlightTitle}>{item.title}</Text>
        <Text style={styles.spotlightSummary}>{item.summary}</Text>
        <View style={styles.spotlightCta}>
          <Text style={[styles.spotlightCtaText, { color: item.accent }]}>
            {item.cta}
          </Text>
          <ArrowRight color={item.accent} size={16} />
        </View>
      </View>
    </PressableScale>
  );
}

/** A large, tappable story card for the Learn feed. */
const StoryCard = React.memo(function StoryCard({ guide }: { guide: Guide }) {
  const cover = guide.heroImage ?? guide.images?.[0];
  const extra = (guide.images?.length ?? 0) > 1 ? guide.images!.length : 0;

  return (
    <PressableScale
      onPress={() => router.push(`/guide/${guide.id}`)}
      style={styles.card}
    >
      {cover ? (
        <View>
          <Image
            source={{ uri: cover }}
            style={styles.cover}
            contentFit="cover"
            transition={200}
          />
          {extra > 0 ? (
            <View style={styles.countPill}>
              <Text style={styles.countPillText}>{`1 / ${extra}`}</Text>
            </View>
          ) : null}
        </View>
      ) : (
        <View
          style={[
            styles.coverFallback,
            { backgroundColor: MATERIALS[guide.material].soft },
          ]}
        >
          <EcoImage name={guide.illustration} size={64} />
        </View>
      )}
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{guide.title}</Text>
        <Text style={styles.cardSummary} numberOfLines={2}>
          {guide.summary}
        </Text>
        <View style={styles.cardMeta}>
          <MaterialTag material={guide.material} small />
          <View style={styles.readRow}>
            <Clock color={Colors.mist} size={12} />
            <Text style={styles.readTime}>{guide.readMinutes} min read</Text>
          </View>
          {guide.sponsor ? (
            <Text style={styles.sponsor}>· {guide.sponsor}</Text>
          ) : null}
        </View>
      </View>
    </PressableScale>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  headerTitle: {
    fontFamily: Fonts.serifBold,
    fontSize: 23,
    color: Colors.charcoal,
  },
  headerSub: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    color: Colors.slate,
    marginTop: 1,
    marginBottom: 12,
  },
  chipRow: { gap: 8, paddingRight: 16 },
  list: { padding: 16, gap: 18, paddingBottom: 44 },
  skeletonHeader: { gap: 18 },
  skeletonList: { gap: 18 },

  glossary: { marginBottom: 4 },
  glossaryHead: { marginBottom: 12 },
  glossaryTitle: {
    fontFamily: Fonts.serifBold,
    fontSize: 20,
    color: Colors.charcoal,
  },
  glossarySub: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    color: Colors.slate,
    marginTop: 1,
  },
  termRow: { gap: TERM_GAP, paddingRight: 4 },
  termDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
  },
  termDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.line,
  },
  termDotActive: {
    width: 18,
    backgroundColor: ECOFORGE.green,
  },
  termCard: {
    width: 168,
    backgroundColor: Colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.line,
    overflow: "hidden",
  },
  termImage: {
    width: "100%",
    height: 104,
    backgroundColor: Colors.cardAlt,
  },
  termTag: {
    position: "absolute",
    top: 8,
    left: 8,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  termTagText: {
    fontFamily: Fonts.monoBold,
    fontSize: 10,
    letterSpacing: 0.3,
  },
  termBody: { padding: 12 },
  termName: {
    fontFamily: Fonts.sansBold,
    fontSize: 15,
    color: Colors.charcoal,
  },
  termShort: {
    fontFamily: Fonts.sans,
    fontSize: 12.5,
    color: Colors.slate,
    lineHeight: 17,
    marginTop: 3,
  },

  sheetImage: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    backgroundColor: Colors.cardAlt,
    marginBottom: 14,
  },
  sheetMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  sheetTag: {
    fontFamily: Fonts.monoBold,
    fontSize: 12,
    color: Colors.slate,
  },
  sheetBody: {
    fontFamily: Fonts.sans,
    fontSize: 15.5,
    color: Colors.ink,
    lineHeight: 25,
    paddingBottom: 8,
  },

  spotlightWrap: { marginBottom: 4 },
  spotlightRow: { gap: SPOTLIGHT_GAP, paddingRight: 4 },
  spotlight: {
    backgroundColor: ECOFORGE.charcoal,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(79,168,46,0.35)",
    overflow: "hidden",
  },
  spotlightTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  spotlightBanner: {
    height: 132,
    backgroundColor: Colors.cardAlt,
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  spotlightImage: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  logoTile: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: { width: 44, height: 44 },
  spotlightFlag: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    margin: 12,
  },
  spotlightFlagText: {
    fontFamily: Fonts.monoBold,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  spotlightBody: { padding: 20 },
  spotlightTitle: {
    fontFamily: Fonts.serifBold,
    fontSize: 23,
    color: Colors.white,
    lineHeight: 29,
  },
  spotlightSummary: {
    fontFamily: Fonts.sans,
    fontSize: 14.5,
    color: "#C9D1D9",
    lineHeight: 22,
    marginTop: 8,
  },
  spotlightCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 18,
  },
  spotlightCtaText: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 14,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.line,
  },
  dotActive: {
    width: 18,
    backgroundColor: ECOFORGE.green,
  },

  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.line,
    overflow: "hidden",
  },
  cover: {
    width: "100%",
    height: 180,
    backgroundColor: Colors.cardAlt,
  },
  coverFallback: {
    width: "100%",
    height: 150,
    alignItems: "center",
    justifyContent: "center",
  },
  countPill: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(27,31,35,0.7)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countPillText: {
    fontFamily: Fonts.monoBold,
    fontSize: 11,
    color: Colors.white,
  },
  cardBody: { padding: 16 },
  cardTitle: {
    fontFamily: Fonts.serifBold,
    fontSize: 18,
    color: Colors.charcoal,
    lineHeight: 24,
  },
  cardSummary: {
    fontFamily: Fonts.sans,
    fontSize: 13.5,
    color: Colors.slate,
    lineHeight: 19,
    marginTop: 6,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
    flexWrap: "wrap",
  },
  readRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  readTime: { fontFamily: Fonts.mono, fontSize: 12, color: Colors.mist },
  sponsor: { fontFamily: Fonts.sansMedium, fontSize: 12, color: Colors.sky },
});
