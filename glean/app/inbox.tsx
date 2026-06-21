import { router } from "expo-router";
import React from "react";
import { FlatList, StyleSheet, View } from "react-native";

import {
  Avatar,
  ConversationRowSkeleton,
  EmptyState,
  PressableScale,
  Text,
  VerifiedBadge,
} from "@/components/ui";
import Colors from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { useApp } from "@/providers/AppProvider";
import { timeAgo } from "@/utils/format";

export default function InboxScreen() {
  const { conversations, getProfile, unreadConversationIds, conversationsLoading } =
    useApp();

  const renderItem = React.useCallback(({ item }: { item: typeof conversations[number] }) => {
    const other = getProfile(item.withUserId);
    const last = item.messages[item.messages.length - 1];
    if (!other) return null;
    const unread = unreadConversationIds.has(item.id);
    return (
      <ConversationRow
        id={item.id}
        other={other}
        last={last}
        unread={unread}
      />
    );
  }, [getProfile, unreadConversationIds]);

  if (conversationsLoading && conversations.length === 0) {
    return (
      <View style={styles.skeletonWrap}>
        {[0, 1, 2, 3, 4].map((i) => (
          <ConversationRowSkeleton key={i} />
        ))}
      </View>
    );
  }

  if (conversations.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <EmptyState
          illustration="community"
          title="No messages yet"
          message="Message someone from a listing to start a conversation."
        />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={conversations}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={renderItem}
    />
  );
}

const ConversationRow = React.memo(function ConversationRow({
  id,
  other,
  last,
  unread,
}: {
  id: string;
  other: any;
  last: any;
  unread: boolean;
}) {
  return (
    <PressableScale
      onPress={() => router.push(`/chat/${id}`)}
      style={styles.row}
    >
      <Avatar uri={other.avatar} size={52} />
      <View style={styles.flex1}>
        <View style={styles.rowTop}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{other.name}</Text>
            {other.verified ? <VerifiedBadge size={12} /> : null}
          </View>
          {last ? (
            <Text style={[styles.time, unread && styles.timeUnread]}>
              {timeAgo(last.createdAt)}
            </Text>
          ) : null}
        </View>
        <View style={styles.previewRow}>
          <Text
            style={[styles.preview, unread && styles.previewUnread]}
            numberOfLines={1}
          >
            {last
              ? `${last.fromMe ? "You: " : ""}${last.text}`
              : "No messages yet"}
          </Text>
          {unread ? <View style={styles.dot} /> : null}
        </View>
      </View>
    </PressableScale>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },
  list: { padding: 16, gap: 4 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  name: { fontFamily: Fonts.sansSemibold, fontSize: 16, color: Colors.charcoal },
  time: { fontFamily: Fonts.mono, fontSize: 12, color: Colors.mist },
  timeUnread: { color: Colors.sky },
  previewRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 3 },
  preview: {
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.slate,
  },
  previewUnread: { fontFamily: Fonts.sansSemibold, color: Colors.charcoal },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: Colors.sky,
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.paper,
  },
  skeletonWrap: {
    flex: 1,
    backgroundColor: Colors.paper,
    padding: 16,
    gap: 4,
  },
  flex1: { flex: 1 },
});
