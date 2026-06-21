import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { CheckCircle2, Calendar, Download, MapPin, MessageCircle, Pencil, Repeat, Share2, Trash2 } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";

import { FormFooter } from "@/components/form-footer";
import {
  Avatar,
  Button,
  Card,
  DetailSkeleton,
  MaterialTag,
  PressableScale,
  SaveButton,
  Text,
  VerifiedBadge,
  haptic,
} from "@/components/ui";
import { MaterialIcon } from "@/components/illustrations";
import Colors, { MATERIALS } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { radius, spacing } from "@/constants/theme";
import { saveImageToGallery, shareText } from "@/lib/device";
import { useApp } from "@/providers/AppProvider";
import { useAuth } from "@/providers/AuthProvider";
import { frequencyLabel } from "@/utils/clusters";
import { formatEventDate, convertToKg } from "@/utils/format";
import type { Listing, UserProfile } from "@/types";

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId } = useAuth();
  const {
    listings,
    liveListings,
    getProfile,
    ensureConversation,
    savedListingIds,
    toggleSaveListing,
    setListingStatus,
    deleteListing,
    loading,
  } = useApp();
  const [savingPhoto, setSavingPhoto] = useState<boolean>(false);

  const listing = listings.find((l) => l.id === id);
  const isHave = listing ? listing.kind === "have" : false;

  // For a sourcing request, find matching supply in the same region/material.
  const matches = useMemo<Listing[]>(() => {
    if (!listing || isHave) return [];
    return liveListings
      .filter(
        (l) =>
          l.kind === "have" &&
          l.material === listing.material &&
          l.region === listing.region,
      )
      .sort((a, b) => Number(b.recurring) - Number(a.recurring));
  }, [liveListings, listing, isHave]);

  const availableKg = useMemo(
    () => matches.reduce((s, l) => s + convertToKg(l.quantity, l.unit), 0),
    [matches],
  );

  if (!listing && loading) {
    return <DetailSkeleton />;
  }

  if (!listing) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>Listing not found.</Text>
      </View>
    );
  }

  const author = getProfile(listing.authorId);
  const isMine = listing.authorId === userId;
  const freq = frequencyLabel(listing.recurring, listing.frequency);
  const targetKg = convertToKg(listing.quantity, listing.unit);

  const handleShare = () => {
    if (!listing) return;
    const verb = listing.kind === "have" ? "Offering" : "Looking for";
    shareText(
      `${verb}: ${listing.title} — ${listing.quantity}${listing.unit} of ${MATERIALS[listing.material].label} in ${listing.area}, ${listing.region}. Found on Glean.`,
    );
  };

  const handleSavePhoto = async () => {
    if (!listing.photo || savingPhoto) return;
    setSavingPhoto(true);
    const result = await saveImageToGallery(listing.photo);
    setSavingPhoto(false);
    if (result.ok) haptic("success");
    Alert.alert(
      result.ok ? "Saved to gallery" : "Couldn't save",
      result.ok ? "The photo is now in your camera roll." : result.message ?? "Try again.",
    );
  };

  const handleContact = async () => {
    if (!author) return;
    const convId = await ensureConversation(author.id, listing.id);
    router.push(`/chat/${convId}`);
  };

  const isFulfilled = listing.status === "fulfilled";

  const confirmDelete = () => {
    Alert.alert("Delete listing?", "This permanently removes the listing.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteListing(listing.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ListingHero listing={listing} onSavePhoto={handleSavePhoto} />
        <ListingBody
          listing={listing}
          isHave={isHave}
          freq={freq}
          isFulfilled={isFulfilled}
          targetKg={targetKg}
          availableKg={availableKg}
          matches={matches}
          author={author}
          saved={savedListingIds.includes(listing.id)}
          onShare={handleShare}
          onToggleSave={() => toggleSaveListing(listing.id)}
        />
      </ScrollView>

      {!isMine && author ? (
        <FormFooter style={styles.footer}>
          <Button
            label={`Message ${author.name.split(" ")[0]}`}
            onPress={handleContact}
            icon={<MessageCircle color={Colors.white} size={18} />}
          />
        </FormFooter>
      ) : isMine ? (
        <FormFooter style={styles.footer}>
          <View style={styles.ownerActions}>
            <PressableScale
              onPress={() =>
                setListingStatus(listing.id, isFulfilled ? "active" : "fulfilled")
              }
              style={[styles.ownerBtn, styles.ownerBtnPrimary]}
            >
              <CheckCircle2 color={Colors.white} size={17} />
              <Text style={styles.ownerBtnPrimaryText}>
                {isFulfilled ? "Reactivate" : "Mark fulfilled"}
              </Text>
            </PressableScale>
            <PressableScale
              onPress={() => router.push(`/post-listing?id=${listing.id}`)}
              style={styles.ownerBtn}
            >
              <Pencil color={Colors.slate} size={17} />
            </PressableScale>
            <PressableScale onPress={confirmDelete} style={styles.ownerBtn}>
              <Trash2 color={Colors.danger} size={17} />
            </PressableScale>
          </View>
        </FormFooter>
      ) : null}
    </View>
  );
}

