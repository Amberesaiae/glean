import * as ImagePicker from "expo-image-picker";
import { Camera, ImageIcon } from "lucide-react-native";
import React, { useCallback, useRef, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

import { PressableScale, Sheet } from "@/components/ui";
import Colors from "@/constants/colors";
import { Fonts } from "@/constants/fonts";

type MediaKind = "images" | "videos";

interface PickOptions {
  mediaTypes?: MediaKind;
  allowsEditing?: boolean;
  aspect?: [number, number];
}

type Asset = ImagePicker.ImagePickerAsset;

/**
 * Hook that exposes a promise-based `pick()` plus a `<Sheet>` element offering
 * "Take a photo" or "Choose from gallery". On web (no camera) it skips the sheet
 * and opens the library directly. Render `element` once inside the screen.
 */
export function useMediaPicker(): {
  pick: (options?: PickOptions) => Promise<Asset | null>;
  element: React.ReactNode;
} {
  const [visible, setVisible] = useState<boolean>(false);
  const optsRef = useRef<PickOptions>({});
  const resolverRef = useRef<((a: Asset | null) => void) | null>(null);

  const settle = useCallback((asset: Asset | null) => {
    const resolve = resolverRef.current;
    resolverRef.current = null;
    resolve?.(asset);
  }, []);

  const launch = useCallback(
    async (source: "camera" | "library", opts: PickOptions): Promise<Asset | null> => {
      const kind: MediaKind = opts.mediaTypes ?? "images";
      const common: ImagePicker.ImagePickerOptions = {
        mediaTypes: [kind],
        quality: 0.7,
        allowsEditing: opts.allowsEditing,
        aspect: opts.aspect,
        base64: kind === "images",
        videoMaxDuration: 60,
      };
      try {
        if (source === "camera") {
          const perm = await ImagePicker.requestCameraPermissionsAsync();
          if (!perm.granted) return null;
          const result = await ImagePicker.launchCameraAsync(common);
          if (result.canceled || !result.assets[0]) return null;
          return result.assets[0];
        }
        const result = await ImagePicker.launchImageLibraryAsync(common);
        if (result.canceled || !result.assets[0]) return null;
        return result.assets[0];
      } catch {
        return null;
      }
    },
    [],
  );

  const pick = useCallback(
    (options: PickOptions = {}): Promise<Asset | null> => {
      optsRef.current = options;
      if (Platform.OS === "web") {
        return launch("library", options);
      }
      setVisible(true);
      return new Promise<Asset | null>((resolve) => {
        resolverRef.current = resolve;
      });
    },
    [launch],
  );

  const choose = useCallback(
    async (source: "camera" | "library") => {
      setVisible(false);
      const asset = await launch(source, optsRef.current);
      settle(asset);
    },
    [launch, settle],
  );

  const close = useCallback(() => {
    setVisible(false);
    settle(null);
  }, [settle]);

  const isVideo = optsRef.current.mediaTypes === "videos";

  const element = (
    <Sheet visible={visible} onClose={close} title={isVideo ? "Add a video" : "Add a photo"}>
      <View style={styles.options}>
        <PressableScale onPress={() => choose("camera")} style={styles.option} hapticStyle="medium">
          <View style={styles.optionIcon}>
            <Camera color={Colors.skyDeep} size={24} />
          </View>
          <Text style={styles.optionTitle}>
            {isVideo ? "Record a video" : "Take a photo"}
          </Text>
          <Text style={styles.optionHint}>Use your camera</Text>
        </PressableScale>
        <PressableScale onPress={() => choose("library")} style={styles.option} hapticStyle="medium">
          <View style={styles.optionIcon}>
            <ImageIcon color={Colors.skyDeep} size={24} />
          </View>
          <Text style={styles.optionTitle}>Choose from gallery</Text>
          <Text style={styles.optionHint}>Pick an existing one</Text>
        </PressableScale>
      </View>
    </Sheet>
  );

  return { pick, element };
}

const styles = StyleSheet.create({
  options: { flexDirection: "row", gap: 12, marginTop: 4 },
  option: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.line,
    paddingVertical: 22,
    paddingHorizontal: 14,
    alignItems: "center",
    gap: 6,
  },
  optionIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.skySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  optionTitle: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 14.5,
    color: Colors.charcoal,
    textAlign: "center",
  },
  optionHint: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.mist,
    textAlign: "center",
  },
});
