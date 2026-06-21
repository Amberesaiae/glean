import { router } from "expo-router";
import { Repeat } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

import { PressableScale } from "@/components/ui";
import Colors from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { useApp } from "@/providers/AppProvider";
import type { Listing } from "@/types";
import { frequencyLabel } from "@/utils/clusters";

/** One supplier line inside a cluster sheet, linking to its full listing. */
export function SupplierRow({
  listing,
  onNavigate,
}: {
  listing: Listing;
  onNavigate: () => void;
}) {
  const { getProfile } = useApp();
  const author = getProfile(listing.authorId);
  const freq = frequencyLabel(listing.recurring, listing.frequency);
  return (
    <PressableScale
      onPress={() => {
        onNavigate();
        router.push(`/listing/${listing.id}`);
      }}
      style={styles.supplierRow}
    >
      <View style={styles.flex1}>
        <View style={styles.supplierTop}>
          <Text style={styles.supplierName} numberOfLines={1}>
            {author?.name ?? "Vendor"}
          </Text>
          {freq ? (
            <View style={styles.regularChip}>
              <Repeat color={Colors.success} size={11} />
              <Text style={styles.regularChipText}>{freq}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.supplierMeta} numberOfLines={1}>
          {listing.title}
        </Text>
      </View>
      <View style={styles.supplierQtyBox}>
        <Text style={styles.supplierQty}>
          {listing.quantity}
          {listing.unit}
        </Text>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  supplierRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.line,
    padding: 12,
    marginBottom: 10,
  },
  supplierTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  supplierName: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 14.5,
    color: Colors.charcoal,
    flexShrink: 1,
  },
  supplierMeta: {
    fontFamily: Fonts.sans,
    fontSize: 12.5,
    color: Colors.slate,
    marginTop: 2,
  },
  supplierQtyBox: {
    backgroundColor: Colors.skySoft,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  supplierQty: { fontFamily: Fonts.monoBold, fontSize: 14, color: Colors.skyDeep },
  regularChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Colors.successSoft,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
  },
  regularChipText: { fontFamily: Fonts.sansBold, fontSize: 10.5, color: Colors.success },
  flex1: { flex: 1 },
});
