import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Camera, CalendarDays, Check, MapPin } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
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
import { useMediaPicker } from "@/components/media-picker";
import Colors, { REGIONS } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { uploadMedia } from "@/lib/upload";
import { useApp } from "@/providers/AppProvider";
import type { ClimateEvent } from "@/types";

const TYPES: ClimateEvent["type"][] = ["event", "forum", "job fair"];

const pad = (n: number): string => String(n).padStart(2, "0");

/** Web fallback helpers: serialize/parse a Date to text inputs. */
function toDateInput(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function toTimeInput(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function applyDateInput(prev: Date, value: string): Date {
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value.trim());
  if (!match) return prev;
  const next = new Date(prev);
  next.setFullYear(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return next;
}
function applyTimeInput(prev: Date, value: string): Date {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return prev;
  const next = new Date(prev);
  next.setHours(Number(match[1]), Number(match[2]));
  return next;
}

export default function SubmitEventScreen() {
  const { addEvent } = useApp();
  const { pick, element: mediaSheet } = useMediaPicker();

  const [title, setTitle] = useState<string>("");
  const [type, setType] = useState<ClimateEvent["type"]>("event");
  const [region, setRegion] = useState<string>(REGIONS[0]);
  const [location, setLocation] = useState<string>("");
  const [organizer, setOrganizer] = useState<string>("");
  const [date, setDate] = useState<Date>(() => {
    const next = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    next.setHours(10, 0, 0, 0);
    return next;
  });
  const [picker, setPicker] = useState<"date" | "time" | null>(null);
  const [description, setDescription] = useState<string>("");
  const [contact, setContact] = useState<string>("");
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const [uploading, setUploading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const pickImage = async () => {
    const asset = await pick({ mediaTypes: "images", allowsEditing: true, aspect: [16, 9] });
    if (!asset) return;
    setError(null);
    setUploading(true);
    try {
      const url = await uploadMedia(asset, "events");
      setPhoto(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't upload photo.");
    } finally {
      setUploading(false);
    }
  };

  const onPickerChange = (e: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS !== "ios") setPicker(null);
    if (e.type === "dismissed" || !selected) return;
    setDate((prev) => {
      const next = new Date(prev);
      if (picker === "time") {
        next.setHours(selected.getHours(), selected.getMinutes());
      } else {
        next.setFullYear(
          selected.getFullYear(),
          selected.getMonth(),
          selected.getDate(),
        );
      }
      return next;
    });
  };

  const friendlyDate = date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const friendlyTime = date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const valid =
    title.trim().length > 2 &&
    location.trim().length > 1 &&
    organizer.trim().length > 1 &&
    contact.trim().length > 4 &&
    description.trim().length > 4;

  const submit = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await addEvent({
        title: title.trim(),
        type,
        region: region as (typeof REGIONS)[number],
        location: location.trim(),
        organizer: organizer.trim(),
        date: date.getTime(),
        description: description.trim(),
        contact: contact.trim(),
        photo,
      });
      haptic("success");
      router.back();
    } catch (e) {
      haptic("medium");
      setError(e instanceof Error ? e.message : "Couldn't submit event.");
      setSubmitting(false);
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
            Submitted events appear as “pending review” until approved by a
            moderator.
          </Text>
        </View>

        <Label text="Photo" />
        <PressableScale onPress={pickImage} style={styles.photoPicker} disabled={uploading}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.photo} contentFit="cover" />
          ) : (
            <View style={styles.photoEmpty}>
              {uploading ? (
                <ActivityIndicator color={Colors.sky} />
              ) : (
                <Camera color={Colors.mist} size={26} />
              )}
              <Text style={styles.photoText}>
                {uploading ? "Uploading…" : "Add a photo (optional)"}
              </Text>
            </View>
          )}
        </PressableScale>

        <Label text="Title" />
        <Input
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Accra Recyclers Meetup"
        />

        <Label text="Type" />
        <View style={styles.chipWrap}>
          {TYPES.map((t) => (
            <Chip
              key={t}
              label={t}
              active={type === t}
              onPress={() => setType(t)}
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

        <Label text="Location / venue" />
        <Input
          value={location}
          onChangeText={setLocation}
          placeholder="e.g. Accra Conference Centre"
        />

        <Label text="Organizer" />
        <Input
          value={organizer}
          onChangeText={setOrganizer}
          placeholder="Your organisation"
        />

        <Label text="When" />
        <View style={styles.dateRow}>
          <PressableScale
            onPress={() => setPicker(picker === "date" ? null : "date")}
            style={[styles.dateField, { flex: 1.6 }]}
          >
            <View style={styles.dateFieldInner}>
              <CalendarDays color={Colors.sky} size={18} />
              <Text style={styles.dateValue} numberOfLines={1}>
                {friendlyDate}
              </Text>
            </View>
          </PressableScale>
          <PressableScale
            onPress={() => setPicker(picker === "time" ? null : "time")}
            style={[styles.dateField, { flex: 1 }]}
          >
            <View style={styles.dateFieldInner}>
              <Text style={styles.dateValue}>{friendlyTime}</Text>
            </View>
          </PressableScale>
        </View>
        {picker && Platform.OS !== "web" ? (
          <View style={styles.pickerWrap}>
            <DateTimePicker
              value={date}
              mode={picker}
              display={Platform.OS === "ios" ? "spinner" : "default"}
              minimumDate={picker === "date" ? new Date() : undefined}
              onChange={onPickerChange}
              themeVariant="light"
            />
          </View>
        ) : null}
        {picker && Platform.OS === "web" ? (
          <View style={styles.webPicker}>
            <Text style={styles.webPickerHint}>
              {picker === "date"
                ? "Enter the date as YYYY-MM-DD"
                : "Enter the time as HH:MM (24-hour)"}
            </Text>
            <Input
              value={
                picker === "date"
                  ? toDateInput(date)
                  : toTimeInput(date)
              }
              onChangeText={(value) =>
                setDate((prev) =>
                  picker === "date"
                    ? applyDateInput(prev, value)
                    : applyTimeInput(prev, value),
                )
              }
              placeholder={picker === "date" ? "2026-06-21" : "10:00"}
            />
          </View>
        ) : null}

        <Label text="Contact (email or phone)" />
        <Input
          value={contact}
          onChangeText={setContact}
          placeholder="events@example.com"
          autoCapitalize="none"
        />

        <Label text="Description" />
        <Input
          value={description}
          onChangeText={setDescription}
          placeholder="What's happening, who should come…"
          textarea
        />
      </ScrollView>

      <FormFooter error={error}>
        <Button
          label="Submit for review"
          onPress={submit}
          disabled={!valid || uploading}
          loading={submitting}
          fullWidth
          variant="amber"
          icon={<Check color={Colors.white} size={18} />}
        />
      </FormFooter>
      {mediaSheet}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },
  content: { padding: 20, paddingTop: 14, paddingBottom: 40 },
  notice: {
    backgroundColor: Colors.skySoft,
    borderRadius: 12,
    padding: 14,
  },
  noticeText: { fontFamily: Fonts.sans, fontSize: 13.5, color: Colors.skyDeep, lineHeight: 19 },
  dateRow: { flexDirection: "row", gap: 10, marginTop: 6 },
  dateField: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.line,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  dateFieldInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  dateValue: {
    fontFamily: Fonts.sansMedium,
    fontSize: 15,
    color: Colors.charcoal,
    flexShrink: 1,
  },
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
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chipRow: { gap: 8, paddingRight: 20 },
  photoPicker: {
    height: 150,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.line,
    borderStyle: "dashed",
    marginTop: 6,
    marginBottom: 6,
  },
  photo: { width: "100%", height: "100%" },
  photoEmpty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  photoText: { fontFamily: Fonts.sansMedium, fontSize: 14, color: Colors.mist },
});
