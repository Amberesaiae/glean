import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { router, useLocalSearchParams } from "expo-router";
import { CalendarDays, Check, MapPin } from "lucide-react-native";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { FormFooter } from "@/components/form-footer";
import {
  Button,
  Chip,
  Input,
  Label,
  PressableScale,
  SelectField,
  Text,
  haptic,
} from "@/components/ui";
import Colors, { MATERIALS, MaterialKey, REGIONS, Region } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { useApp } from "@/providers/AppProvider";

const pad = (n: number): string => String(n).padStart(2, "0");
function toDateInput(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function applyDateInput(prev: Date, value: string): Date {
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value.trim());
  if (!match) return prev;
  const next = new Date(prev);
  next.setFullYear(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return next;
}

export default function StartDriveScreen() {
  const params = useLocalSearchParams<{ region?: string; area?: string }>();
  const { createDrive } = useApp();

  const initialRegion = REGIONS.includes(params.region as Region)
    ? (params.region as string)
    : REGIONS[0];

  const [title, setTitle] = useState<string>("");
  const [material, setMaterial] = useState<MaterialKey>("plastics");
  const [region, setRegion] = useState<string>(initialRegion);
  const [area, setArea] = useState<string>(params.area ?? "");
  const [targetKg, setTargetKg] = useState<string>("");
  const [date, setDate] = useState<Date>(() => {
    const next = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    next.setHours(9, 0, 0, 0);
    return next;
  });
  const [showPicker, setShowPicker] = useState<boolean>(false);
  const [note, setNote] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const valid =
    title.trim().length > 2 && area.trim().length > 0 && Number(targetKg) > 0;

  const onPickerChange = (e: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS !== "ios") setShowPicker(false);
    if (e.type === "dismissed" || !selected) return;
    setDate((prev) => {
      const next = new Date(prev);
      next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      return next;
    });
  };

  const friendlyDate = date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const submit = async () => {
    if (!valid || saving) return;
    setSaving(true);
    setError(null);
    try {
      await createDrive({
        title: title.trim(),
        material,
        region: region as Region,
        area: area.trim(),
        targetKg: Number(targetKg),
        date: date.getTime(),
        note: note.trim(),
      });
      haptic("success");
      router.replace("/drives");
    } catch (e) {
      haptic("medium");
      setError(e instanceof Error ? e.message : "Couldn't start the drive.");
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
        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            Announce a pickup so nearby suppliers can pledge toward your target. Coordinate the
            details over chat.
          </Text>
        </View>

        <Label text="Title" />
        <Input
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Madina sachet pickup"
        />

        <Label text="Material" />
        <View style={styles.chipWrap}>
          {(Object.keys(MATERIALS) as MaterialKey[]).map((m) => (
            <Chip
              key={m}
              label={MATERIALS[m].label}
              active={material === m}
              onPress={() => setMaterial(m)}
              color={MATERIALS[m].color}
            />
          ))}
        </View>

        <Label text="Region" />
        <SelectField
          value={region}
          options={REGIONS.map(r => ({ key: r, label: r }))}
          onChange={setRegion}
          label="region"
          icon={<MapPin color={Colors.sky} size={18} />}
        />

        <Label text="Area / town" />
        <Input value={area} onChangeText={setArea} placeholder="e.g. Madina" />

        <Label text="Target (kg)" />
        <Input
          value={targetKg}
          onChangeText={setTargetKg}
          placeholder="500"
          keyboardType="numeric"
        />

        <Label text="Pickup day" />
        <PressableScale
          onPress={() => setShowPicker((s) => !s)}
          style={styles.dateField}
        >
          <View style={styles.dateFieldInner}>
            <CalendarDays color={Colors.sky} size={18} />
            <Text style={styles.dateValue}>{friendlyDate}</Text>
          </View>
        </PressableScale>
        {showPicker && Platform.OS !== "web" ? (
          <View style={styles.pickerWrap}>
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              minimumDate={new Date()}
              onChange={onPickerChange}
              themeVariant="light"
            />
          </View>
        ) : null}
        {showPicker && Platform.OS === "web" ? (
          <View style={styles.webPicker}>
            <Text style={styles.webPickerHint}>Enter the date as YYYY-MM-DD</Text>
            <Input
              value={toDateInput(date)}
              onChangeText={(value) => setDate((prev) => applyDateInput(prev, value))}
              placeholder="2026-06-24"
            />
          </View>
        ) : null}

        <Label text="Note (optional)" />
        <Input
          value={note}
          onChangeText={setNote}
          placeholder="Collection point, timing, price guidance…"
          textarea
        />
      </ScrollView>

      <FormFooter error={error}>
        <Button
          label="Announce drive"
          onPress={submit}
          disabled={!valid}
          loading={saving}
          fullWidth
          icon={<Check color={Colors.white} size={18} />}
        />
      </FormFooter>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },
  content: { padding: 20, paddingTop: 14, paddingBottom: 40 },
  notice: { backgroundColor: Colors.skySoft, borderRadius: 12, padding: 14, marginBottom: 6 },
  noticeText: { fontFamily: Fonts.sans, fontSize: 13.5, color: Colors.skyDeep, lineHeight: 19 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  dateField: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.line,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginTop: 6,
  },
  dateFieldInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  dateValue: { fontFamily: Fonts.sansMedium, fontSize: 15, color: Colors.charcoal },
  pickerWrap: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.line,
    marginTop: 10,
    overflow: "hidden",
  },
  webPicker: { marginTop: 10, gap: 8 },
  webPickerHint: { fontFamily: Fonts.sans, fontSize: 12.5, color: Colors.slate },
});
