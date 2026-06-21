import { router } from "expo-router";
import { Leaf, Repeat } from "lucide-react-native";
import React, { useEffect, useMemo, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { EcoImage } from "@/components/illustrations";
import { MaterialTag, PressableScale, Segmented, type SegmentOption } from "@/components/ui";
import Colors, { MATERIALS, MaterialKey } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { ROLES } from "@/constants/roles";
import type { Deal, FeedPost, Listing, SupplyFrequency, UserProfile } from "@/types";
import { frequencyLabel } from "@/utils/clusters";
import { groupNumber, timeAgo } from "@/utils/format";

/** Auto-generated "Regularly supplies" chips, derived from a member's recurring
 * listings. One chip per material, labelled with its most frequent cadence. */
export function RegularlySupplies({ listings }: { listings: Listing[] }) {
  const recurring = listings.filter((l) => l.recurring);
  if (recurring.length === 0) return null;

  const byMaterial = new Map<MaterialKey, SupplyFrequency | undefined>();
  for (const l of recurring) {
    if (!byMaterial.has(l.material)) byMaterial.set(l.material, l.frequency);
  }

  return (
    <View style={styles.suppliesWrap}>
      {[...byMaterial.entries()].map(([material, freq]) => (
        <View key={material} style={styles.supplyChip}>
          <Repeat color={Colors.success} size={13} />
          <Text style={styles.supplyChipText}>{MATERIALS[material].label}</Text>
          <Text style={styles.supplyChipFreq}>
            {frequencyLabel(true, freq) ?? "Regular"}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** Small labeled chip showing a member's role with its accent + illustration. */
export function RoleBadge({ role }: { role: UserProfile["role"] }) {
  const r = ROLES[role] ?? ROLES.collector;
  return (
    <View style={getRoleBadgeStyle(r.soft)}>
      <EcoImage name={r.illustration} size={16} />
      <Text style={getRoleTextStyle(r.color)}>{r.label}</Text>
    </View>
  );
}

/** Convert a deal's quantity to a kg-equivalent. Non-weight units don't count. */
function kgEquivalent(quantity: number, unit: string): number {
  if (unit === "tons") return quantity * 1000;
  if (unit === "kg") return quantity;
  return 0;
}

/** Real monthly kg-moved series built from a member's CONFIRMED deals over the
 * last `months`. Returns null when there's no confirmed weight to plot, so the
 * caller can fall back to a representative shape. */
function realImpactSeries(
  deals: Deal[],
  months: number = 6,
): { series: number[]; labels: string[] } | null {
  const confirmed = deals.filter((d) => d.status === "confirmed");
  if (confirmed.length === 0) return null;

  const now = new Date();
  const series = new Array<number>(months).fill(0);
  const labels: string[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(MONTH_LABELS[dt.getMonth()]);
  }

  for (const d of confirmed) {
    const ts = d.confirmedAt ?? d.createdAt;
    const dt = new Date(ts);
    const diff =
      (now.getFullYear() - dt.getFullYear()) * 12 + (now.getMonth() - dt.getMonth());
    if (diff < 0 || diff >= months) continue;
    series[months - 1 - diff] += kgEquivalent(d.quantity, d.unit);
  }

  if (series.reduce((s, v) => s + v, 0) <= 0) return null;
  return { series, labels };
}

/** Deterministic monthly throughput series that builds toward the total. */
function impactSeries(totalKg: number, months: number = 6): number[] {
  const weights: number[] = [];
  let sum = 0;
  for (let i = 0; i < months; i++) {
    // Gentle upward ramp with a stable pseudo-random wobble.
    const ramp = 0.6 + (i / (months - 1)) * 0.8;
    const wobble = 0.85 + ((Math.sin(i * 12.9898 + totalKg) + 1) / 2) * 0.3;
    const w = ramp * wobble;
    weights.push(w);
    sum += w;
  }
  return weights.map((w) => Math.round((w / sum) * totalKg));
}

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Fixed pixel height of the bar chart plotting area. */
const CHART_HEIGHT = 120;

function recentMonths(count: number): string[] {
  const now = new Date().getMonth();
  const out: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    out.push(MONTH_LABELS[(now - i + 12) % 12]);
  }
  return out;
}

/** Animated "Your Impact" card with a bar chart of kg diverted over time.
 * When `deals` is supplied, the chart is built from real confirmed deals;
 * otherwise it falls back to a representative shape derived from the total. */
export function ImpactChart({
  profile,
  deals,
}: {
  profile: UserProfile;
  deals?: Deal[];
}) {
  const role = ROLES[profile.role] ?? ROLES.collector;
  const total = profile.stats.materialsMovedKg;
  const data = useMemo(
    () => buildImpactData(total, deals),
    [deals, total],
  );

  return (
    <View style={getImpactCardStyle(role.soft)}>
      <View style={styles.impactLeaf} pointerEvents="none">
        <Leaf color={role.color} size={120} strokeWidth={1} />
      </View>

      <ImpactHeader total={total} verb={role.impactVerb} color={role.color} />
      <ImpactBars series={data.series} max={data.max} color={role.color} />
      <ImpactLabels labels={data.labels} />
      <ImpactFootnote co2={data.co2} color={role.color} />
    </View>
  );
}

function getRoleBadgeStyle(backgroundColor: string) {
  return [styles.roleBadge, { backgroundColor }];
}

function getRoleTextStyle(color: string) {
  return [styles.roleText, { color }];
}

function getImpactCardStyle(backgroundColor: string) {
  return [styles.impactCard, { backgroundColor }];
}

function buildImpactData(totalKg: number, deals?: Deal[]) {
  const real = deals ? realImpactSeries(deals) : null;
  const series = real?.series ?? impactSeries(totalKg);
  return {
    series,
    labels: real?.labels ?? recentMonths(series.length),
    max: Math.max(...series, 1),
    co2: Math.round(totalKg * 1.5),
  };
}

function ImpactHeader({
  total,
  verb,
  color,
}: {
  total: number;
  verb: string;
  color: string;
}) {
  return (
    <>
      <Text style={styles.impactKicker}>YOUR IMPACT</Text>
      <View style={styles.impactHeadlineRow}>
        <Text style={[styles.impactNumber, { color }]}>
          {groupNumber(total)}
        </Text>
        <Text style={styles.impactUnit}>kg</Text>
      </View>
      <Text style={styles.impactVerb}>{verb}</Text>
    </>
  );
}

function ImpactBars({
  series,
  max,
  color,
}: {
  series: number[];
  max: number;
  color: string;
}) {
  return (
    <View style={styles.chartWrap}>
      {series.map((v, i) => (
        <ImpactBar
          key={`bar-${i}`}
          height={Math.max(8, Math.round((v / max) * CHART_HEIGHT))}
          color={color}
          delay={i * 110}
        />
      ))}
    </View>
  );
}

function ImpactLabels({ labels }: { labels: string[] }) {
  return (
    <View style={styles.chartLabels}>
      {labels.map((l, i) => (
        <Text key={`${l}-${i}`} style={styles.chartLabel}>
          {l}
        </Text>
      ))}
    </View>
  );
}

function ImpactFootnote({ co2, color }: { co2: number; color: string }) {
  return (
    <View style={styles.co2Row}>
      <Leaf color={color} size={14} />
      <Text style={styles.co2Text}>
        Equivalent to ~{groupNumber(co2)} kg CO₂ not emitted
      </Text>
    </View>
  );
}

/** A single chart bar that grows to its target pixel height on mount. */
function ImpactBar({
  height,
  color,
  delay,
}: {
  height: number;
  color: string;
  delay: number;
}) {
  const anim = useRef(new Animated.Value(6)).current;

  useEffect(() => {
    const animation = Animated.timing(anim, {
      toValue: height,
      duration: 700,
      delay,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [anim, delay, height]);

  return (
    <View style={styles.barTrack}>
      <Animated.View
        style={[styles.bar, { height: anim, backgroundColor: color }]}
      />
    </View>
  );
}

export type ProfileTab = "listings" | "posts" | "saved";

/** Profile tab switcher — uses the shared Segmented control for consistency. */
export function ProfileTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: ProfileTab; label: string }[];
  active: ProfileTab;
  onChange: (key: ProfileTab) => void;
}) {
  const options: SegmentOption<ProfileTab>[] = tabs.map((t) => ({
    key: t.key,
    label: t.label,
  }));
  return <Segmented options={options} value={active} onChange={onChange} />;
}

/** Compact row for a have/need listing. */
export function ListingRow({ listing }: { listing: Listing }) {
  return (
    <PressableScale
      onPress={() => router.push(`/listing/${listing.id}`)}
      style={styles.listingRow}
    >
      <View
        style={[
          styles.kindDot,
          {
            backgroundColor:
              listing.kind === "have" ? Colors.success : Colors.amber,
          },
        ]}
      />
      <View style={styles.flex1}>
        <Text style={styles.listingTitle} numberOfLines={1}>
          {listing.title}
        </Text>
        <Text style={styles.listingMeta}>
          {listing.quantity}
          {listing.unit} · {listing.area} · {timeAgo(listing.createdAt)}
        </Text>
      </View>
      <MaterialTag material={listing.material} small />
    </PressableScale>
  );
}

/** Compact card showing a community post. */
export function PostRow({ post }: { post: FeedPost }) {
  return (
    <View style={styles.postRow}>
      {post.material ? (
        <View style={styles.postRowTagRow}>
          <MaterialTag material={post.material} small />
          <Text style={styles.postRowTime}>{timeAgo(post.createdAt)}</Text>
        </View>
      ) : (
        <Text style={[styles.postRowTime, { marginBottom: 6 }]}>
          {timeAgo(post.createdAt)}
        </Text>
      )}
      <Text style={styles.postRowText} numberOfLines={4}>
        {post.text}
      </Text>
      <Text style={styles.postRowStats}>
        {post.likes} likes · {post.comments.length} comments
      </Text>
    </View>
  );
}

/** Empty state for a profile tab, using an eco illustration. */
export function TabEmpty({ text }: { text: string }) {
  return (
    <View style={styles.tabEmpty}>
      <EcoImage name="reduce" size={72} style={styles.emptyArtMuted} />
      <Text style={styles.tabEmptyText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 18,
  },
  roleText: { fontFamily: Fonts.sansBold, fontSize: 12.5 },
  impactCard: {
    borderRadius: 20,
    padding: 18,
    overflow: "hidden",
  },
  impactLeaf: {
    position: "absolute",
    right: -24,
    top: -18,
    opacity: 0.12,
    transform: [{ rotate: "18deg" }],
  },
  impactKicker: {
    fontFamily: Fonts.monoBold,
    fontSize: 11,
    letterSpacing: 1,
    color: Colors.slate,
  },
  impactHeadlineRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
    marginTop: 6,
  },
  impactNumber: { fontFamily: Fonts.serifBold, fontSize: 40, lineHeight: 44 },
  impactUnit: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 16,
    color: Colors.slate,
    marginBottom: 6,
  },
  impactVerb: {
    fontFamily: Fonts.sansMedium,
    fontSize: 14,
    color: Colors.ink,
    marginTop: 2,
  },
  chartWrap: {
    height: CHART_HEIGHT,
    marginTop: 12,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  barTrack: { flex: 1, justifyContent: "flex-end" },
  bar: { width: "100%", borderRadius: 6, minHeight: 6, opacity: 0.9 },
  chartLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  chartLabel: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.mist },
  co2Row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 14,
  },
  co2Text: { fontFamily: Fonts.sansMedium, fontSize: 12.5, color: Colors.slate },
  listingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.line,
    marginBottom: 10,
  },
  kindDot: { width: 10, height: 10, borderRadius: 5 },
  listingTitle: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 14.5,
    color: Colors.charcoal,
  },
  listingMeta: {
    fontFamily: Fonts.sans,
    fontSize: 12.5,
    color: Colors.slate,
    marginTop: 2,
  },
  postRow: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.line,
    marginBottom: 10,
  },
  postRowTagRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  postRowTime: { fontFamily: Fonts.mono, fontSize: 11, color: Colors.mist },
  postRowText: {
    fontFamily: Fonts.sans,
    fontSize: 14.5,
    lineHeight: 21,
    color: Colors.ink,
  },
  postRowStats: {
    fontFamily: Fonts.mono,
    fontSize: 11.5,
    color: Colors.mist,
    marginTop: 10,
  },
  suppliesWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  supplyChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.successSoft,
    paddingLeft: 10,
    paddingRight: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  supplyChipText: { fontFamily: Fonts.sansSemibold, fontSize: 13, color: Colors.success },
  supplyChipFreq: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.success,
    opacity: 0.8,
  },
  tabEmpty: { alignItems: "center", paddingVertical: 44, gap: 12 },
  tabEmptyText: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.slate,
    textAlign: "center",
    paddingHorizontal: 24,
    lineHeight: 20,
  },
  flex1: { flex: 1 },
  emptyArtMuted: { opacity: 0.9 },
});
