import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowDownToLine, ArrowUpFromLine, Camera, Check, MapPin, Repeat } from "lucide-react-native";
import React, { useRef, useState } from "react";
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
import Colors, { MATERIALS, MaterialKey, REGIONS } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { LocationPicker, type Coord } from "@/components/location-picker";
import { useMediaPicker } from "@/components/media-picker";
import { newClientToken } from "@/lib/api";
import { uploadMedia } from "@/lib/upload";
import { useApp } from "@/providers/AppProvider";
import type { ListingKind, SupplyFrequency } from "@/types";

const FREQUENCIES: { key: SupplyFrequency; label: string }[] = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
];

const UNIT_OPTIONS = [
  { key: "kg", label: "kg" },
  { key: "bag-small", label: "Small Bag (~10kg)" },
  { key: "bag-medium", label: "Medium Bag (~25kg)" },
  { key: "bag-large", label: "Large Bag (~50kg)" },
  { key: "crate", label: "Crate (~15kg)" },
  { key: "bale", label: "Bale (~250kg)" },
  { key: "tons", label: "Ton (1000kg)" },
];

export default function PostListingScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { addListing, editListing, listings } = useApp();
  const { pick, element: mediaSheet } = useMediaPicker();
  const existing = id ? listings.find((l) => l.id === id) : undefined;
  const isEditing = !!existing;

  const [kind, setKind] = useState<ListingKind>(existing?.kind ?? "have");
  const [title, setTitle] = useState<string>(existing?.title ?? "");
  const [material, setMaterial] = useState<MaterialKey>(existing?.material ?? "plastics");
  const [quantity, setQuantity] = useState<string>(
    existing ? String(existing.quantity) : "",
  );
  const [unit, setUnit] = useState<string>(existing?.unit ?? "kg");
  const [region, setRegion] = useState<string>(existing?.region ?? REGIONS[0]);
  const [area, setArea] = useState<string>(existing?.area ?? "");
  const [description, setDescription] = useState<string>(existing?.description ?? "");
  const [photo, setPhoto] = useState<string | undefined>(existing?.photo);
  const [recurring, setRecurring] = useState<boolean>(existing?.recurring ?? false);
  const [frequency, setFrequency] = useState<SupplyFrequency>(
    existing?.frequency ?? "weekly",
  );
  const [coord, setCoord] = useState<Coord | undefined>(
    existing?.lat != null && existing?.lng != null
      ? { lat: existing.lat, lng: existing.lng }
      : undefined,
  );
  const [uploading, setUploading] = useState<boolean>(false);
  const [posting, setPosting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const tokenRef = useRef<string>(newClientToken());

  const valid =
    title.trim().length > 2 &&
    quantity.trim().length > 0 &&
    area.trim().length > 0 &&
    description.trim().length > 4;

  const pickImage = async () => {
    const asset = await pick({ mediaTypes: "images", allowsEditing: true, aspect: [4, 3] });
    if (!asset) return;
    setError(null);
    setUploading(true);
    try {
      const url = await uploadMedia(asset, "listings");
      setPhoto(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't upload photo.");
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!valid || posting) return;
    setPosting(true);
    setError(null);
    const payload = {
      kind,
      title: title.trim(),
      material,
      quantity: Number(quantity) || 0,
      unit,
      region: region as (typeof REGIONS)[number],
      area: area.trim(),
      description: description.trim(),
      photo,
      recurring,
      frequency: recurring ? frequency : undefined,
      lat: coord?.lat,
      lng: coord?.lng,
    };
    try {
      if (isEditing && existing) {
        await editListing(existing.id, payload);
      } else {
        await addListing(payload, tokenRef.current);
      }
      haptic("success");
      router.back();
    } catch (e) {
      haptic("medium");
      setError(e instanceof Error ? e.message : "Couldn't save listing.");
      setPosting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Field label="I want to…">
          <View style={styles.kindRow}>
            <KindOption
              active={kind === "have"}
              label="Offer materials"
              hint="I have these to give"
              color={Colors.success}
              soft={Colors.successSoft}
              icon={ArrowUpFromLine}
              onPress={() => setKind("have")}
            />
            <KindOption
              active={kind === "need"}
              label="Request materials"
              hint="I'm looking for these"
              color={Colors.amberInk}
              soft={Colors.amberSoft}
              icon={ArrowDownToLine}
              onPress={() => setKind("need")}
            />
          </View>
        </Field>

        <Field label="Photo">
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
        </Field>

        <Field label="Title">
          <Input
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Clean PET bottles, sorted clear"
          />
        </Field>

        <Field label="Material">
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
        </Field>

        <Field label="Quantity">
          <Input
            value={quantity}
            onChangeText={setQuantity}
            placeholder="120"
            keyboardType="numeric"
          />
        </Field>

        <Field label="Unit">
          <View style={styles.chipWrap}>
            {UNIT_OPTIONS.map((opt) => (
              <Chip
                key={opt.key}
                label={opt.label}
                active={unit === opt.key}
                onPress={() => setUnit(opt.key)}
              />
            ))}
          </View>
        </Field>

        {kind === "have" ? (
          <Field label="Supply">
            <PressableScale onPress={() => { haptic("light"); setRecurring((r) => !r); }}>
              <View
                style={getRecurringRowStyle(recurring)}
              >
                <View style={getRecurringIconStyle(recurring)}>
                  <Repeat color={recurring ? Colors.white : Colors.mist} size={16} />
                </View>
                <View style={styles.flex1}>
                  <Text style={styles.recurringTitle}>I supply this regularly</Text>
                  <Text style={styles.recurringHint}>
                    Stay discoverable as standing supply, not a one-off
                  </Text>
                </View>
                <View style={[styles.toggle, recurring && styles.toggleOn]}>
                  <View style={[styles.knob, recurring && styles.knobOn]} />
                </View>
              </View>
            </PressableScale>
            {recurring ? (
              <View style={styles.freqRow}>
                {FREQUENCIES.map((f) => (
                  <Chip
                    key={f.key}
                    label={f.label}
                    active={frequency === f.key}
                    onPress={() => setFrequency(f.key)}
                    color={Colors.success}
                  />
                ))}
              </View>
            ) : null}
          </Field>
        ) : null}

        <Field label="Pin location (optional)">
          <LocationPicker value={coord} onChange={setCoord} />
        </Field>

        <Field label="Region">
          <SelectField
            value={region}
            options={REGIONS.map((r) => ({ key: r, label: r }))}
            onChange={setRegion}
            label="region"
            icon={<MapPin color={Colors.sky} size={18} />}
          />
        </Field>

        <Field label="Area / town">
          <Input
            value={area}
            onChangeText={setArea}
            placeholder="e.g. Madina"
          />
        </Field>

        <Field label="Description">
          <Input
            value={description}
            onChangeText={setDescription}
            placeholder="Condition, how to collect, timing…"
            textarea
          />
        </Field>
      </ScrollView>

      <FormFooter error={error}>
        <Button
          label={isEditing ? "Save changes" : "Post listing"}
          onPress={submit}
          disabled={!valid || uploading}
          loading={posting}
          fullWidth
          icon={<Check color={Colors.white} size={18} />}
        />
      </FormFooter>
      {mediaSheet}
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Label text={label} />
      {children}
    </View>
  );
}

function KindOption({
  active,
  label,
  hint,
  color,
  soft,
  icon: Icon,
  onPress,
}: {
  active: boolean;
  label: string;
  hint: string;
  color: string;
  soft: string;
  icon: typeof ArrowUpFromLine;
  onPress: () => void;
}) {
  return (
    <PressableScale onPress={onPress} style={styles.flex1}>
      <View
        style={[
          styles.kindOption,
          active
            ? { backgroundColor: soft, borderColor: color }
            : { backgroundColor: Colors.card, borderColor: Colors.line },
        ]}
      >
        <View
          style={[
            styles.kindIcon,
            { backgroundColor: active ? color : Colors.cardAlt },
          ]}
        >
          <Icon color={active ? Colors.white : Colors.mist} size={16} />
        </View>
        <Text
          style={[
            styles.kindOptionText,
            { color: active ? color : Colors.ink },
          ]}
        >
          {label}
        </Text>
        <Text
          style={[
            styles.kindOptionHint,
            { color: active ? color : Colors.mist },
          ]}
          numberOfLines={1}
        >
          {hint}
        </Text>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },
  content: { padding: 20, paddingTop: 16, paddingBottom: 40, gap: 22 },
  field: { gap: 0 },
  kindRow: { flexDirection: "row", gap: 10 },
  kindOption: {
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 16,
    paddingHorizontal: 14,
    alignItems: "flex-start",
    gap: 8,
  },
  kindIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  kindOptionText: { fontFamily: Fonts.sansSemibold, fontSize: 14.5 },
  kindOptionHint: { fontFamily: Fonts.sansMedium, fontSize: 11.5, marginTop: -2 },
  photoPicker: {
    height: 160,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.line,
    borderStyle: "dashed",
  },
  photo: { width: "100%", height: "100%" },
  photoEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  photoText: { fontFamily: Fonts.sansMedium, fontSize: 14, color: Colors.mist },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  recurringRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
  },
  recurringIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  recurringTitle: { fontFamily: Fonts.sansSemibold, fontSize: 14.5, color: Colors.charcoal },
  recurringHint: { fontFamily: Fonts.sansMedium, fontSize: 12, color: Colors.slate, marginTop: 1 },
  toggle: {
    width: 46,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.line,
    padding: 3,
    justifyContent: "center",
  },
  toggleOn: { backgroundColor: Colors.success },
  knob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.white,
  },
  knobOn: { alignSelf: "flex-end" },
  freqRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  flex1: { flex: 1 },
});

function getRecurringRowStyle(recurring: boolean) {
  return [
    styles.recurringRow,
    recurring
      ? { backgroundColor: Colors.successSoft, borderColor: Colors.success }
      : { backgroundColor: Colors.card, borderColor: Colors.line },
  ];
}

function getRecurringIconStyle(recurring: boolean) {
  return [
    styles.recurringIcon,
    { backgroundColor: recurring ? Colors.success : Colors.cardAlt },
  ];
}
