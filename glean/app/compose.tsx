import { Image } from "expo-image";
import { router } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { ImagePlus, Send, Video as VideoIcon, X } from "lucide-react-native";
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
import { Button, Chip, Input, Label, PressableScale, Text, haptic } from "@/components/ui";
import { useMediaPicker } from "@/components/media-picker";
import Colors, { MATERIALS, MaterialKey } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { newClientToken } from "@/lib/api";
import { isVideoUrl, uploadMedia } from "@/lib/upload";
import { useApp } from "@/providers/AppProvider";

const MAX = 280;

/** Looping, muted preview for an uploaded video URL. */
function VideoPreview({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });
  return <VideoView player={player} style={styles.photo} contentFit="cover" nativeControls={false} />;
}

export default function ComposeScreen() {
  const { addPost } = useApp();
  const { pick, element: mediaSheet } = useMediaPicker();
  const [text, setText] = useState<string>("");
  const [material, setMaterial] = useState<MaterialKey | undefined>(undefined);
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const [uploading, setUploading] = useState<boolean>(false);
  const [posting, setPosting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const tokenRef = useRef<string>(newClientToken());

  const remaining = MAX - text.length;
  const valid = text.trim().length > 2 && remaining >= 0;

  const pickMedia = async (kind: "image" | "video") => {
    const asset = await pick({ mediaTypes: kind === "video" ? "videos" : "images" });
    if (!asset) return;
    setError(null);
    setUploading(true);
    try {
      const url = await uploadMedia(asset, "feed");
      setPhoto(url);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : `Couldn't upload ${kind === "video" ? "video" : "photo"}.`,
      );
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!valid || posting) return;
    setPosting(true);
    setError(null);
    try {
      await addPost({ text: text.trim(), material, photo }, tokenRef.current);
      haptic("success");
      router.back();
    } catch (e) {
      haptic("medium");
      setError(e instanceof Error ? e.message : "Couldn't post.");
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
        keyboardShouldPersistTaps="handled"
      >
        <Input
          value={text}
          onChangeText={setText}
          placeholder="Share what you're working on…"
          placeholderTextColor={Colors.mist}
          style={styles.input}
          multiline
          autoFocus
        />
        <Text
          style={[
            styles.counter,
            remaining < 20 && { color: Colors.amber },
            remaining < 0 && { color: Colors.danger },
          ]}
        >
          {remaining}
        </Text>

        {photo ? (
          <View style={styles.photoWrap}>
            {isVideoUrl(photo) ? (
              <VideoPreview uri={photo} />
            ) : (
              <Image source={{ uri: photo }} style={styles.photo} contentFit="cover" />
            )}
            <PressableScale
              onPress={() => setPhoto(undefined)}
              style={styles.removePhoto}
            >
              <X color={Colors.white} size={16} />
            </PressableScale>
          </View>
        ) : null}

        {uploading ? (
          <View style={styles.uploadingRow}>
            <ActivityIndicator color={Colors.sky} size="small" />
            <Text style={styles.uploadingText}>Uploading…</Text>
          </View>
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Label text="Tag a material (optional)" />
        <View style={styles.chipWrap}>
          {(Object.keys(MATERIALS) as MaterialKey[]).map((m) => (
            <Chip
              key={m}
              label={MATERIALS[m].label}
              active={material === m}
              onPress={() => setMaterial(material === m ? undefined : m)}
              color={MATERIALS[m].color}
            />
          ))}
        </View>
      </ScrollView>

      <FormFooter contentStyle={styles.footer}>
        <PressableScale
          onPress={() => pickMedia("image")}
          style={styles.photoBtn}
          disabled={uploading}
        >
          <ImagePlus color={Colors.sky} size={22} />
        </PressableScale>
        <PressableScale
          onPress={() => pickMedia("video")}
          style={styles.photoBtn}
          disabled={uploading}
        >
          <VideoIcon color={Colors.sky} size={22} />
        </PressableScale>
        <Button
          label="Post"
          onPress={submit}
          disabled={!valid || uploading}
          loading={posting}
          icon={<Send color={Colors.white} size={16} />}
          style={styles.flex1}
        />
      </FormFooter>
      {mediaSheet}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },
  content: { padding: 20 },
  input: {
    fontFamily: Fonts.sans,
    fontSize: 18,
    lineHeight: 26,
    color: Colors.charcoal,
    minHeight: 120,
    textAlignVertical: "top",
  },
  counter: {
    fontFamily: Fonts.monoBold,
    fontSize: 13,
    color: Colors.mist,
    textAlign: "right",
  },
  photoWrap: { marginTop: 16, borderRadius: 16, overflow: "hidden" },
  photo: { width: "100%", height: 220, backgroundColor: Colors.cardAlt },
  removePhoto: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  uploadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
  },
  uploadingText: { fontFamily: Fonts.sansMedium, fontSize: 13.5, color: Colors.slate },
  error: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13.5,
    color: Colors.danger,
    marginTop: 12,
    lineHeight: 19,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  flex1: { flex: 1 },
  photoBtn: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: Colors.skySoft,
    alignItems: "center",
    justifyContent: "center",
  },
});
