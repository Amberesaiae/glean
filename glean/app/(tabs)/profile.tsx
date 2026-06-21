import { router } from "expo-router";
import { LogOut, MessageSquare, Pencil, UserPlus } from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar, PressableScale, ProfileSkeleton, Text, VerifiedBadge } from "@/components/ui";
import { Achievements } from "@/components/illustrations";
import {
  ImpactChart,
  ListingRow,
  PostRow,
  ProfileTab,
  ProfileTabs,
  RegularlySupplies,
  RoleBadge,
  TabEmpty,
} from "@/components/profile";
import { AnchorCredibility } from "@/components/anchor";
import Colors from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { inviteContact } from "@/lib/device";
import { ROLES } from "@/constants/roles";
import { useApp } from "@/providers/AppProvider";
import { useAuth } from "@/providers/AuthProvider";
import { groupNumber } from "@/utils/format";
import type { FeedPost, Listing, UserProfile } from "@/types";

const TAB_OPTIONS: { key: ProfileTab; label: string }[] = [
  { key: "listings", label: "Listings" },
  { key: "posts", label: "Posts" },
  { key: "saved", label: "Saved" },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const {
    me,
    listings,
    feed,
    deals,
    unreadConversationIds,
    savedListingIds,
    savedPostIds,
  } = useApp();
  const unreadCount = unreadConversationIds.size;

  const [tab, setTab] = useState<ProfileTab>("listings");

  const myListings = useMemo(
    () =>
      me
        ? listings
            .filter((l) => l.authorId === me.id)
            .sort((a, b) => b.createdAt - a.createdAt)
        : [],
    [listings, me],
  );
  const myPosts = useMemo(
    () =>
      me
        ? feed
            .filter((p) => p.authorId === me.id && !p.flagged)
            .sort((a, b) => b.createdAt - a.createdAt)
        : [],
    [feed, me],
  );
  const savedListings = useMemo(
    () => listings.filter((l) => savedListingIds.includes(l.id)),
    [listings, savedListingIds],
  );
  const savedPosts = useMemo(
    () => feed.filter((p) => savedPostIds.includes(p.id)),
    [feed, savedPostIds],
  );

  if (!me) {
    return <ProfileSkeleton />;
  }

  const role = ROLES[me.role];

  const invite = () => {
    inviteContact(
      `I'm using Glean to trade recyclable materials and find buyers nearby — join me: https://rork.com/`,
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <ProfileHeader
        topInset={insets.top}
        roleColor={role.color}
        unreadCount={unreadCount}
        onInbox={() => router.push("/inbox")}
        onEdit={() => router.push("/edit-profile")}
        onSignOut={signOut}
        avatar={me.avatar}
      />

      <ProfileIdentity profile={me} onInvite={invite} />

      <ProfileStatsRow
        values={[
          { value: me.stats.materialsMovedKg, label: role.statLabels[0] },
          { value: me.stats.deals, label: role.statLabels[1] },
          { value: me.stats.listings, label: role.statLabels[2] },
        ]}
      />

      {myListings.some((l) => l.recurring) ? (
        <ProfileSection title="Regularly supplies">
          <RegularlySupplies listings={myListings} />
        </ProfileSection>
      ) : null}

      <ProfileSection>
        <ImpactChart profile={me} deals={deals} />
      </ProfileSection>

      <ProfileSection title={role.isOrg ? "Credibility" : "Achievements"}>
        {role.isOrg ? (
          <AnchorCredibility profile={me} />
        ) : (
          <Achievements stats={me.stats} />
        )}
      </ProfileSection>

      <ProfileSection topMargin>
        <ProfileTabs tabs={TAB_OPTIONS} active={tab} onChange={setTab} />
        <View style={styles.tabBody}>
          <ProfileTabContent
            tab={tab}
            myListings={myListings}
            myPosts={myPosts}
            savedListings={savedListings}
            savedPosts={savedPosts}
          />
        </View>
      </ProfileSection>
    </ScrollView>
  );
}

function ProfileHeader({
  topInset,
  roleColor,
  unreadCount,
  onInbox,
  onEdit,
  onSignOut,
  avatar,
}: {
  topInset: number;
  roleColor: string;
  unreadCount: number;
  onInbox: () => void;
  onEdit: () => void;
  onSignOut: () => void;
  avatar: string;
}) {
  return (
    <View style={getCoverStyle(topInset, roleColor)}>
      <View style={styles.coverActions}>
        <PressableScale onPress={onInbox} style={styles.iconBtn}>
          <MessageSquare color={Colors.white} size={18} />
          {unreadCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          ) : null}
        </PressableScale>
        <PressableScale onPress={onEdit} style={styles.iconBtn}>
          <Pencil color={Colors.white} size={18} />
        </PressableScale>
        <PressableScale onPress={onSignOut} style={styles.iconBtn}>
          <LogOut color={Colors.white} size={18} />
        </PressableScale>
      </View>
      <View style={styles.avatarWrap}>
        <Avatar uri={avatar} size={92} />
      </View>
    </View>
  );
}

