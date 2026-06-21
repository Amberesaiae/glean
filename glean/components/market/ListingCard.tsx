import { Image } from "expo-image";
import { router } from "expo-router";
import { MapPin, Repeat } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

import { Card, MaterialTag } from "@/components/ui";
import Colors from "@/constants/colors";
import { pickMaterialPhoto } from "@/constants/photos";
import { Fonts } from "@/constants/fonts";
import { radius, spacing } from "@/constants/theme";
import { useApp } from "@/providers/AppProvider";
import type { Listing } from "@/types";
import { frequencyLabel } from "@/utils/clusters";
import { timeAgo } from "@/utils/format";

/** A single market listing row used in the home feed list. */
export function ListingCard({ listing }: { listing: Listing }) {
  const { getProfile } = useApp();
  const author = getProfile(listing.authorId);
  const isHave = listing.kind === "have";
  const freq = frequencyLabel(listing.recurring, listing.frequency);
  return (
    <Card onPress={() => router.push(`/listing/${listing.id}`)} padded={false} style={styles.card}>
      <View style={styles.cardRow}>
        <Image
          source={{ uri: listing.photo ?? pickMaterialPhoto(listing.material, listing.id) }}
          style={styles.cardImage}
          contentFit="cover"
          transition={200}
        />
        <View style={styles.cardBody}>
          <View style={styles.cardTopRow}>
            <View style={styles.cardPills}>
              <View
                style={[
                  styles.kindPill,
                  { backgroundColor: isHave ? Colors.successSoft : Colors.amberSoft },
                ]}
              >
                <Text
                  style={[
                    styles.kindText,
                    { color: isHave ? Colors.success : Colors.amberInk },
                  ]}
                >
                  {isHave ? "HAVE" : "NEED"}
                </Text>
              </View>
              {freq ? (
                <View style={styles.regularPill}>
                  <Repeat color={Colors.success} size={10} />
                  <Text style={styles.regularPillText}>{freq}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.cardTime}>{timeAgo(listing.createdAt)}</Text>
          </View>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {listing.title}
          </Text>
          <View style={styles.cardMetaRow}>
            <Text style={styles.cardQty}>
              {listing.quantity}
              {listing.unit}
            </Text>
            <View style={styles.cardLocation}>
              <MapPin color={Colors.mist} size={12} />
              <Text style={styles.cardArea} numberOfLines={1}>
                {listing.area}
              </Text>
            </View>
          </View>
          <View style={styles.cardFooter}>
            <MaterialTag material={listing.material} small />
            {author ? (
              <Text style={styles.cardAuthor} numberOfLines={1}>
                {author.name}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.md, borderRadius: radius.card },
  cardRow: { flexDirection: "row", gap: spacing.md },
  cardImage: {
    width: 96,
    height: 96,
    borderRadius: 12,
    backgroundColor: Colors.cardAlt,
  },
  cardImagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: { flex: 1, justifyContent: "space-between" },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardPills: { flexDirection: "row", alignItems: "center", gap: 6 },
  kindPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  kindText: {
    fontFamily: Fonts.monoBold,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  regularPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Colors.successSoft,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  regularPillText: {
    fontFamily: Fonts.sansBold,
    fontSize: 9.5,
    color: Colors.success,
    letterSpacing: 0.2,
  },
  cardTime: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.mist,
  },
  cardTitle: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 15,
    color: Colors.charcoal,
    marginVertical: 4,
    lineHeight: 20,
  },
  cardMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardQty: {
    fontFamily: Fonts.monoBold,
    fontSize: 15,
    color: Colors.skyDeep,
  },
  cardLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    flex: 1,
  },
  cardArea: {
    fontFamily: Fonts.sans,
    fontSize: 12.5,
    color: Colors.slate,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  cardAuthor: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    color: Colors.mist,
    flexShrink: 1,
    marginLeft: 8,
  },
});
