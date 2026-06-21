import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Platform, StyleSheet } from "react-native";

import { EcoImage } from "@/components/illustrations";
import Colors from "@/constants/colors";
import { Fonts } from "@/constants/fonts";

/**
 * A fast "glean" splash shown over the app on every cold start. It fades the
 * wordmark in, holds briefly, then fades away and unmounts — no taps needed.
 */
export function SplashOverlay() {
  const [done, setDone] = useState<boolean>(false);
  const opacity = useRef(new Animated.Value(1)).current;
  const artIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const seq = Animated.sequence([
      Animated.parallel([
        Animated.timing(artIn, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(520),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 380,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    seq.start(() => setDone(true));
    return () => seq.stop();
  }, [opacity, artIn]);

  if (done) return null;

  const artStyle = {
    opacity: artIn,
    transform: [
      {
        scale: artIn.interpolate({ inputRange: [0, 1], outputRange: [0.78, 1] }),
      },
    ],
  };
  const wordStyle = {
    opacity: artIn,
    transform: [
      {
        translateY: artIn.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }),
      },
    ],
  };

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.wrap, { opacity }]} pointerEvents="none">
      <Animated.View style={artStyle}>
        <EcoImage name="zeroWaste" size={104} />
      </Animated.View>
      <Animated.Text style={[styles.word, wordStyle]}>glean</Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.paper,
    zIndex: 100,
    ...(Platform.OS === "web" ? { position: "fixed" as "absolute" } : null),
  },
  word: {
    fontFamily: Fonts.script,
    fontSize: 76,
    lineHeight: 86,
    color: Colors.skyDeep,
    marginTop: 12,
  },
});