function getCoverStyle(topInset: number, roleColor: string) {
  return [styles.cover, { paddingTop: topInset + 10, backgroundColor: roleColor }];
}

function ProfileIdentity({
  profile,
  onInvite,
}: {
  profile: Pick<UserProfile, "name" | "handle" | "verified" | "role" | "region" | "bio">;
  onInvite: () => void;
}) {
  return (
    <>
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
      </View>

      <View style={styles.identity}>
        <PressableScale onPress={onInvite} style={styles.inviteBtn} hapticStyle="medium">
          <UserPlus color={Colors.skyDeep} size={17} />
          <Text style={styles.inviteText}>Invite a friend</Text>
        </PressableScale>
      </View>
    </>
  );
}

function ProfileStatsRow({
  values,
}: {
  values: { value: number; label: string }[];
}) {
  return (
    <View style={styles.statsRow}>
      {values.map((item, index) => (
        <React.Fragment key={item.label}>
          {index > 0 ? <View style={styles.statDivider} /> : null}
          <AnimatedStat value={item.value} label={item.label} />
        </React.Fragment>
      ))}
    </View>
  );
}

function ProfileSection({
  title,
  children,
  topMargin,
}: {
  title?: string;
  children: React.ReactNode;
  topMargin?: boolean;
}) {
  return (
    <View style={[styles.section, topMargin && styles.sectionTopMargin]}>
      {title ? <Text style={styles.sectionTitle}>{title}</Text> : null}
      {children}
    </View>
  );
}

function ProfileTabContent({
  tab,
  myListings,
  myPosts,
  savedListings,
  savedPosts,
}: {
  tab: ProfileTab;
  myListings: Listing[];
  myPosts: FeedPost[];
  savedListings: Listing[];
  savedPosts: FeedPost[];
}) {
  if (tab === "listings") {
    return myListings.length === 0 ? (
      <TabEmpty text="You haven't posted any listings yet." />
    ) : (
      <>{myListings.map((l) => <ListingRow key={l.id} listing={l} />)}</>
    );
  }

  if (tab === "posts") {
    return myPosts.length === 0 ? (
      <TabEmpty text="You haven't shared anything with the community yet." />
    ) : (
      <>{myPosts.map((p) => <PostRow key={p.id} post={p} />)}</>
    );
  }

  if (savedListings.length === 0 && savedPosts.length === 0) {
    return <TabEmpty text="Bookmark listings and posts to keep them here." />;
  }

  return (
    <>
      {savedListings.map((l) => (
        <ListingRow key={l.id} listing={l} />
      ))}
      {savedPosts.map((p) => (
        <PostRow key={p.id} post={p} />
      ))}
    </>
  );
}

function AnimatedStat({ value, label }: { value: number; label: string }) {
  const anim = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState<number>(0);

  useEffect(() => {
    const id = anim.addListener(({ value: v }) => setDisplay(Math.round(v)));
    Animated.timing(anim, {
      toValue: value,
      duration: 1100,
      useNativeDriver: false,
    }).start();
    return () => anim.removeListener(id);
  }, [anim, value]);

  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{groupNumber(display)}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },
  content: { paddingBottom: 40 },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.paper,
  },
  cover: {
    height: 138,
    paddingHorizontal: 16,
  },
  coverActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.amber,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: { fontFamily: Fonts.monoBold, fontSize: 10, color: Colors.white },
  avatarWrap: {
    position: "absolute",
    bottom: -46,
    left: 20,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: Colors.paper,
  },
  identity: { paddingHorizontal: 20, paddingTop: 56 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  name: { fontFamily: Fonts.serifBold, fontSize: 24, color: Colors.charcoal },
  handle: { fontFamily: Fonts.mono, fontSize: 13, color: Colors.mist, marginTop: 2 },
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
  inviteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: 14,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.skySoft,
  },
  inviteText: { fontFamily: Fonts.sansSemibold, fontSize: 14, color: Colors.skyDeep },
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
  sectionTopMargin: { marginTop: 26 },
  sectionTitle: {
    fontFamily: Fonts.serif,
    fontSize: 20,
    color: Colors.charcoal,
    marginBottom: 12,
  },
  tabBody: { marginTop: 16 },
});
