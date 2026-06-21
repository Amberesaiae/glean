import React, { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { ChevronDown, Check } from "lucide-react-native";
import Colors from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { radius, spacing } from "@/constants/theme";
import { PressableScale } from "./PressableScale";
import { Sheet } from "./Sheet";
import { Text } from "./Text";

export function SelectField<T extends string>({
  label,
  options,
  value,
  onChange,
  icon,
}: {
  label: string;
  options: { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
  icon?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const activeLabel = options.find((o) => o.key === value)?.label ?? "Select option";

  const choose = (key: T) => {
    onChange(key);
    setOpen(false);
  };

  return (
    <>
      <PressableScale onPress={() => setOpen(true)} style={styles.selectField}>
        <View style={styles.selectFieldInner}>
          {icon}
          <Text style={styles.selectValue} numberOfLines={1}>
            {activeLabel}
          </Text>
        </View>
        <ChevronDown color={Colors.slate} size={18} strokeWidth={2.2} />
      </PressableScale>

      <Sheet visible={open} onClose={() => setOpen(false)} title={`Choose ${label}`}>
        <ScrollView style={styles.selectList} showsVerticalScrollIndicator={false}>
          {options.map((opt) => {
            const selected = opt.key === value;
            return (
              <PressableScale
                key={opt.key}
                onPress={() => choose(opt.key)}
                containerStyle={{ marginBottom: spacing.xs }}
                style={[
                  styles.selectOption,
                  selected && { backgroundColor: Colors.skySoft },
                ]}
              >
                <Text
                  style={[
                    styles.selectOptionText,
                    selected && { color: Colors.skyDeep, fontFamily: Fonts.sansBold },
                  ]}
                >
                  {opt.label}
                </Text>
                {selected ? (
                  <Check color={Colors.skyDeep} size={17} strokeWidth={3} />
                ) : null}
              </PressableScale>
            );
          })}
        </ScrollView>
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  selectField: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 1,
  },
  selectFieldInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  selectValue: {
    fontFamily: Fonts.sansMedium,
    fontSize: 15,
    color: Colors.charcoal,
    flexShrink: 1,
  },
  selectList: { marginTop: spacing.xs },
  selectOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
  },
  selectOptionText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 15,
    color: Colors.charcoal,
  },
});
