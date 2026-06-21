import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { Clock } from "lucide-react-native";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { DetailSkeleton, ImageGallery, MaterialTag, Text } from "@/components/ui";
import { EcoImage } from "@/components/illustrations";
import Colors, { MATERIALS } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { useApp } from "@/providers/AppProvider";
import type { Guide } from "@/types";

export default function GuideDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { guides, guidesLoading } = useApp();
  const guide = guides.find((g) => g.id === id);

  if (!guide && guidesLoading) {
    return <DetailSkeleton />;
  }

  if (!guide) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>Guide not found.</Text>
      </View>
    );
  }

  return <GuideBody guide={guide} />;
}

function GuideBody({ guide }: { guide: Guide }) {
  const paragraphs = guide.body.split("\n\n");
  const gallery: string[] = guide.images ?? [];
  const player = useVideoPlayer(guide.videoUrl ?? null, (p) => {
    p.loop = true;
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {gallery.length > 0 ? (
        <View style={styles.galleryWrap}>
          <ImageGallery images={gallery} height={210} radius={18} inset={44} />
        </View>
      ) : guide.heroImage ? (
        <Image
          source={{ uri: guide.heroImage }}
          style={styles.hero}
          contentFit="cover"
          transition={250}
        />
      ) : (
        <View
          style={[
            styles.iconBox,
            { backgroundColor: MATERIALS[guide.material].soft },
          ]}
        >
          <EcoImage name={guide.illustration} size={46} />
        </View>
      )}
      <Text style={styles.title}>{guide.title}</Text>
      <View style={styles.meta}>
        <MaterialTag material={guide.material} small />
        <View style={styles.readRow}>
          <Clock color={Colors.mist} size={13} />
          <Text style={styles.readTime}>{guide.readMinutes} min read</Text>
        </View>
      </View>

      {guide.sponsor ? (
        <View style={styles.sponsorCard}>
          <Text style={styles.sponsorLabel}>Supported by</Text>
          <Text style={styles.sponsorName}>{guide.sponsor}</Text>
        </View>
      ) : null}

      <Text style={styles.lead}>{guide.summary}</Text>

      {guide.videoUrl ? (
        <View style={styles.videoWrap}>
          <VideoView
            player={player}
            style={styles.video}
            contentFit="cover"
            nativeControls
            allowsFullscreen
          />
        </View>
      ) : null}

      <View style={styles.divider} />

      {paragraphs.map((p, i) => {
        const isStep = /^\d+\./.test(p.trim());
        return (
          <Text key={i} style={[styles.para, isStep && styles.step]}>
            {p}
          </Text>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },
  content: { padding: 22, paddingBottom: 60 },
  missing: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.paper,
  },
  missingText: { fontFamily: Fonts.sans, color: Colors.slate },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  hero: {
    width: "100%",
    height: 200,
    borderRadius: 18,
    marginBottom: 18,
    backgroundColor: Colors.cardAlt,
  },
  galleryWrap: {
    marginBottom: 18,
  },
  videoWrap: {
    marginTop: 18,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: Colors.charcoal,
  },
  video: { width: "100%", height: 210 },
  title: {
    fontFamily: Fonts.serifBold,
    fontSize: 28,
    color: Colors.charcoal,
    lineHeight: 35,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 14,
  },
  readRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  readTime: { fontFamily: Fonts.mono, fontSize: 12, color: Colors.mist },
  sponsorCard: {
    backgroundColor: Colors.skySoft,
    borderRadius: 12,
    padding: 14,
    marginTop: 18,
  },
  sponsorLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    color: Colors.slate,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sponsorName: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 16,
    color: Colors.skyDeep,
    marginTop: 2,
  },
  lead: {
    fontFamily: Fonts.serif,
    fontSize: 18,
    color: Colors.ink,
    lineHeight: 27,
    marginTop: 18,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.line,
    marginVertical: 20,
  },
  para: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    color: Colors.ink,
    lineHeight: 26,
    marginBottom: 16,
  },
  step: {
    fontFamily: Fonts.sansMedium,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: Colors.sky,
  },
});
