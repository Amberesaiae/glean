import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { CalendarPlus, Clock, Mail, MapPin, Share2, UserRound } from "lucide-react-native";
import React from "react";
import { Alert, Linking, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, PressableScale, Text, haptic } from "@/components/ui";
import Colors from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { addToCalendar, scheduleReminder, shareText } from "@/lib/device";
import { useApp } from "@/providers/AppProvider";
import { daysUntil, formatEventDate } from "@/utils/format";

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { events } = useApp();
  const event = events.find((e) => e.id === id);

  if (!event) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>Event not found.</Text>
      </View>
    );
  }

  const days = daysUntil(event.date);
  const isEmail = event.contact.includes("@");

  const handleContact = () => {
    const url = isEmail ? `mailto:${event.contact}` : `tel:${event.contact}`;
    Linking.openURL(url).catch(() => {});
  };

  const handleCalendar = async () => {
    if (!event) return;
    const start = new Date(event.date);
    const result = await addToCalendar({
      title: event.title,
      startDate: start,
      location: `${event.location}, ${event.region}`,
      notes: `Organised by ${event.organizer}. ${event.description}`,
    });
    if (result.ok) {
      haptic("success");
      // A day-before nudge so it's not forgotten.
      const remindAt = new Date(start.getTime() - 24 * 60 * 60 * 1000);
      await scheduleReminder({
        title: "Tomorrow on Glean",
        body: `${event.title} — ${event.location}, ${event.region}.`,
        date: remindAt,
      });
    }
    Alert.alert(
      result.ok ? "Added to calendar" : "Couldn't add",
      result.ok ? "This event is now in your calendar." : result.message ?? "Try again.",
    );
  };

  const handleShare = () => {
    if (!event) return;
    shareText(
      `${event.title} — ${formatEventDate(event.date)} at ${event.location}, ${event.region}. On Glean.`,
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {event.photo ? (
          <Image source={{ uri: event.photo }} style={styles.hero} contentFit="cover" transition={250} />
        ) : null}
        <View style={styles.body}>
          {event.pending ? (
            <View style={styles.pendingBanner}>
              <Text style={styles.pendingText}>
                Pending review — visible to you only until approved.
              </Text>
            </View>
          ) : (
            <View style={styles.countRow}>
              <Text style={styles.countNum}>{days}</Text>
              <Text style={styles.countText}>
                {days === 1 ? "day to go" : "days to go"}
              </Text>
            </View>
          )}

          <Text style={styles.title}>{event.title}</Text>

          <View style={styles.metaRow}>
            <Clock color={Colors.sky} size={18} />
            <Text style={styles.metaText}>{formatEventDate(event.date)}</Text>
          </View>
          <View style={styles.metaRow}>
            <MapPin color={Colors.sky} size={18} />
            <Text style={styles.metaText}>
              {event.location}, {event.region}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <UserRound color={Colors.sky} size={18} />
            <Text style={styles.metaText}>{event.organizer}</Text>
          </View>

          <Text style={styles.sectionLabel}>About</Text>
          <Text style={styles.description}>{event.description}</Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.footerActions}>
          <PressableScale onPress={handleCalendar} style={styles.secondaryBtn} hapticStyle="light">
            <CalendarPlus color={Colors.skyDeep} size={18} />
            <Text style={styles.secondaryText}>Add to calendar</Text>
          </PressableScale>
          <PressableScale onPress={handleShare} style={styles.secondaryIconBtn} hapticStyle="light">
            <Share2 color={Colors.skyDeep} size={18} />
          </PressableScale>
        </View>
        <Button
          label={isEmail ? `Email ${event.organizer}` : "Call organizer"}
          onPress={handleContact}
          icon={<Mail color={Colors.white} size={18} />}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },
  missing: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.paper,
  },
  missingText: { fontFamily: Fonts.sans, color: Colors.slate },
  hero: { width: "100%", height: 240, backgroundColor: Colors.cardAlt },
  body: { padding: 20, gap: 6 },
  pendingBanner: {
    backgroundColor: Colors.amberSoft,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  pendingText: { fontFamily: Fonts.sansMedium, fontSize: 13, color: Colors.amberInk },
  countRow: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  countNum: { fontFamily: Fonts.monoBold, fontSize: 32, color: Colors.sky },
  countText: { fontFamily: Fonts.sansMedium, fontSize: 15, color: Colors.slate },
  title: {
    fontFamily: Fonts.serifBold,
    fontSize: 27,
    color: Colors.charcoal,
    lineHeight: 33,
    marginVertical: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 3,
  },
  metaText: { fontFamily: Fonts.sans, fontSize: 15, color: Colors.ink, flex: 1 },
  sectionLabel: {
    fontFamily: Fonts.sansBold,
    fontSize: 13,
    color: Colors.mist,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 18,
    marginBottom: 4,
  },
  description: {
    fontFamily: Fonts.sans,
    fontSize: 15.5,
    lineHeight: 24,
    color: Colors.ink,
  },
  content: { paddingBottom: 120 },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Colors.paper,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
  },
  footerActions: { flexDirection: "row", gap: 10, marginBottom: 10 },
  secondaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    height: 46,
    borderRadius: 12,
    backgroundColor: Colors.skySoft,
  },
  secondaryText: { fontFamily: Fonts.sansSemibold, fontSize: 14, color: Colors.skyDeep },
  secondaryIconBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: Colors.skySoft,
    alignItems: "center",
    justifyContent: "center",
  },
});
