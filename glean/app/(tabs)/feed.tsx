import { Image } from "expo-image";
import { router } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import {
  Flag,
  Heart,
  MessageCircle,
  PencilLine,
  Send,
} from "lucide-react-native";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  FlatList,
  StyleSheet,
  RefreshControl,
  View,
  type ViewToken,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Avatar,
  EmptyState,
  FeedPostSkeleton,
  Input,
  MaterialTag,
  PressableScale,
  SaveButton,
  Text,
  VerifiedBadge,
  haptic,
} from "@/components/ui";
import { ECOFORGE_LOGO } from "@/components/illustrations";
import { MessagesButton } from "@/components/messages-button";
import Colors from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { officialStyleFor } from "@/constants/officialFeed";
import { isVideoUrl } from "@/lib/upload";
import { useApp } from "@/providers/AppProvider";
import type { FeedPost, UserProfile } from "@/types";
import { timeAgo } from "@/utils/format";

type FeedFilter = "all" | "official" | "community";

const FILTERS: { key: FeedFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "official", label: "Official" },
  { key: "community", label: "Community" },
];

/** Looping, muted inline video that only plays while actually on screen. */
function PostVideo({ uri, active }: { uri: string; active: boolean }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
  });

  React.useEffect(() => {
    if (active) {
      player.play();
    } else {
      player.pause();
    }
  }, [active, player]);

  return (
    <VideoView
      player={player}
      style={styles.media}
      contentFit="cover"
      nativeControls
    />
  );
}

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const { feed, getProfile, loading, refreshing, refresh } = useApp();
  const [filter, setFilter] = useState<FeedFilter>("all");
  const [activeId, setActiveId] = useState<string | null>(null);

  const items = useMemo<FeedPost[]>(() => {
    if (filter === "all") return feed;
    const wantOfficial = filter === "official";
    return feed.filter((post) => {
      const author = getProfile(post.authorId);
      return !!author?.official === wantOfficial;
    });
  }, [feed, filter, getProfile]);

  // Track the single most-visible post so only its video plays.
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const first = viewableItems[0]?.item as FeedPost | undefined;
      setActiveId(first?.id ?? null);
    },
  ).current;

  const renderItem = useCallback(
    ({ item }: { item: FeedPost }) => (
      <PostRow post={item} active={item.id === activeId} />
    ),
    [activeId],
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Feed</Text>
            <Text style={styles.headerSub}>
              The community & the world, in one stream
            </Text>
          </View>
          <View style={styles.headerActions}>
            <MessagesButton />
            <PressableScale
              hapticStyle="medium"
              onPress={() => router.push("/compose")}
              style={styles.composeBtn}
            >
              <PencilLine color={Colors.white} size={20} />
            </PressableScale>
          </View>
        </View>
        <View style={styles.filterRow}>
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <PressableScale
                key={f.key}
                onPress={() => setFilter(f.key)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text
                  style={[
                    styles.filterText,
                    active && styles.filterTextActive,
                  ]}
                >
                  {f.label}
                </Text>
              </PressableScale>
            );
          })}
        </View>
      </View>

      <FlatList
        data={loading ? [] : items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={7}
        removeClippedSubviews={false}
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={Colors.sky}
          />
        }
        renderItem={renderItem}
        ListEmptyComponent={
          loading ? (
            <View>
              {[0, 1, 2, 3].map((i) => (
                <FeedPostSkeleton key={i} />
              ))}
            </View>
          ) : (
            <EmptyState
              illustration="community"
              title="Nothing here yet"
              message={
                filter === "community"
                  ? "Share what you're collecting, making, or learning to get the community going."
                  : "Check back soon for updates from organisations and the community."
              }
            />
          )
        }
      />
    </View>
  );
}

/* ------------------------------- Post row ------------------------------- */

