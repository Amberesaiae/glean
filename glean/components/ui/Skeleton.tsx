import React, { useEffect } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import Colors from "@/constants/colors";

/** A single shimmering placeholder block used to build loading skeletons. */
export function Skeleton({
  width,
  height = 14,
  radius = 8,
  style,
}: {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}) {
  const progress = useSharedValue<number>(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.45 + progress.value * 0.45,
  }));

  return (
    <Animated.View
      style={[
        styles.block,
        { width: width ?? "100%", height, borderRadius: radius },
        animatedStyle,
        style,
      ]}
    />
  );
}

/** Loading placeholder mirroring a market ListingCard's layout. */
export function ListingCardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton width={96} height={96} radius={12} />
      <View style={styles.body}>
        <View style={styles.row}>
          <Skeleton width={52} height={18} radius={6} />
          <Skeleton width={30} height={12} radius={6} />
        </View>
        <Skeleton width="85%" height={15} />
        <Skeleton width="55%" height={15} />
        <View style={styles.footer}>
          <Skeleton width={70} height={20} radius={999} />
          <Skeleton width={60} height={12} />
        </View>
      </View>
    </View>
  );
}

/** Loading placeholder mirroring an X-style feed post row. */
export function FeedPostSkeleton() {
  return (
    <View style={styles.post}>
      <Skeleton width={44} height={44} radius={22} />
      <View style={styles.postBody}>
        <View style={styles.postRow}>
          <Skeleton width={120} height={14} />
          <Skeleton width={44} height={11} />
        </View>
        <Skeleton width="95%" height={13} />
        <Skeleton width="70%" height={13} />
        <Skeleton width="100%" height={170} radius={16} style={styles.postMedia} />
      </View>
    </View>
  );
}

/** Loading placeholder mirroring a supply pool card. */
export function SupplyPoolSkeleton() {
  return (
    <View style={styles.pool}>
      <Skeleton width={90} height={14} />
      <Skeleton width={70} height={24} radius={6} />
      <Skeleton width={50} height={12} />
      <Skeleton width={84} height={12} />
    </View>
  );
}

/** Loading placeholder mirroring a Learn story card. */
export function StoryCardSkeleton() {
  return (
    <View style={styles.storyCard}>
      <Skeleton width="100%" height={180} radius={0} />
      <View style={styles.storyBody}>
        <Skeleton width="80%" height={18} />
        <Skeleton width="95%" height={13} />
        <Skeleton width="60%" height={13} />
        <View style={styles.storyMeta}>
          <Skeleton width={70} height={20} radius={999} />
          <Skeleton width={64} height={12} />
        </View>
      </View>
    </View>
  );
}

/** Loading placeholder for the Learn spotlight carousel card. */
export function SpotlightSkeleton() {
  return (
    <View style={styles.spotlight}>
      <Skeleton width="100%" height={132} radius={0} />
      <View style={styles.spotlightBody}>
        <Skeleton width="70%" height={22} />
        <Skeleton width="95%" height={14} />
        <Skeleton width="85%" height={14} />
        <Skeleton width={110} height={14} style={styles.spotlightCta} />
      </View>
    </View>
  );
}

