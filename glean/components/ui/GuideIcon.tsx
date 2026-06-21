import React from "react";
import { Blocks, Flame, Handshake, Scale, Sprout, Recycle } from "lucide-react-native";
import Colors from "@/constants/colors";
import type { GuideIconKey } from "@/types";

const GUIDE_ICONS = {
  recycle: Recycle,
  flame: Flame,
  handshake: Handshake,
  scale: Scale,
  sprout: Sprout,
  blocks: Blocks,
} as const;

export function GuideIcon({
  icon,
  size = 26,
  color = Colors.sky,
}: {
  icon: GuideIconKey;
  size?: number;
  color?: string;
}) {
  const Ico = GUIDE_ICONS[icon];
  return <Ico color={color} size={size} strokeWidth={1.9} />;
}
