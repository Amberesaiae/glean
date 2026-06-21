import React, { useCallback, useRef } from "react";
import { Animated, Pressable, StyleProp, ViewStyle } from "react-native";
import { haptic } from "./haptic";

interface PressableScaleProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  hapticStyle?: "light" | "medium" | "success";
  disabled?: boolean;
  hitSlop?: number;
}

export function PressableScale({
  children,
  onPress,
  style,
  containerStyle,
  hapticStyle = "light",
  disabled,
  hitSlop,
}: PressableScaleProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handleIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [scale]);

  const handleOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 6,
    }).start();
  }, [scale]);

  const handlePress = useCallback(() => {
    if (disabled) return;
    haptic(hapticStyle);
    onPress?.();
  }, [disabled, hapticStyle, onPress]);

  return (
    <Pressable
      onPressIn={handleIn}
      onPressOut={handleOut}
      onPress={handlePress}
      disabled={disabled}
      hitSlop={hitSlop}
      style={containerStyle}
    >
      <Animated.View style={[{ transform: [{ scale }] }, style]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