const PostRow = React.memo(function PostRow({
  post,
  active,
}: {
  post: FeedPost;
  active: boolean;
}) {
  const {
    getProfile,
    toggleLike,
    addComment,
    flagPost,
    savedPostIds,
    toggleSavePost,
  } = useApp();
  const author = getProfile(post.authorId);
  const isOfficial = !!author?.official;
  const style = author ? officialStyleFor(author.handle) : undefined;
  const isEcoForge = !!style?.isEcoForge;

  const [draft, setDraft] = useState<string>("");
  const showComments = false;

  const openAuthor = useCallback(() => {
    if (isEcoForge) router.push("/ecoforge" as any);
    else if (author) router.push(`/profile/${author.id}`);
  }, [isEcoForge, author]);

  const openPost = useCallback(() => {
    router.push(`/post/${post.id}` as any);
  }, [post.id]);

  // Community posts can be flagged & hidden; official posts can't be flagged.
  if (post.flagged && !isOfficial) {
    return (
      <View style={styles.flaggedRow}>
        <Flag color={Colors.mist} size={16} />
        <Text style={styles.flaggedText}>
          Post hidden — flagged for review. Thank you.
        </Text>
      </View>
    );
  }

  const submitComment = () => {
    if (draft.trim().length === 0) return;
    addComment(post.id, draft.trim());
    setDraft("");
    haptic("light");
  };

  return (
    <View style={styles.row}>
      <PressableScale onPress={openAuthor}>
        {isEcoForge ? (
          <View style={styles.ecoforgeAvatar}>
            <Image
              source={ECOFORGE_LOGO}
              style={styles.ecoforgeLogo}
              contentFit="cover"
            />
          </View>
        ) : author ? (
          <Avatar uri={author.avatar} size={44} />
        ) : (
          <View style={styles.avatarFallback} />
        )}
      </PressableScale>

      <View style={styles.body}>
        <PressableScale onPress={openAuthor}>
          <PostMeta
            name={author?.name ?? "Someone"}
            handle={author?.handle ?? "unknown"}
            verified={author?.verified}
            accent={isOfficial ? style?.accent : undefined}
            createdAt={post.createdAt}
          />
        </PressableScale>

        <PressableScale onPress={openPost}>
          <Text style={styles.text}>{post.text}</Text>

          {post.material ? (
            <View style={styles.tagRow}>
              <MaterialTag material={post.material} small />
            </View>
          ) : null}

          <PostMedia uri={post.photo} active={active} />
        </PressableScale>

        <PostActions
          liked={post.likedByMe}
          likes={post.likes}
          commentsCount={post.comments.length}
          saved={savedPostIds.includes(post.id)}
          onLike={() => toggleLike(post.id)}
          onToggleComments={openPost}
          onSave={() => toggleSavePost(post.id)}
          onFlag={isOfficial ? undefined : () => flagPost(post.id)}
        />

        <CommentsSection
          visible={showComments}
          comments={post.comments}
          getProfile={getProfile}
          draft={draft}
          onDraftChange={setDraft}
          onSubmit={submitComment}
        />
      </View>
    </View>
  );
});

/* --------------------------- Shared pieces --------------------------- */

function PostMeta({
  name,
  handle,
  verified,
  accent,
  createdAt,
}: {
  name: string;
  handle: string;
  verified?: boolean;
  accent?: string;
  createdAt: number;
}) {
  return (
    <View style={styles.metaRow}>
      <Text
        style={[styles.name, accent ? { color: accent } : null]}
        numberOfLines={1}
      >
        {name}
      </Text>
      {verified ? <VerifiedBadge size={14} /> : null}
      <Text style={styles.handle} numberOfLines={1}>
        @{handle}
      </Text>
      <Text style={styles.dot}>·</Text>
      <Text style={styles.time}>{timeAgo(createdAt)}</Text>
    </View>
  );
}

function PostMedia({ uri, active }: { uri?: string; active: boolean }) {
  if (!uri) return null;
  return isVideoUrl(uri) ? (
    <PostVideo uri={uri} active={active} />
  ) : (
    <Image
      source={{ uri }}
      style={styles.media}
      contentFit="cover"
      transition={200}
    />
  );
}

function PostActions({
  liked,
  likes,
  commentsCount,
  saved,
  onLike,
  onToggleComments,
  onSave,
  onFlag,
}: {
  liked: boolean;
  likes: number;
  commentsCount: number;
  saved: boolean;
  onLike: () => void;
  onToggleComments: () => void;
  onSave: () => void;
  onFlag?: () => void;
}) {
  return (
    <View style={styles.actions}>
      <PressableScale onPress={onToggleComments} style={styles.action} hitSlop={8}>
        <MessageCircle color={Colors.slate} size={18} />
        <Text style={styles.actionText}>{commentsCount}</Text>
      </PressableScale>
      <PressableScale onPress={onLike} style={styles.action} hitSlop={8}>
        <Heart
          color={liked ? Colors.danger : Colors.slate}
          fill={liked ? Colors.danger : "transparent"}
          size={18}
        />
        <Text style={[styles.actionText, liked && { color: Colors.danger }]}>
          {likes}
        </Text>
      </PressableScale>
      <View style={styles.flex1} />
      <SaveButton saved={saved} onPress={onSave} size={18} />
      {onFlag ? (
        <PressableScale onPress={onFlag} style={styles.action} hitSlop={8}>
          <Flag color={Colors.mist} size={16} />
        </PressableScale>
      ) : null}
    </View>
  );
}

