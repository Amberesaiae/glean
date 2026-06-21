import { Image } from "expo-image";
import { router } from "expo-router";
import { CalendarPlus, MapPin } from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card, Chip, EmptyState, EventCardSkeleton, PressableScale, Text } from "@/components/ui";
import { MessagesButton } from "@/components/messages-button";
import Colors, { REGIONS } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { radius, spacing } from "@/constants/theme";
import { useApp } from "@/providers/AppProvider";
import type { ClimateEvent } from "@/types";
import { daysUntil, formatEventTime } from "@/utils/format";

const TYPE_COLORS: Record<ClimateEvent["type"], string> = {
  event: Colors.success,
  forum: Colors.sky,
  "job fair": Colors.amber,
};

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const { events, loading, refreshing, refresh } = useApp();
  const [region, setRegion] = useState<string>("all");

  const filtered = useMemo<ClimateEvent[]>(
    () =>
      events
        .filter((e) => (region === "all" ? true : e.region === region))
        .sort((a, b) => a.date - b.date),
    [events, region],
  );

  const renderItem = useCallback(
    ({ item }: { item: ClimateEvent }) => <EventCard event={item} />,
    [],
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Discover</Text>
            <Text style={styles.headerSub}>
              Events, forums & green jobs near you
            </Text>
          </View>
          <View style={styles.headerActions}>
            <MessagesButton />
            <PressableScale
              hapticStyle="medium"
              onPress={() => router.push("/submit-event")}
              style={styles.addBtn}
            >
              <CalendarPlus color={Colors.white} size={20} />
            </PressableScale>
          </View>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          <Chip
            label="All regions"
            active={region === "all"}
            onPress={() => setRegion("all")}
          />
          {REGIONS.map((r) => (
            <Chip
              key={r}
              label={r}
              active={region === r}
              onPress={() => setRegion(r)}
            />
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={loading ? [] : filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={Colors.sky}
          />
        }
        renderItem={renderItem}
        ListEmptyComponent={
          loading ? (
            <View style={styles.skeletonList}>
              {[0, 1, 2, 3].map((i) => (
                <EventCardSkeleton key={i} />
              ))}
            </View>
          ) : (
            <EmptyState
              illustration="sustainability"
              title="No events here yet"
              message="Nothing scheduled in this region yet. Try another region, or submit one."
            />
          )
        }
      />
    </View>
  );
}

const EventCard = React.memo(function EventCard({ event }: { event: ClimateEvent }) {
  const days = daysUntil(event.date);
  const typeColor = TYPE_COLORS[event.type];
  const d = new Date(event.date);
  const dayNum = d.toLocaleDateString("en-GB", { day: "2-digit" });
  const monthShort = d
    .toLocaleDateString("en-GB", { month: "short" })
    .toUpperCase();
  return (
    <Card onPress={() => router.push(`/event/${event.id}`)} padded={false} style={styles.card}>
      {event.photo ? (
        <Image
          source={{ uri: event.photo }}
          style={styles.cardImage}
          contentFit="cover"
          transition={200}
        />
      ) : null}
      <View style={styles.cardBody}>
        <View style={styles.dateBlock}>
          <Text style={[styles.dateDay, { color: typeColor }]}>{dayNum}</Text>
          <Text style={styles.dateMonth}>{monthShort}</Text>
        </View>
        <View style={styles.cardInfo}>
          <View style={styles.typeRow}>
            <View style={[styles.typeDot, { backgroundColor: typeColor }]} />
            <Text style={[styles.typeLabel, { color: typeColor }]}>
              {event.type.toUpperCase()}
            </Text>
            <View style={styles.typeSpacer} />
            {event.pending ? (
              <Text style={styles.pendingText}>PENDING</Text>
            ) : (
              <Text style={styles.countdownText}>
                {days === 0 ? "Today" : `in ${days}${days === 1 ? " day" : " days"}`}
              </Text>
            )}
          </View>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {event.title}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.timeText}>{formatEventTime(event.date)}</Text>
            <View style={styles.metaDivider} />
            <MapPin color={Colors.mist} size={13} />
            <Text style={styles.metaText} numberOfLines={1}>
              {event.location}, {event.region}
            </Text>
          </View>
          <Text style={styles.organizer} numberOfLines={1}>
            by {event.organizer}
          </Text>
        </View>
      </View>
    </Card>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },
  skeletonList: { gap: spacing.md },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerTitle: {
    fontFamily: Fonts.serifBold,
    fontSize: 23,
    color: Colors.charcoal,
  },
  headerSub: { fontFamily: Fonts.sansMedium, fontSize: 13, color: Colors.slate },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.sky,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.sky,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  chipRow: { gap: spacing.sm, paddingRight: spacing.lg },
  list: { padding: spacing.lg, gap: spacing.md, paddingBottom: 40 },
  card: { borderRadius: radius.card, overflow: "hidden" },
  cardImage: { width: "100%", height: 128, backgroundColor: Colors.cardAlt },
  cardBody: { flexDirection: "row", padding: 14, gap: 14 },
  dateBlock: {
    width: 52,
    alignItems: "center",
    paddingTop: 2,
  },
  dateDay: {
    fontFamily: Fonts.monoBold,
    fontSize: 26,
    lineHeight: 28,
  },
  dateMonth: {
    fontFamily: Fonts.monoBold,
    fontSize: 11,
    color: Colors.mist,
    letterSpacing: 1,
    marginTop: 2,
  },
  cardInfo: { flex: 1, gap: 4 },
  typeRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  typeDot: { width: 6, height: 6, borderRadius: 3 },
  typeLabel: {
    fontFamily: Fonts.monoBold,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  typeSpacer: { flex: 1 },
  countdownText: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 12,
    color: Colors.slate,
  },
  pendingText: {
    fontFamily: Fonts.monoBold,
    fontSize: 10,
    color: Colors.amberInk,
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontFamily: Fonts.serif,
    fontSize: 18,
    color: Colors.charcoal,
    lineHeight: 23,
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  timeText: { fontFamily: Fonts.mono, fontSize: 12.5, color: Colors.slate },
  metaDivider: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.mist,
  },
  metaText: { fontFamily: Fonts.sans, fontSize: 12.5, color: Colors.slate, flex: 1 },
  organizer: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12.5,
    color: Colors.sky,
    marginTop: 2,
  },
});
