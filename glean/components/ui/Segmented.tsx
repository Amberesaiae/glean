import React from "react";
import { StyleSheet, View, Text as RNText, StyleProp, ViewStyle } from "react-native";
import Colors from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { PressableScale } from "./PressableScale";

export interface SegmentOption<T extends string> {
  key: T;
  label: string;
  /** Optional active text colour (e.g. green for Have, amber for Need). */
  tint?: string;
  /** Optional active pill background to pair with `tint`. */
  tintSoft?: string;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  style,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (key: T) => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.segmentTrack, style]}>
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <PressableScale
            key={opt.key}
            onPress={() => onChange(opt.key)}
            hapticStyle="light"
            containerStyle={styles.segmentItem}
            style={{ width: "100%" }}
          >
            <View
              style={[
                styles.segmentPill,
                active && styles.segmentPillActive,
                active && opt.tintSoft ? { backgroundColor: opt.tintSoft } : null,
              ]}
            >
              <RNText
                numberOfLines={1}
                style={[
                  styles.segmentLabel,
                  active && styles.segmentLabelActive,
                  active && opt.tint ? { color: opt.tint } : null,
                ]}
              >
                {opt.label}
              </RNText>
            </View>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  segmentTrack: {
    flexDirection: "row",
    backgroundColor: Colors.cardAlt,
    borderRadius: 14,
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  segmentItem: { flex: 1 },
  segmentPill: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
  },
  segmentPillActive: {
    backgroundColor: Colors.card,
    shadowColor: Colors.charcoal,
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  segmentLabel: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 14.5,
    color: Colors.slate,
  },
  segmentLabelActive: { color: Colors.charcoal, fontFamily: Fonts.sansBold },
});