function ListingHero({
  listing,
  onSavePhoto,
}: {
  listing: Listing;
  onSavePhoto: () => void;
}) {
  return listing.photo ? (
    <View>
      <Image source={{ uri: listing.photo }} style={styles.hero} contentFit="cover" transition={250} />
      <PressableScale onPress={onSavePhoto} style={styles.savePhotoBtn} hapticStyle="medium">
        <Download color={Colors.white} size={18} />
      </PressableScale>
    </View>
  ) : (
    <View style={[styles.hero, styles.heroPlaceholder]}>
      <MaterialIcon material={listing.material} size={104} radius={26} />
    </View>
  );
}

function ListingBody({
  listing,
  isHave,
  freq,
  isFulfilled,
  targetKg,
  availableKg,
  matches,
  author,
  saved,
  onShare,
  onToggleSave,
}: {
  listing: Listing;
  isHave: boolean;
  freq: string | null;
  isFulfilled: boolean;
  targetKg: number;
  availableKg: number;
  matches: Listing[];
  author: UserProfile | undefined;
  saved: boolean;
  onShare: () => void;
  onToggleSave: () => void;
}) {
  return (
    <View style={styles.body}>
      <ListingHeader
        listing={listing}
        isHave={isHave}
        saved={saved}
        onShare={onShare}
        onToggleSave={onToggleSave}
      />
      {isFulfilled ? (
        <View style={styles.fulfilledRow}>
          <CheckCircle2 color={Colors.slate} size={14} />
          <Text style={styles.fulfilledText}>Fulfilled · no longer in live discovery</Text>
        </View>
      ) : null}
      {freq ? <ListingFrequency freq={freq} /> : null}
      <Text style={styles.title}>{listing.title}</Text>
      <ListingStats listing={listing} />
      <ListingMetadata listing={listing} />
      <Text style={styles.sectionLabel}>Description</Text>
      <Text style={styles.description}>{listing.description}</Text>
      {!isHave && matches.length > 0 ? (
        <NearbySupplyPanel
          listing={listing}
          matches={matches}
          targetKg={targetKg}
          availableKg={availableKg}
        />
      ) : null}
      {author ? <ListingAuthor author={author} /> : null}
    </View>
  );
}

function ListingHeader({
  listing,
  isHave,
  saved,
  onShare,
  onToggleSave,
}: {
  listing: Listing;
  isHave: boolean;
  saved: boolean;
  onShare: () => void;
  onToggleSave: () => void;
}) {
  return (
    <View style={styles.rowBetween}>
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
          {isHave ? "HAVE · OFFERING" : "NEED · LOOKING FOR"}
        </Text>
      </View>
      <View style={styles.headerRight}>
        <MaterialTag material={listing.material} small />
        <PressableScale onPress={onShare} hitSlop={10} hapticStyle="light">
          <Share2 color={Colors.slate} size={20} />
        </PressableScale>
        <SaveButton saved={saved} onPress={onToggleSave} />
      </View>
    </View>
  );
}

