import { router } from "expo-router";
import { CalendarDays, CalendarPlus, Check, MapPin, Megaphone, MessageCircle, Plus, Share2 } from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import { Alert, FlatList, StyleSheet, View } from "react-native";

import { FormFooter } from "@/components/form-footer";
import { Button, DriveCardSkeleton, EmptyState, Input, MaterialTag, PressableScale, Sheet, Text, haptic } from "@/components/ui";
import Colors, { MATERIALS } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { addToCalendar, scheduleReminder, shareText } from "@/lib/device";
import { useApp } from "@/providers/AppProvider";
import { useAuth } from "@/providers/AuthProvider";
import type { Drive } from "@/types";
import { formatEventDate } from "@/utils/format";

export default function DrivesScreen() {
  const { drives, drivesLoading } = useApp();
  const [committing, setCommitting] = useState<Drive | null>(null);

  const open = useMemo(
    () => drives.filter((d) => d.status === "open").sort((a, b) => a.date - b.date),
    [drives],
  );

  const handleCommit = useCallback((item: Drive) => {
    setCommitting(item);
  }, []);

  const renderItem = useCallback(({ item }: { item: Drive }) => (
    <DriveCard drive={item} onCommit={handleCommit} />
  ), [handleCommit]);

  return (
    <View style={styles.container}>
      <FlatList
        data={drivesLoading ? [] : open}
        keyExtractor={(d) => d.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={renderItem}
        ListEmptyComponent={
          drivesLoading ? (
            <View style={styles.skeletonList}>
              {[0, 1, 2].map((i) => (
                <DriveCardSkeleton key={i} />
              ))}
            </View>
          ) : (
            <EmptyState
              illustration="community"
              title="No active drives yet"
              message="Start one to rally nearby suppliers toward a bulk pickup."
            />
          )
        }
      />

      <FormFooter style={styles.footer}>
        <Button
          label="Start a drive"
          onPress={() => router.push("/start-drive")}
          fullWidth
          icon={<Plus color={Colors.white} size={18} />}
        />
      </FormFooter>

      <CommitSheet drive={committing} onClose={() => setCommitting(null)} />
    </View>
  );
}

const DriveCard = React.memo(function DriveCard({ drive, onCommit }: { drive: Drive; onCommit: (drive: Drive) => void }) {
  const { userId } = useAuth();
  const { getProfile, ensureConversation } = useApp();
  const organizer = getProfile(drive.organizerId);
  const committed = drive.commitments.reduce((s, c) => s + c.amountKg, 0);
  const progress = drive.targetKg > 0 ? Math.min(1, committed / drive.targetKg) : 0;
  const mine = drive.commitments.find((c) => c.userId === userId);
  const isOrganizer = drive.organizerId === userId;

  const messageOrganizer = async () => {
    if (!organizer || isOrganizer) return;
    const convId = await ensureConversation(organizer.id);
    router.push(`/chat/${convId}`);
  };

  const handleCalendar = async () => {
    const result = await addToCalendar({
      title: `Glean drive: ${drive.title}`,
      startDate: new Date(drive.date),
      location: `${drive.area}, ${drive.region}`,
      notes: `${MATERIALS[drive.material].label} collection drive — target ${drive.targetKg}kg.`,
    });
    if (result.ok) haptic("success");
    Alert.alert(
      result.ok ? "Added to calendar" : "Couldn't add",
      result.ok ? "This drive is now in your calendar." : result.message ?? "Try again.",
    );
  };

  const handleShare = () => {
    shareText(
      `Join the "${drive.title}" collection drive in ${drive.area}, ${drive.region} on ${formatEventDate(drive.date)} — target ${drive.targetKg}kg of ${MATERIALS[drive.material].label}. On Glean.`,
    );
  };

  return (
    <View style={styles.card}>
      <DriveCardHeader title={drive.title} region={drive.region} area={drive.area} material={drive.material} />
      <DriveCardDate date={drive.date} />
      {drive.note ? <Text style={styles.note}>{drive.note}</Text> : null}
      <DriveProgress committed={committed} targetKg={drive.targetKg} supplierCount={drive.commitments.length} progress={progress} />
      {organizer ? <Text style={styles.organizer}>Organised by {organizer.name}</Text> : null}
      <DriveActions
        showMessage={!!organizer && !isOrganizer}
        onMessage={messageOrganizer}
        onCalendar={handleCalendar}
        onShare={handleShare}
      />
      <CommitButton onPress={() => onCommit(drive)} mine={mine} />
    </View>
  );
});

function DriveCardHeader({
  title,
  region,
  area,
  material,
}: {
  title: string;
  region: string;
  area: string;
  material: keyof typeof MATERIALS;
}) {
  return (
    <View style={styles.cardTop}>
      <View style={styles.cardIcon}>
        <Megaphone color={Colors.skyDeep} size={18} />
      </View>
      <View style={styles.flex1}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {title}
        </Text>
        <View style={styles.cardMeta}>
          <MapPin color={Colors.mist} size={12} />
          <Text style={styles.cardMetaText}>
            {area}, {region}
          </Text>
        </View>
      </View>
      <MaterialTag material={material} small />
    </View>
  );
}

function DriveCardDate({ date }: { date: number }) {
  return (
    <View style={styles.dateRow}>
      <CalendarDays color={Colors.slate} size={14} />
      <Text style={styles.dateText}>{formatEventDate(date)}</Text>
    </View>
  );
}

function DriveProgress({
  committed,
  targetKg,
  supplierCount,
  progress,
}: {
  committed: number;
  targetKg: number;
  supplierCount: number;
  progress: number;
}) {
  return (
    <>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.max(3, progress * 100)}%` }]} />
      </View>
      <View style={styles.progressMetaRow}>
        <Text style={styles.progressMeta}>
          <Text style={styles.progressStrong}>{committed}kg</Text> of {targetKg}kg pledged
        </Text>
        <Text style={styles.progressMeta}>
          {supplierCount} {supplierCount === 1 ? "supplier" : "suppliers"}
        </Text>
      </View>
    </>
  );
}

function DriveActions({
  showMessage,
  onMessage,
  onCalendar,
  onShare,
}: {
  showMessage: boolean;
  onMessage: () => void;
  onCalendar: () => void;
  onShare: () => void;
}) {
  return (
    <View style={styles.actionRow}>
      {showMessage ? (
        <PressableScale onPress={onMessage} style={styles.actionBtn} hapticStyle="light">
          <MessageCircle color={Colors.skyDeep} size={17} />
          <Text style={styles.actionText}>Message</Text>
        </PressableScale>
      ) : null}
      <PressableScale onPress={onCalendar} style={styles.actionBtn} hapticStyle="light">
        <CalendarPlus color={Colors.skyDeep} size={17} />
        <Text style={styles.actionText}>Calendar</Text>
      </PressableScale>
      <PressableScale onPress={onShare} style={styles.actionBtn} hapticStyle="light">
        <Share2 color={Colors.skyDeep} size={17} />
        <Text style={styles.actionText}>Share</Text>
      </PressableScale>
    </View>
  );
}

function CommitButton({
  onPress,
  mine,
}: {
  onPress: () => void;
  mine: Drive["commitments"][number] | undefined;
}) {
  return (
    <PressableScale onPress={onPress} style={[styles.commitBtn, mine && styles.commitBtnDone]}>
      {mine ? (
        <>
          <Check color={Colors.success} size={16} />
          <Text style={styles.commitBtnDoneText}>
            You pledged {mine.amountKg}kg · edit
          </Text>
        </>
      ) : (
        <Text style={styles.commitBtnText}>Pledge supply</Text>
      )}
    </PressableScale>
  );
}

function CommitSheet({ drive, onClose }: { drive: Drive | null; onClose: () => void }) {
  const { userId } = useAuth();
  const { commitToDrive, uncommitDrive } = useApp();
  const existing = drive?.commitments.find((c) => c.userId === userId);
  const [amount, setAmount] = useState<string>("");
  const [busy, setBusy] = useState<boolean>(false);

  // Reset the field when a different drive opens.
  React.useEffect(() => {
    setAmount(existing ? String(existing.amountKg) : "");
  }, [drive?.id, existing]);

  if (!drive) return null;
  const valid = Number(amount) > 0;

  const submit = async () => {
    if (!valid || busy) return;
    setBusy(true);
    try {
      await commitToDrive(drive.id, Number(amount), existing?.confirmed ?? false);
      haptic("success");
      // Gentle local reminder the morning of the pickup (or 3h before if sooner).
      if (!existing) {
        const day = new Date(drive.date);
        const remindAt = new Date(day);
        remindAt.setHours(8, 0, 0, 0);
        if (remindAt.getTime() <= Date.now()) {
          remindAt.setTime(day.getTime() - 3 * 60 * 60 * 1000);
        }
        await scheduleReminder({
          title: "Collection drive today",
          body: `"${drive.title}" in ${drive.area} — you pledged ${Number(amount)}kg.`,
          date: remindAt,
        });
      }
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await uncommitDrive(drive.id);
      haptic("light");
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet visible={!!drive} onClose={onClose} title={`Pledge to ${drive.title}`}>
      <Text style={styles.sheetHint}>
        How much {MATERIALS[drive.material].label.toLowerCase()} can you bring to this pickup? It&apos;s a
        soft pledge — confirm on the day.
      </Text>
      <Input
        value={amount}
        onChangeText={setAmount}
        placeholder="kg you can supply"
        keyboardType="numeric"
      />
      <View style={styles.mt16}>
        <Button
          label={existing ? "Update pledge" : "Pledge"}
          onPress={submit}
          disabled={!valid}
          loading={busy}
          fullWidth
        />
      </View>
      {existing ? (
        <PressableScale onPress={remove} style={styles.removePledge}>
          <Text style={styles.removePledgeText}>Withdraw my pledge</Text>
        </PressableScale>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },
  list: { padding: 16, gap: 14, paddingBottom: 100 },
  skeletonList: { gap: 14 },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.line,
    padding: 16,
  },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.skySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontFamily: Fonts.serif, fontSize: 18, color: Colors.charcoal },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  cardMetaText: { fontFamily: Fonts.sans, fontSize: 12.5, color: Colors.slate },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12 },
  dateText: { fontFamily: Fonts.sansSemibold, fontSize: 13, color: Colors.slate },
  note: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.ink,
    lineHeight: 20,
    marginTop: 10,
  },
  progressTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.cardAlt,
    overflow: "hidden",
    marginTop: 14,
  },
  progressFill: { height: "100%", borderRadius: 5, backgroundColor: Colors.sky },
  progressMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  progressMeta: { fontFamily: Fonts.sans, fontSize: 12.5, color: Colors.slate },
  progressStrong: { fontFamily: Fonts.monoBold, color: Colors.skyDeep },
  organizer: { fontFamily: Fonts.sansMedium, fontSize: 12.5, color: Colors.mist, marginTop: 10 },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 9,
    borderRadius: 11,
    backgroundColor: Colors.skySoft,
  },
  actionText: { fontFamily: Fonts.sansSemibold, fontSize: 12.5, color: Colors.skyDeep },
  commitBtn: {
    marginTop: 14,
    height: 46,
    borderRadius: 12,
    backgroundColor: Colors.sky,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  commitBtnText: { fontFamily: Fonts.sansBold, fontSize: 15, color: Colors.white },
  commitBtnDone: { backgroundColor: Colors.successSoft },
  commitBtnDoneText: { fontFamily: Fonts.sansBold, fontSize: 14, color: Colors.success },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  flex1: { flex: 1 },
  mt16: { marginTop: 16 },
  sheetHint: {
    fontFamily: Fonts.sans,
    fontSize: 13.5,
    color: Colors.slate,
    lineHeight: 19,
    marginBottom: 14,
  },
  removePledge: { alignItems: "center", paddingVertical: 14, marginTop: 4 },
  removePledgeText: { fontFamily: Fonts.sansSemibold, fontSize: 14, color: Colors.danger },
});
