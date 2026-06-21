import * as Location from "expo-location";
import { Crosshair, MapPin, X } from "lucide-react-native";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  GestureResponderEvent,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { PressableScale, haptic } from "@/components/ui";
import Colors from "@/constants/colors";
import { Fonts } from "@/constants/fonts";

export interface Coord {
  lat: number;
  lng: number;
}

/** Total span (in degrees) the mini-map window covers — ~2km square. */
const WINDOW_DEG = 0.02;

interface Props {
  value: Coord | undefined;
  onChange: (value: Coord | undefined) => void;
}

/** Optional location attach + tap-to-nudge pin on a lightweight stylized map.
 * Avoids native map modules so it works everywhere, including Expo Go and web. */
export function LocationPicker({ value, onChange }: Props) {
  const [requesting, setRequesting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [base, setBase] = useState<Coord | null>(value ?? null);
  const sizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });

  const locate = useCallback(async () => {
    setError(null);
    setRequesting(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Location permission denied. You can still post without a pin.");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coord: Coord = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      };
      haptic("success");
      setBase(coord);
      onChange(coord);
    } catch {
      setError("Couldn't get your location. Try again or post without a pin.");
    } finally {
      setRequesting(false);
    }
  }, [onChange]);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    sizeRef.current = {
      w: e.nativeEvent.layout.width,
      h: e.nativeEvent.layout.height,
    };
  }, []);

  const onMapPress = useCallback(
    (e: GestureResponderEvent) => {
      if (!base) return;
      const { w, h } = sizeRef.current;
      if (w === 0 || h === 0) return;
      const { locationX, locationY } = e.nativeEvent;
      const fx = Math.min(1, Math.max(0, locationX / w));
      const fy = Math.min(1, Math.max(0, locationY / h));
      const lng = base.lng - WINDOW_DEG / 2 + fx * WINDOW_DEG;
      const lat = base.lat + WINDOW_DEG / 2 - fy * WINDOW_DEG;
      haptic("light");
      onChange({ lat, lng });
    },
    [base, onChange],
  );

  const clear = useCallback(() => {
    haptic("light");
    setBase(null);
    onChange(undefined);
  }, [onChange]);

  if (!value || !base) {
    return (
      <View>
        <PressableScale onPress={locate} disabled={requesting} style={styles.cta}>
          {requesting ? (
            <ActivityIndicator color={Colors.sky} />
          ) : (
            <Crosshair color={Colors.sky} size={18} />
          )}
          <Text style={styles.ctaText}>
            {requesting ? "Locating…" : "Use my current location"}
          </Text>
        </PressableScale>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    );
  }

  // Pin position within the fixed window centred on `base`.
  const fx = (value.lng - (base.lng - WINDOW_DEG / 2)) / WINDOW_DEG;
  const fy = (base.lat + WINDOW_DEG / 2 - value.lat) / WINDOW_DEG;

  return (
    <View>
      <Pressable onPress={onMapPress} onLayout={onLayout} style={styles.map}>
        {GRID.map((g) => (
          <View
            key={`v${g}`}
            style={[styles.gridV, { left: `${g}%` }]}
            pointerEvents="none"
          />
        ))}
        {GRID.map((g) => (
          <View
            key={`h${g}`}
            style={[styles.gridH, { top: `${g}%` }]}
            pointerEvents="none"
          />
        ))}
        <View
          style={[
            styles.pin,
            {
              left: `${Math.min(96, Math.max(4, fx * 100))}%`,
              top: `${Math.min(92, Math.max(8, fy * 100))}%`,
            },
          ]}
          pointerEvents="none"
        >
          <MapPin color={Colors.sky} size={30} fill={Colors.skySoft} strokeWidth={2.4} />
        </View>
      </Pressable>
      <View style={styles.footer}>
        <Text style={styles.coords}>
          Pinned · {value.lat.toFixed(4)}, {value.lng.toFixed(4)} — tap the map to adjust
        </Text>
        <PressableScale onPress={clear} hitSlop={8} style={styles.removeBtn}>
          <X color={Colors.slate} size={14} />
          <Text style={styles.removeText}>Remove</Text>
        </PressableScale>
      </View>
    </View>
  );
}

const GRID = [25, 50, 75];

const styles = StyleSheet.create({
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.skySoft,
    borderWidth: 1.5,
    borderColor: "#CFE3F9",
  },
  ctaText: { fontFamily: Fonts.sansSemibold, fontSize: 14.5, color: Colors.skyDeep },
  error: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12.5,
    color: Colors.danger,
    marginTop: 8,
    lineHeight: 18,
  },
  map: {
    height: 168,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#E9F1E4",
    borderWidth: 1.5,
    borderColor: Colors.line,
  },
  gridV: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "rgba(46,158,91,0.16)",
  },
  gridH: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(46,158,91,0.16)",
  },
  pin: {
    position: "absolute",
    marginLeft: -15,
    marginTop: -28,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    gap: 12,
  },
  coords: {
    flex: 1,
    fontFamily: Fonts.mono,
    fontSize: 11.5,
    color: Colors.slate,
  },
  removeBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  removeText: { fontFamily: Fonts.sansSemibold, fontSize: 12.5, color: Colors.slate },
});
