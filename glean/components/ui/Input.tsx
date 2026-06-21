import React from "react";
import { StyleSheet, TextInput, TextInputProps } from "react-native";
import Colors from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { radius, spacing } from "@/constants/theme";

interface InputProps extends TextInputProps {
  textarea?: boolean;
}

export function Input({ textarea, style, ...props }: InputProps) {
  return (
    <TextInput
      placeholderTextColor={Colors.mist}
      multiline={textarea}
      style={[
        styles.input,
        textarea && styles.inputTextarea,
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontFamily: Fonts.sans,
    fontSize: 15,
    color: Colors.charcoal,
  },
  inputTextarea: {
    minHeight: 110,
    paddingTop: spacing.md,
    textAlignVertical: "top",
  },
});
