import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { Flag, Heart, MessageCircle, Send } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Avatar,
  DetailSkeleton,
  Input,
  MaterialTag,
  PressableScale,
  SaveButton,
  Text,
  VerifiedBadge,
  haptic,
} from "@/components/ui";
import { ECOFORGE_LOGO } from "@/components/illustrations";
import Colors from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { officialStyleFor } from "@/constants/officialFeed";
import { isVideoUrl } from "@/lib/upload";
import { useApp } from "@/providers/AppProvider";
import { timeAgo } from "@/utils/format";

export default function PostDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    feed,
    getProfile,
    toggleLike,
    addComment,
    flagPost,
    savedPostIds,
    toggleSavePost,
    loading,
  } = useApp();
  const [draft, setDraft] = useState<string>("");

  const post = feed.find((p) => p.id === id);

  const submitComment = useCallback(() => {
    if (!post || draft.trim().length === 0) return;
    addComment(post.id, draft.trim());
    setDraft("");
    haptic("light");
  }, [post, draft, addComment]);

  if (!post && loading) {
    return <DetailSkeleton />;
  }

  if (!post) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>Post not found.</Text>
      </View>
    );
  }

  const author = getProfile(post.authorId);
  const isOfficial = !!author?.official;
  const style = author ? officialStyleFor(author.handle) : undefined;
  const isEcoForge = !!style?.isEcoForge;
  const saved = savedPostIds.includes(post.id);

  const openAuthor = () => {
    if (isEcoForge) router.push("/ecoforge");
    else if (author) router.push(`/profile/${author.id}`);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.authorRow}>
          <PressableScale onPress={openAuthor}>
            {isEcoForge ? (
              <View style={styles.ecoforgeAvatar}>
                <Image source={ECOFORGE_LOGO} style={styles.ecoforgeLogo} contentFit="cover" />
              </View>
            ) : author ? (
              <Avatar uri={author.avatar} size={48} />
            ) : (
              <View style={styles.avatarFallback} />
            )}
          </PressableScale>
          <PressableScale onPress={openAuthor} style={styles.flex1}>
            <View style={styles.nameRow}>
              <Text
                style={[styles.name, isOfficial && style ? { color: style.accent } : null]}
                numberOfLines={1}
              >
                {author?.name ?? "Someone"}
              </Text>
              {author?.verified ? <VerifiedBadge size={15} /> : null}
            </View>
            <Text style={styles.handle}>
              @{author?.handle ?? "unknown"} · {timeAgo(post.createdAt)}
            </Text>
          </PressableScale>
        </View>

        <Text style={styles.text}>{post.text}</Text>

        {post.material ? (
          <View style={styles.tagRow}>
            <MaterialTag material={post.material} small />
          </View>
        ) : null}

        <PostMedia uri={post.photo} />

        <View style={styles.actions}>
          <View style={styles.action}>
            <MessageCircle color={Colors.slate} size={20} />
            <Text style={styles.actionText}>{post.comments.length}</Text>
          </View>
          <PressableScale onPress={() => toggleLike(post.id)} style={styles.action} hitSlop={8}>
            <Heart
              color={post.likedByMe ? Colors.danger : Colors.slate}
              fill={post.likedByMe ? Colors.danger : "transparent"}
              size={20}
            />
            <Text style={[styles.actionText, post.likedByMe && { color: Colors.danger }]}>
              {post.likes}
            </Text>
          </PressableScale>
          <View style={styles.flex1} />
          <SaveButton saved={saved} onPress={() => toggleSavePost(post.id)} size={20} />
          {!isOfficial ? (
            <PressableScale onPress={() => flagPost(post.id)} style={styles.action} hitSlop={8}>
              <Flag color={Colors.mist} size={18} />
            </PressableScale>
          ) : null}
        </View>

        <View style={styles.commentsHeader}>
          <Text style={styles.commentsTitle}>
            {post.comments.length > 0
              ? `Comments · ${post.comments.length}`
              : "Comments"}
          </Text>
        </View>

        {post.comments.length === 0 ? (
          <Text style={styles.empty}>Be the first to comment.</Text>
        ) : (
          post.comments.map((c) => {
            const cAuthor = getProfile(c.authorId);
            return (
              <View key={c.id} style={styles.comment}>
                {cAuthor ? <Avatar uri={cAuthor.avatar} size={34} /> : <View style={styles.commentAvatarFallback} />}
                <View style={styles.commentBubble}>
                  <View style={styles.commentTop}>
                    <Text style={styles.commentName}>{cAuthor?.name ?? "Someone"}</Text>
                    <Text style={styles.commentTime}>{timeAgo(c.createdAt)}</Text>
                  </View>
                  <Text style={styles.commentText}>{c.text}</Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
        <Input
          value={draft}
          onChangeText={setDraft}
          placeholder="Add a comment…"
          placeholderTextColor={Colors.mist}
          style={styles.input}
          onSubmitEditing={submitComment}
          returnKeyType="send"
        />
        <PressableScale onPress={submitComment} style={styles.sendBtn} hapticStyle="light">
          <Send color={Colors.white} size={18} />
        </PressableScale>
      </View>
    </KeyboardAvoidingView>
  );
}

function PostMedia({ uri }: { uri?: string }) {
  if (!uri) return null;
  return isVideoUrl(uri) ? <PostVideo uri={uri} /> : (
    <Image source={{ uri }} style={styles.media} contentFit="cover" transition={200} />
  );
}

function PostVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });
  return <VideoView player={player} style={styles.media} contentFit="cover" nativeControls />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },
  missing: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.paper },
  missingText: { fontFamily: Fonts.sans, color: Colors.slate },
  content: { padding: 16 },
  authorRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  flex1: { flex: 1 },
  ecoforgeAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#2C3540",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  ecoforgeLogo: { width: 48, height: 48 },
  avatarFallback: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.cardAlt },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { fontFamily: Fonts.sansSemibold, fontSize: 16.5, color: Colors.charcoal, flexShrink: 1 },
  handle: { fontFamily: Fonts.mono, fontSize: 12.5, color: Colors.mist, marginTop: 2 },
  text: {
    fontFamily: Fonts.sans,
    fontSize: 17,
    lineHeight: 26,
    color: Colors.ink,
    marginTop: 16,
  },
  tagRow: { flexDirection: "row", marginTop: 12 },
  media: {
    width: "100%",
    height: 260,
    borderRadius: 18,
    marginTop: 14,
    backgroundColor: Colors.cardAlt,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
    marginTop: 18,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.line,
  },
  action: { flexDirection: "row", alignItems: "center", gap: 7 },
  actionText: { fontFamily: Fonts.monoBold, fontSize: 14, color: Colors.slate },
  commentsHeader: { marginTop: 20 },
  commentsTitle: { fontFamily: Fonts.serifBold, fontSize: 18, color: Colors.charcoal },
  empty: { fontFamily: Fonts.sans, fontSize: 14, color: Colors.mist, marginTop: 14 },
  comment: { flexDirection: "row", gap: 10, alignItems: "flex-start", marginTop: 16 },
  commentAvatarFallback: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.cardAlt },
  commentBubble: { flex: 1, backgroundColor: Colors.cardAlt, borderRadius: 14, padding: 12 },
  commentTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  commentName: { fontFamily: Fonts.sansSemibold, fontSize: 14, color: Colors.charcoal },
  commentTime: { fontFamily: Fonts.mono, fontSize: 11, color: Colors.mist },
  commentText: { fontFamily: Fonts.sans, fontSize: 14.5, color: Colors.ink, marginTop: 3, lineHeight: 20 },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
    backgroundColor: Colors.paper,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.cardAlt,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 11,
    fontFamily: Fonts.sans,
    fontSize: 15,
    color: Colors.charcoal,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.sky,
    alignItems: "center",
    justifyContent: "center",
  },
});