/** Loading placeholder for the "Know the lingo" term strip. */
export function GlossarySkeleton() {
  return (
    <View style={styles.glossary}>
      <Skeleton width={150} height={18} />
      <Skeleton width={210} height={13} style={styles.glossarySub} />
      <View style={styles.termRow}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.termCard}>
            <Skeleton width={168} height={104} radius={0} />
            <View style={styles.termCardBody}>
              <Skeleton width="70%" height={15} />
              <Skeleton width="90%" height={12} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

/** Loading placeholder mirroring a conversation row in the inbox. */
export function ConversationRowSkeleton() {
  return (
    <View style={styles.convRow}>
      <Skeleton width={52} height={52} radius={26} />
      <View style={styles.convBody}>
        <View style={styles.convTop}>
          <Skeleton width={130} height={15} />
          <Skeleton width={40} height={11} />
        </View>
        <Skeleton width="75%" height={13} />
      </View>
    </View>
  );
}

/** Loading placeholder mirroring a drive card. */
export function DriveCardSkeleton() {
  return (
    <View style={styles.driveCard}>
      <View style={styles.driveTop}>
        <Skeleton width={40} height={40} radius={12} />
        <View style={styles.driveTopBody}>
          <Skeleton width="80%" height={16} />
          <Skeleton width="50%" height={12} />
        </View>
        <Skeleton width={56} height={20} radius={999} />
      </View>
      <Skeleton width="100%" height={10} radius={5} style={styles.driveBar} />
      <View style={styles.driveMetaRow}>
        <Skeleton width={120} height={12} />
        <Skeleton width={64} height={12} />
      </View>
      <Skeleton width="100%" height={46} radius={12} style={styles.driveBtn} />
    </View>
  );
}

/** Loading placeholder mirroring a Discover event card. */
export function EventCardSkeleton() {
  return (
    <View style={styles.eventCard}>
      <Skeleton width="100%" height={128} radius={0} />
      <View style={styles.eventBody}>
        <View style={styles.eventDate}>
          <Skeleton width={34} height={26} radius={6} />
          <Skeleton width={30} height={11} style={styles.eventDateSub} />
        </View>
        <View style={styles.eventInfo}>
          <Skeleton width={90} height={11} />
          <Skeleton width="85%" height={18} style={styles.eventGap} />
          <Skeleton width="70%" height={13} style={styles.eventGap} />
          <Skeleton width={120} height={12} style={styles.eventGap} />
        </View>
      </View>
    </View>
  );
}

/** Loading placeholder for a detail page (hero image, title, body text). */
export function DetailSkeleton() {
  return (
    <View style={styles.detail}>
      <Skeleton width="100%" height={220} radius={18} />
      <Skeleton width="85%" height={26} style={styles.detailGap} />
      <View style={styles.detailMeta}>
        <Skeleton width={70} height={20} radius={999} />
        <Skeleton width={80} height={13} />
      </View>
      <Skeleton width="100%" height={16} style={styles.detailGap} />
      <Skeleton width="95%" height={16} />
      <Skeleton width="90%" height={16} />
      <Skeleton width="60%" height={16} />
    </View>
  );
}

/** Loading placeholder mirroring a profile screen (header, stats, content). */
export function ProfileSkeleton() {
  return (
    <View style={styles.profile}>
      <Skeleton width="100%" height={138} radius={0} />
      <View style={styles.profileAvatar}>
        <Skeleton width={92} height={92} radius={46} />
      </View>
      <View style={styles.profileBody}>
        <Skeleton width={180} height={24} />
        <Skeleton width={120} height={13} style={styles.profileGap} />
        <Skeleton width="90%" height={15} style={styles.profileGap} />
        <Skeleton width="100%" height={88} radius={18} style={styles.profileStats} />
        <Skeleton width="100%" height={200} radius={20} style={styles.profileStats} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { backgroundColor: Colors.cardAlt },
  card: {
    flexDirection: "row",
    gap: 14,
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.line,
    padding: 14,
  },
  body: { flex: 1, justifyContent: "space-between", gap: 8 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  post: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  postBody: { flex: 1, gap: 9 },
  postRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  postMedia: { marginTop: 4 },
  pool: {
    width: 160,
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.line,
    padding: 14,
    gap: 8,
  },
  storyCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.line,
    overflow: "hidden",
  },
  storyBody: { padding: 16, gap: 8 },
  storyMeta: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
  spotlight: {
    backgroundColor: Colors.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.line,
    overflow: "hidden",
  },
  spotlightBody: { padding: 20, gap: 9 },
  spotlightCta: { marginTop: 8 },
  glossary: { gap: 6 },
  glossarySub: { marginTop: 2 },
  termRow: { flexDirection: "row", gap: 12, marginTop: 12 },
  termCard: {
    width: 168,
    backgroundColor: Colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.line,
    overflow: "hidden",
  },
  termCardBody: { padding: 12, gap: 6 },
  convRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  convBody: { flex: 1, gap: 8 },
  convTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  driveCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.line,
    padding: 16,
  },
  driveTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  driveTopBody: { flex: 1, gap: 8 },
  driveBar: { marginTop: 16 },
  driveMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  driveBtn: { marginTop: 16 },
  profile: { flex: 1, backgroundColor: Colors.paper },
  profileAvatar: {
    position: "absolute",
    top: 92,
    left: 20,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: Colors.paper,
  },
  profileBody: { paddingHorizontal: 20, paddingTop: 56 },
  profileGap: { marginTop: 10 },
  profileStats: { marginTop: 20 },
  eventCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.line,
    overflow: "hidden",
  },
  eventBody: { flexDirection: "row", padding: 14, gap: 14 },
  eventDate: { width: 52, alignItems: "center", paddingTop: 2 },
  eventDateSub: { marginTop: 4 },
  eventInfo: { flex: 1 },
  eventGap: { marginTop: 8 },
  detail: { flex: 1, backgroundColor: Colors.paper, padding: 22, gap: 10 },
  detailGap: { marginTop: 8 },
  detailMeta: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 2 },
});
