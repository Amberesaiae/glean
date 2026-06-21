import { router } from "expo-router";
import { ArrowRight } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { Button, Text } from "@/components/ui";
import { EcoImage, EcoKey } from "@/components/illustrations";
import Colors from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { useApp } from "@/providers/AppProvider";

const POINTS: { illustration: EcoKey; title: string; body: string }[] = [
  {
    illustration: "recycling",
    title: "Trade your materials",
    body: "Post what you have or need and find buyers near you.",
  },
  {
    illustration: "community",
    title: "Grow with the community",
    body: "Swap tips and message collectors and buyers directly.",
  },
  {
    illustration: "sustainability",
    title: "Build a green livelihood",
    body: "Learn practical guides and watch your impact add up.",
  },
];

/** Spring used for content settling — premium and unhurried. */
const SETTLE_SPRING = { damping: 16, stiffness: 120, mass: 0.9 } as const;

/** One staggered value point that fades and slides up into place. */
function AnimatedPoint({
  point,
  progress,
}: {
  point: (typeof POINTS)[number];
  progress: SharedValue<number>;
}) {
  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: interpolate(progress.value, [0, 1], [22, 0]) }],
  }));
  return (
    <Animated.View style={[styles.point, style]}>
      <EcoImage name={point.illustration} size={36} />
      <View style={styles.pointText}>
        <Text style={styles.pointTitle}>{point.title}</Text>
        <Text style={styles.pointBody}>{point.body}</Text>
      </View>
    </Animated.View>
  );
}

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useApp();

  // Intro overlay (big centered hero) values.
  const introArt = useSharedValue(0); // 0 hidden → 1 shown
  const introWord = useSharedValue(0);
  const shimmer = useSharedValue(0);
  const introOut = useSharedValue(0); // 0 = overlay visible, 1 = faded/lifted away

  // Resting content values.
  const header = useSharedValue(0);
  const point0 = useSharedValue(0);
  const point1 = useSharedValue(0);
  const point2 = useSharedValue(0);
  const footer = useSharedValue(0);

  const [reduceMotion, setReduceMotion] = useState<boolean>(false);
  const [ready, setReady] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (active) {
          setReduceMotion(enabled);
          setReady(true);
        }
      })
      .catch(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const haptic = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  };
  const hapticRef = useRef(haptic);
  hapticRef.current = haptic;

  useEffect(() => {
    if (!ready) return;

    if (reduceMotion) {
      // Show final layout immediately, skip the intro overlay entirely.
      introOut.value = 1;
      header.value = 1;
      point0.value = 1;
      point1.value = 1;
      point2.value = 1;
      footer.value = 1;
      return;
    }

    // Stage 1 — the reveal (intro overlay).
    introArt.value = withTiming(1, {
      duration: 700,
      easing: Easing.out(Easing.cubic),
    });
    introWord.value = withDelay(
      550,
      withSpring(1, { damping: 14, stiffness: 90, mass: 1 }),
    );

    // Subtle living shimmer across the script.
    shimmer.value = withDelay(
      700,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      ),
    );

    // Transition — overlay lifts + fades away (crossfades into the header).
    introOut.value = withDelay(
      2500,
      withTiming(1, { duration: 520, easing: Easing.inOut(Easing.cubic) }),
    );

    // Stage 2 — resting content fades/slides in.
    header.value = withDelay(2560, withTiming(1, { duration: 480 }));
    point0.value = withDelay(2720, withSpring(1, SETTLE_SPRING));
    point1.value = withDelay(2840, withSpring(1, SETTLE_SPRING));
    point2.value = withDelay(2960, withSpring(1, SETTLE_SPRING));
    footer.value = withDelay(3160, withTiming(1, { duration: 600 }));

    const t = setTimeout(() => hapticRef.current(), 2500);
    return () => {
      clearTimeout(t);
      cancelAnimation(shimmer);
    };
  }, [
    ready,
    reduceMotion,
    introArt,
    introWord,
    shimmer,
    introOut,
    header,
    point0,
    point1,
    point2,
    footer,
  ]);

  // --- Intro overlay styles (absolute, on top, all transform/opacity only) ---
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: 1 - introOut.value,
    transform: [
      { translateY: interpolate(introOut.value, [0, 1], [0, -40]) },
      { scale: interpolate(introOut.value, [0, 1], [1, 0.92]) },
    ],
  }));
  const introArtStyle = useAnimatedStyle(() => ({
    opacity: introArt.value,
    transform: [{ scale: interpolate(introArt.value, [0, 1], [0.7, 1]) }],
  }));
  const introWordStyle = useAnimatedStyle(() => ({
    opacity: introWord.value,
    transform: [
      { translateY: interpolate(introWord.value, [0, 1], [18, 0]) },
      { scale: interpolate(shimmer.value, [0, 1], [1, 1.02]) },
    ],
  }));

  // --- Resting content styles ---
  const headerStyle = useAnimatedStyle(() => ({
    opacity: header.value,
    transform: [{ translateY: interpolate(header.value, [0, 1], [-8, 0]) }],
  }));
  const footerStyle = useAnimatedStyle(() => ({
    opacity: footer.value,
    transform: [{ translateY: interpolate(footer.value, [0, 1], [16, 0]) }],
  }));

  const getStarted = () => {
    completeOnboarding();
    router.replace("/sign-in");
  };

  return (
    <View style={styles.container}>
      {/* Resting layout — fixed positions, fades in beneath the overlay. */}
      <View
        style={[
          styles.content,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 16 },
        ]}
      >
        <Animated.View style={[styles.header, headerStyle]}>
          <EcoImage name="zeroWaste" size={64} />
          <Text style={styles.headerWordmark}>glean</Text>
        </Animated.View>

        <View style={styles.points}>
          <AnimatedPoint point={POINTS[0]} progress={point0} />
          <AnimatedPoint point={POINTS[1]} progress={point1} />
          <AnimatedPoint point={POINTS[2]} progress={point2} />
        </View>

        <Animated.View style={[styles.footer, footerStyle]}>
          <Button
            label="Get started"
            onPress={getStarted}
            fullWidth
            icon={<ArrowRight color={Colors.white} size={18} />}
          />
        </Animated.View>
      </View>

      {/* Intro overlay — big centered hero, crossfades away. */}
      <Animated.View
        style={[styles.overlay, overlayStyle]}
        pointerEvents="none"
      >
        <Animated.View style={introArtStyle}>
          <EcoImage name="zeroWaste" size={132} />
        </Animated.View>
        <Animated.Text style={[styles.introWordmark, introWordStyle]}>
          glean
        </Animated.Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.paper,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  headerWordmark: {
    fontFamily: Fonts.script,
    fontSize: 56,
    lineHeight: 64,
    color: Colors.skyDeep,
    marginTop: 8,
  },
  points: {
    flex: 1,
    justifyContent: "center",
    gap: 28,
  },
  point: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },
  pointText: { flex: 1 },
  pointTitle: {
    fontFamily: Fonts.serifBold,
    fontSize: 17,
    color: Colors.charcoal,
  },
  pointBody: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.slate,
    lineHeight: 20,
    marginTop: 2,
  },
  footer: {
    paddingTop: 8,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: Colors.paper,
  },
  introWordmark: {
    fontFamily: Fonts.script,
    fontSize: 96,
    lineHeight: 108,
    color: Colors.skyDeep,
    marginTop: 20,
  },
});