function CommentsSection({
  visible,
  comments,
  getProfile,
  draft,
  onDraftChange,
  onSubmit,
}: {
  visible: boolean;
  comments: FeedPost["comments"];
  getProfile: (id: string) => UserProfile | undefined;
  draft: string;
  onDraftChange: (value: string) => void;
  onSubmit: () => void;
}) {
  if (!visible) return null;

  return (
    <View style={styles.comments}>
      {comments.map((c) => {
        const cAuthor = getProfile(c.authorId);
        return (
          <View key={c.id} style={styles.comment}>
            {cAuthor ? <Avatar uri={cAuthor.avatar} size={28} /> : null}
            <View style={styles.commentBubble}>
              <Text style={styles.commentName}>{cAuthor?.name}</Text>
              <Text style={styles.commentText}>{c.text}</Text>
            </View>
          </View>
        );
      })}
      <View style={styles.commentInputRow}>
        <Input
          value={draft}
          onChangeText={onDraftChange}
          placeholder="Add a comment…"
          placeholderTextColor={Colors.mist}
          style={styles.commentInput}
        />
        <PressableScale onPress={onSubmit} style={styles.sendBtn}>
          <Send color={Colors.white} size={16} />
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontFamily: Fonts.serifBold,
    fontSize: 23,
    color: Colors.charcoal,
  },
  headerSub: { fontFamily: Fonts.sansMedium, fontSize: 13, color: Colors.slate },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  composeBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.sky,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.sky,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  filterRow: { flexDirection: "row", gap: 8, marginTop: 14 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: Colors.cardAlt,
  },
  filterChipActive: { backgroundColor: Colors.charcoal },
  filterText: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 13.5,
    color: Colors.slate,
  },
  filterTextActive: { color: Colors.white },

  list: { paddingBottom: 40 },
  row: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.cardAlt,
  },
  ecoforgeAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2C3540",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  ecoforgeLogo: { width: 44, height: 44 },
  body: { flex: 1 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  name: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 15,
    color: Colors.charcoal,
    maxWidth: "52%",
  },
  handle: { fontFamily: Fonts.mono, fontSize: 12, color: Colors.mist, flexShrink: 1 },
  dot: { fontFamily: Fonts.sans, fontSize: 12, color: Colors.mist },
  time: { fontFamily: Fonts.mono, fontSize: 12, color: Colors.mist },
  text: {
    fontFamily: Fonts.sans,
    fontSize: 15.5,
    lineHeight: 23,
    color: Colors.ink,
    marginTop: 6,
  },
  tagRow: { flexDirection: "row", marginTop: 10 },
  media: {
    width: "100%",
    height: 220,
    borderRadius: 16,
    marginTop: 12,
    backgroundColor: Colors.cardAlt,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 22,
    marginTop: 14,
  },
  action: { flexDirection: "row", alignItems: "center", gap: 6 },
  actionText: { fontFamily: Fonts.monoBold, fontSize: 13, color: Colors.slate },
  comments: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
    gap: 10,
  },
  comment: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  commentBubble: {
    flex: 1,
    backgroundColor: Colors.cardAlt,
    borderRadius: 12,
    padding: 10,
  },
  commentName: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 13,
    color: Colors.charcoal,
  },
  commentText: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.ink,
    marginTop: 2,
    lineHeight: 19,
  },
  commentInputRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  commentInput: {
    flex: 1,
    backgroundColor: Colors.cardAlt,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.charcoal,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.sky,
    alignItems: "center",
    justifyContent: "center",
  },
  flaggedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  flaggedText: { fontFamily: Fonts.sans, fontSize: 13.5, color: Colors.slate },
  flex1: { flex: 1 },
});
