import { router, Stack, useLocalSearchParams } from "expo-router";
import { MessageCircle } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar, Button, Text, VerifiedBadge } from "@/components/ui";
import { Achievements } from "@/components/illustrations";
import {
  ImpactChart,
  ListingRow,
  PostRow,
  ProfileTab,
  ProfileTabs,
  RoleBadge,
  TabEmpty,
} from "@/components/profile";
import { AnchorBanner, AnchorCredibility } from "@/components/anchor";
import Colors from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { ROLES } from "@/constants/roles";
import { useApp } from "@/providers/AppProvider";
import { useAuth } from "@/providers/AuthProvider";
import { groupNumber } from "@/utils/format";

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();
  const { getProfile, listings, feed, deals, ensureConversation } = useApp();
  const profile = getProfile(id);
  const isMe = id === userId;

  const [tab, setTab] = useState<ProfileTab>("listings");

  const userListings = useMemo(
    () =>
      profile
        ? listings
            .filter((l) => l.authorId === profile.id)
            .sort((a, b) => b.createdAt - a.createdAt)
        : [],
    [listings, profile],
  );
  const userPosts = useMemo(
    () =>
      profile
        ? feed
            .filter((p) => p.authorId === profile.id && !p.flagged)
            .sort((a, b) => b.createdAt - a.createdAt)
        : [],
    [feed, profile],
  );

  if (!profile) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>Profile not found.</Text>
      </View>
    );
  }

  const role = ROLES[profile.role];

  const handleMessage = async () => {
    const convId = await ensureConversation(profile.id);
    router.push(`/chat/${convId}`);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: profile.name }} />
      <ScrollView
        contentContainerStyle={isMe ? styles.meContent : styles.otherContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={getCoverStyle(role.color)} />
        <View style={styles.avatarWrapTop}>
          <Avatar uri={profile.avatar} size={92} />
        </View>

        <View style={styles.identity}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{profile.name}</Text>
            {profile.verified ? <VerifiedBadge size={16} /> : null}
          </View>
          <Text style={styles.handle}>@{profile.handle}</Text>
          <View style={styles.badgeRow}>
            <RoleBadge role={profile.role} />
            <Text style={styles.region}>{profile.region}</Text>
          </View>
          <Text style={styles.bio}>{profile.bio}</Text>
          <Text style={styles.joined}>Joined {profile.joinedYear}</Text>
        </View>

        {role.isOrg ? (
          <View style={styles.section}>
            <AnchorBanner />
          </View>
        ) : null}

        <View style={styles.statsRow}>
          <Stat
            value={profile.stats.materialsMovedKg}
            label={role.statLabels[0]}
          />
          <View style={styles.statDivider} />
          <Stat value={profile.stats.deals} label={role.statLabels[1]} />
          <View style={styles.statDivider} />
          <Stat value={profile.stats.listings} label={role.statLabels[2]} />
        </View>

        <View style={styles.section}>
          <ImpactChart profile={profile} deals={isMe ? deals : undefined} />
        </View>

        <View style={styles.section}>
          {role.isOrg ? (
            <>
              <Text style={styles.sectionTitle}>Credibility</Text>
              <AnchorCredibility profile={profile} />
            </>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Achievements</Text>
              <Achievements stats={profile.stats} />
            </>
          )}
        </View>

        <View style={[styles.section, { marginTop: 26 }]}>
          <ProfileTabs
            tabs={[
              { key: "listings", label: "Listings" },
              { key: "posts", label: "Posts" },
            ]}
            active={tab === "saved" ? "listings" : tab}
            onChange={setTab}
          />
          <View style={styles.tabBody}>
            {tab === "posts" ? (
              userPosts.length === 0 ? (
                <TabEmpty text="No posts yet." />
              ) : (
                userPosts.map((p) => <PostRow key={p.id} post={p} />)
              )
            ) : userListings.length === 0 ? (
              <TabEmpty text="No active listings." />
            ) : (
              userListings.map((l) => <ListingRow key={l.id} listing={l} />)
            )}
          </View>
        </View>
      </ScrollView>

      {!isMe ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <Button
            label={`Message ${profile.name.split(" ")[0]}`}
            onPress={handleMessage}
            icon={<MessageCircle color={Colors.white} size={18} />}
          />
        </View>
      ) : null}
    </View>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{groupNumber(value)}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
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
  cover: { height: 104 },
  avatarWrap: {
    position: "absolute",
    left: 20,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: Colors.paper,
  },
  avatarWrapTop: {
    position: "absolute",
    left: 20,
    top: 76,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: Colors.paper,
  },
  identity: { paddingHorizontal: 20, paddingTop: 56 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  name: { fontFamily: Fonts.serifBold, fontSize: 24, color: Colors.charcoal },
  handle: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    color: Colors.mist,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
  },
  region: { fontFamily: Fonts.sansMedium, fontSize: 13, color: Colors.slate },
  bio: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.ink,
    marginTop: 12,
  },
  joined: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    color: Colors.mist,
    marginTop: 10,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 18,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  stat: { flex: 1, alignItems: "center" },
  statDivider: { width: 1, height: 36, backgroundColor: Colors.line },
  statValue: { fontFamily: Fonts.monoBold, fontSize: 22, color: Colors.skyDeep },
  statLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    color: Colors.slate,
    marginTop: 3,
    textAlign: "center",
  },
  section: { paddingHorizontal: 20, marginTop: 22 },
  meContent: { paddingBottom: 40 },
  otherContent: { paddingBottom: 110 },
  sectionTitle: {
    fontFamily: Fonts.serif,
    fontSize: 20,
    color: Colors.charcoal,
    marginBottom: 12,
  },
  tabBody: { marginTop: 16 },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Colors.paper,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
  },
});

function getCoverStyle(color: string) {
  return [styles.cover, { backgroundColor: color }];
}