function ListingFrequency({ freq }: { freq: string }) {
  return (
    <View style={styles.regularRow}>
      <View style={styles.regularBadge}>
        <Repeat color={Colors.success} size={13} />
        <Text style={styles.regularBadgeText}>Regular supplier · {freq}</Text>
      </View>
    </View>
  );
}

function ListingStats({ listing }: { listing: Listing }) {
  return (
    <View style={styles.statsRow}>
      <View style={styles.statBox}>
        <Text style={styles.statValue}>
          {listing.quantity}
          <Text style={styles.statUnit}> {listing.unit}</Text>
        </Text>
        <Text style={styles.statLabel}>Quantity</Text>
      </View>
      {listing.pricePerUnit ? (
        <View style={styles.statBox}>
          <Text style={styles.statValue}>₵{listing.pricePerUnit.toFixed(2)}</Text>
          <Text style={styles.statLabel}>per {listing.unit}</Text>
        </View>
      ) : null}
    </View>
  );
}

function ListingMetadata({ listing }: { listing: Listing }) {
  return (
    <>
      <View style={styles.metaRow}>
        <MapPin color={Colors.slate} size={16} />
        <Text style={styles.metaText}>
          {listing.area}, {listing.region}
        </Text>
      </View>
      <View style={styles.metaRow}>
        <Calendar color={Colors.slate} size={16} />
        <Text style={styles.metaText}>Posted {formatEventDate(listing.createdAt)}</Text>
      </View>
    </>
  );
}

function NearbySupplyPanel({
  listing,
  matches,
  targetKg,
  availableKg,
}: {
  listing: Listing;
  matches: Listing[];
  targetKg: number;
  availableKg: number;
}) {
  return (
    <View style={styles.nearbyCard}>
      <Text style={styles.nearbyTitle}>Available nearby</Text>
      <Text style={styles.nearbySub}>
        {matches.length} {matches.length === 1 ? "supplier" : "suppliers"} of{" "}
        {listing.material} in {listing.region}
      </Text>
      {targetKg > 0 ? (
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.max(4, (availableKg / targetKg) * 100)}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {availableKg}kg available toward {targetKg}kg needed
          </Text>
        </View>
      ) : null}
      <View style={styles.supplierList}>
        {matches.map((m) => (
          <NearbySupplier key={m.id} listing={m} />
        ))}
      </View>
    </View>
  );
}

function ListingAuthor({ author }: { author: UserProfile }) {
  return (
    <>
      <Text style={styles.sectionLabel}>Posted by</Text>
      <Card onPress={() => router.push(`/profile/${author.id}`)} padded={false} style={styles.authorCard}>
        <Avatar uri={author.avatar} size={52} />
        <View style={styles.flex1}>
          <View style={styles.authorNameRow}>
            <Text style={styles.authorName}>{author.name}</Text>
            {author.verified ? <VerifiedBadge /> : null}
          </View>
          <Text style={styles.authorTrade}>
            {author.trade} · {author.region}
          </Text>
        </View>
      </Card>
    </>
  );
}

