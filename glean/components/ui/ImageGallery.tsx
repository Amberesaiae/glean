import { Image } from "expo-image";
import React, { useCallback, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";

import Colors from "@/constants/colors";

/**
 * A swipeable image carousel with paging dots. Falls back to a single image
 * when only one is supplied. Width is measured from the parent via `inset`
 * (total horizontal padding around the gallery) so paging snaps correctly.
 */
export function ImageGallery({
  images,
  height = 220,
  radius = 18,
  inset = 0,
}: {
  images: string[];
  height?: number;
  radius?: number;
  inset?: number;
}) {
  const { width } = useWindowDimensions();
  const pageWidth = width - inset;
  const [index, setIndex] = useState<number>(0);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
      if (next !== index) setIndex(next);
    },
    [index, pageWidth],
  );

  if (images.length === 0) return null;

  if (images.length === 1) {
    return (
      <Image
        source={{ uri: images[0] }}
        style={[styles.single, { height, borderRadius: radius }]}
        contentFit="cover"
        transition={250}
      />
    );
  }

  return (
    <View>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={{ borderRadius: radius }}
      >
        {images.map((uri, i) => (
          <Image
            key={`${uri}-${i}`}
            source={{ uri }}
            style={{ width: pageWidth, height, borderRadius: radius }}
            contentFit="cover"
            transition={250}
          />
        ))}
      </ScrollView>
      <View style={styles.dots} pointerEvents="none">
        {images.map((uri, i) => (
          <View
            key={`dot-${uri}-${i}`}
            style={[styles.dot, i === index && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  single: {
    width: "100%",
    backgroundColor: Colors.cardAlt,
  },
  dots: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.55)",
  },
  dotActive: {
    width: 18,
    backgroundColor: Colors.white,
  },
});