function NearbySupplier({ listing }: { listing: Listing }) {
  const { getProfile } = useApp();
  const author = getProfile(listing.authorId);
  const freq = frequencyLabel(listing.recurring, listing.frequency);
  return (
    <PressableScale
      onPress={() => router.push(`/listing/${listing.id}`)}
      style={styles.supplierRow}
    >
        <View style={styles.flex1}>
        <View style={styles.supplierTop}>
          <Text style={styles.supplierName} numberOfLines={1}>
            {author?.name ?? "Vendor"}
          </Text>
          {freq ? (
            <View style={styles.miniRegular}>
              <Repeat color={Colors.success} size={10} />
              <Text style={styles.miniRegularText}>{freq}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.supplierMeta} numberOfLines={1}>
          {listing.area} · {listing.title}
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
  container: { flex: 1, backgroundColor: Colors.paper },
  missing: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.paper,
  },
  missingText: { fontFamily: Fonts.sans, color: Colors.slate },
  hero: {
    width: "100%",
    height: 280,
    backgroundColor: Colors.cardAlt,
  },
  heroPlaceholder: { alignItems: "center", justifyContent: "center" },
  savePhotoBtn: {
    position: "absolute",
    bottom: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: { paddingBottom: 132 },
  body: { padding: 20, gap: 8 },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  kindPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 7 },
  kindText: {
    fontFamily: Fonts.monoBold,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  title: {
    fontFamily: Fonts.serifBold,
    fontSize: 26,
    color: Colors.charcoal,
    lineHeight: 32,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginVertical: 12,
  },
  statBox: {
    backgroundColor: Colors.skySoft,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    minWidth: 120,
  },
  statValue: {
    fontFamily: Fonts.monoBold,
    fontSize: 26,
    color: Colors.skyDeep,
  },
  statUnit: { fontFamily: Fonts.mono, fontSize: 16, color: Colors.sky },
  statLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    color: Colors.slate,
    marginTop: 2,
  },
  regularRow: { flexDirection: "row", marginTop: 10 },
  regularBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.successSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  regularBadgeText: { fontFamily: Fonts.sansBold, fontSize: 12.5, color: Colors.success },
  nearbyCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.line,
    padding: 16,
    marginTop: 18,
  },
  nearbyTitle: { fontFamily: Fonts.serif, fontSize: 18, color: Colors.charcoal },
  nearbySub: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.slate,
    marginTop: 2,
  },
  progressWrap: { marginTop: 14 },
  progressTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.cardAlt,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 5,
    backgroundColor: Colors.success,
  },
  progressText: {
    fontFamily: Fonts.monoBold,
    fontSize: 12.5,
    color: Colors.slate,
    marginTop: 8,
  },
  supplierList: { marginTop: 14, gap: 10 },
  supplierRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.paper,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.line,
    padding: 11,
  },
  supplierTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  supplierName: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 14,
    color: Colors.charcoal,
    flexShrink: 1,
  },
  supplierMeta: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.slate,
    marginTop: 2,
  },
  miniRegular: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Colors.successSoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  miniRegularText: { fontFamily: Fonts.sansBold, fontSize: 10, color: Colors.success },
  supplierQtyBox: {
    backgroundColor: Colors.skySoft,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  supplierQty: { fontFamily: Fonts.monoBold, fontSize: 13.5, color: Colors.skyDeep },
  flex1: { flex: 1 },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 2,
  },
  metaText: { fontFamily: Fonts.sans, fontSize: 14.5, color: Colors.ink },
  sectionLabel: {
    fontFamily: Fonts.sansBold,
    fontSize: 13,
    color: Colors.mist,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 4,
  },
  description: {
    fontFamily: Fonts.sans,
    fontSize: 15.5,
    lineHeight: 24,
    color: Colors.ink,
  },
  authorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.lg - 2,
    marginTop: spacing.xs,
  },
  authorNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  authorName: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 16,
    color: Colors.charcoal,
  },
  authorTrade: { fontFamily: Fonts.sans, fontSize: 13, color: Colors.slate },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  ownerActions: { flexDirection: "row", gap: 10 },
  ownerBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  ownerBtnPrimary: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  ownerBtnPrimaryText: {
    fontFamily: Fonts.sansBold,
    fontSize: 15,
    color: Colors.white,
  },
  fulfilledRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },
  fulfilledText: { fontFamily: Fonts.sansSemibold, fontSize: 12.5, color: Colors.slate },
});
