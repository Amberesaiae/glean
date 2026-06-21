import { Stack, useLocalSearchParams } from "expo-router";
import { Check, Handshake, Send, X } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, Chip, Input, PressableScale, Sheet, Text, haptic } from "@/components/ui";
import { newClientToken } from "@/lib/api";
import Colors, { MATERIALS, MaterialKey } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { useApp } from "@/providers/AppProvider";
import { useAuth } from "@/providers/AuthProvider";
import type { Deal, Message } from "@/types";

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId } = useAuth();
  const {
    conversations,
    listings,
    deals,
    getProfile,
    sendMessage,
    proposeDeal,
    confirmDeal,
    declineDeal,
    setListingStatus,
    markConversationRead,
  } = useApp();
  const listRef = useRef<FlatList<Message>>(null);
  const [draft, setDraft] = useState<string>("");
  const [showDeal, setShowDeal] = useState<boolean>(false);

  const conversation = conversations.find((c) => c.id === id);
  const other = conversation ? getProfile(conversation.withUserId) : undefined;
  const listing = conversation?.listingId
    ? listings.find((l) => l.id === conversation.listingId)
    : undefined;
  const conversationId = conversation?.id;

  const convDeals = useMemo<Deal[]>(
    () => deals.filter((d) => d.conversationId === id),
    [deals, id],
  );

  const scrollToBottom = useCallback((animated: boolean) => {
    listRef.current?.scrollToEnd({ animated });
  }, []);

  useEffect(() => {
    if (id) markConversationRead(id);
  }, [id, markConversationRead]);

  useEffect(() => {
    if (!conversationId) return;
    scrollToBottom(false);
  }, [conversationId, scrollToBottom]);

  const promptedDealsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!listing || listing.authorId !== userId || listing.status !== "active") return;

    // Find any deal in this conversation that is confirmed
    const confirmedDeal = convDeals.find((d) => d.status === "confirmed");
    if (confirmedDeal && !promptedDealsRef.current.has(confirmedDeal.id)) {
      promptedDealsRef.current.add(confirmedDeal.id);
      Alert.alert(
        "Mark listing fulfilled?",
        `Close "${listing.title}" now that the deal is confirmed?`,
        [
          { text: "Keep open", style: "cancel" },
          { text: "Mark fulfilled", onPress: () => setListingStatus(listing.id, "fulfilled") },
        ]
      );
    }
  }, [convDeals, listing, userId, setListingStatus]);

  const send = useCallback(() => {
    if (!conversationId) return;
    const text = draft.trim();
    if (text.length === 0) return;
    sendMessage(conversationId, text, newClientToken());
    setDraft("");
    haptic("light");
    requestAnimationFrame(() => scrollToBottom(true));
  }, [conversationId, draft, scrollToBottom, sendMessage]);

  const onConfirm = useCallback(async (deal: Deal) => {
    await confirmDeal(deal.id);
    haptic("success");
  }, [confirmDeal]);

  if (!conversation || !other) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>Conversation not found.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 96 : 0}
    >
      <Stack.Screen options={{ title: other.name }} />
      <ConversationList
        ref={listRef}
        messages={conversation.messages}
        deals={convDeals}
        otherName={other.name}
        userId={userId ?? undefined}
        onConfirm={onConfirm}
        onDecline={declineDeal}
      />
      <ComposerBar
        value={draft}
        onChangeText={setDraft}
        onSend={send}
        onOpenDeal={() => setShowDeal(true)}
      />

      <DealSheet
        visible={showDeal}
        onClose={() => setShowDeal(false)}
        defaultMaterial={listing?.material ?? "plastics"}
        defaultUnit={listing?.unit ?? "kg"}
        onPropose={async (material, quantity, unit) => {
          await proposeDeal({
            withUserId: other.id,
            conversationId: conversation.id,
            listingId: conversation.listingId,
            material,
            quantity,
            unit,
          });
          haptic("success");
          setShowDeal(false);
        }}
      />
    </KeyboardAvoidingView>
  );
}

const ConversationList = React.forwardRef<
  FlatList<Message>,
  {
    messages: Message[];
    deals: Deal[];
    otherName: string;
    userId?: string;
    onConfirm: (deal: Deal) => Promise<void> | void;
    onDecline: (dealId: string) => void;
  }
>(function ConversationList(
  { messages, deals, otherName, userId, onConfirm, onDecline },
  ref,
) {
  const renderItem = useCallback(
    ({ item }: { item: Message }) => <MessageBubble message={item} />,
    [],
  );

  return (
    <FlatList
      ref={ref}
      data={messages}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        deals.length > 0 ? (
          <View style={styles.dealsWrap}>
            {deals
              .slice()
              .sort((a, b) => a.createdAt - b.createdAt)
              .map((d) => (
                <DealCard
                  key={d.id}
                  deal={d}
                  isCounterparty={d.counterpartyId === userId}
                  onConfirm={() => onConfirm(d)}
                  onDecline={() => onDecline(d.id)}
                />
              ))}
          </View>
        ) : null
      }
      renderItem={renderItem}
      ListEmptyComponent={
        <View style={styles.emptyChat}>
          <Text style={styles.emptyChatText}>
            Send the first message to {otherName.split(" ")[0]}.
          </Text>
        </View>
      }
    />
  );
});

const MessageBubble = React.memo(function MessageBubble({ message }: { message: Message }) {
  return (
    <View
      style={[
        styles.bubbleRow,
        message.fromMe ? styles.bubbleRowMe : styles.bubbleRowThem,
      ]}
    >
      <View
        style={[
          styles.bubble,
          message.fromMe ? styles.bubbleMe : styles.bubbleThem,
        ]}
      >
        <Text
          style={[styles.bubbleText, message.fromMe && { color: Colors.white }]}
        >
          {message.text}
        </Text>
      </View>
    </View>
  );
});

function ComposerBar({
  value,
  onChangeText,
  onSend,
  onOpenDeal,
}: {
  value: string;
  onChangeText: (value: string) => void;
  onSend: () => void;
  onOpenDeal: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.inputBar, { paddingBottom: insets.bottom + 10 }]}>
      <PressableScale onPress={onOpenDeal} style={styles.dealBtn}>
        <Handshake color={Colors.skyDeep} size={20} />
      </PressableScale>
      <Input
        value={value}
        onChangeText={onChangeText}
        placeholder="Type a message…"
        placeholderTextColor={Colors.mist}
        style={styles.input}
        multiline
      />
      <PressableScale onPress={onSend} style={styles.sendBtn}>
        <Send color={Colors.white} size={18} />
      </PressableScale>
    </View>
  );
}

function DealCard({
  deal,
  isCounterparty,
  onConfirm,
  onDecline,
}: {
  deal: Deal;
  isCounterparty: boolean;
  onConfirm: () => void;
  onDecline: () => void;
}) {
  const mat = MATERIALS[deal.material];
  const confirmed = deal.status === "confirmed";
  const declined = deal.status === "declined";
  return (
    <View style={styles.dealCard}>
      <View style={styles.dealHeader}>
        <Handshake color={Colors.skyDeep} size={16} />
        <Text style={styles.dealTitle}>Deal</Text>
        <View style={getDealStatusStyle(confirmed, declined)}>
          <Text style={getDealStatusTextStyle(confirmed, declined)}>
            {confirmed ? "Confirmed" : declined ? "Declined" : "Pending"}
          </Text>
        </View>
      </View>
      <Text style={styles.dealBody}>
        {deal.quantity}
        {deal.unit} · {mat.label}
      </Text>
      {deal.status === "proposed" ? (
        isCounterparty ? (
          <View style={styles.dealActions}>
            <PressableScale onPress={onConfirm} style={[styles.dealAction, styles.dealConfirm]}>
              <Check color={Colors.white} size={15} />
              <Text style={styles.dealConfirmText}>Confirm</Text>
            </PressableScale>
            <PressableScale onPress={onDecline} style={[styles.dealAction, styles.dealDecline]}>
              <X color={Colors.slate} size={15} />
              <Text style={styles.dealDeclineText}>Decline</Text>
            </PressableScale>
          </View>
        ) : (
          <Text style={styles.dealWaiting}>Waiting for them to confirm…</Text>
        )
      ) : null}
    </View>
  );
}

function getDealStatusStyle(confirmed: boolean, declined: boolean) {
  return [
    styles.dealStatus,
    confirmed
      ? { backgroundColor: Colors.successSoft }
      : declined
        ? { backgroundColor: Colors.cardAlt }
        : { backgroundColor: Colors.amberSoft },
  ];
}

function getDealStatusTextStyle(confirmed: boolean, declined: boolean) {
  return [
    styles.dealStatusText,
    {
      color: confirmed
        ? Colors.success
        : declined
          ? Colors.slate
          : Colors.amberInk,
    },
  ];
}

const UNIT_OPTIONS = [
  { key: "kg", label: "kg" },
  { key: "bag-small", label: "Small Bag (~10kg)" },
  { key: "bag-medium", label: "Medium Bag (~25kg)" },
  { key: "bag-large", label: "Large Bag (~50kg)" },
  { key: "crate", label: "Crate (~15kg)" },
  { key: "bale", label: "Bale (~250kg)" },
  { key: "tons", label: "Ton (1000kg)" },
];

function DealSheet({
  visible,
  onClose,
  defaultMaterial,
  defaultUnit,
  onPropose,
}: {
  visible: boolean;
  onClose: () => void;
  defaultMaterial: MaterialKey;
  defaultUnit: string;
  onPropose: (material: MaterialKey, quantity: number, unit: string) => Promise<void>;
}) {
  const [material, setMaterial] = useState<MaterialKey>(defaultMaterial);
  const [quantity, setQuantity] = useState<string>("");
  const [unit, setUnit] = useState<string>(defaultUnit);
  const [busy, setBusy] = useState<boolean>(false);

  useEffect(() => {
    if (!visible) return;
    setMaterial(defaultMaterial);
    setQuantity("");
    setUnit(defaultUnit);
    setBusy(false);
  }, [defaultMaterial, defaultUnit, visible]);

  const valid = Number(quantity) > 0;

  const submit = async () => {
    if (!valid || busy) return;
    setBusy(true);
    try {
      await onPropose(material, Number(quantity), unit);
      setQuantity("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Propose a deal">
      <Text style={styles.sheetHint}>
        Record what you agreed. If weighed on a scale at the center, input the final measured weight in kg.
      </Text>
      <Text style={styles.sheetLabel}>Material</Text>
      <View style={styles.sheetChips}>
        {(Object.keys(MATERIALS) as MaterialKey[]).map((m) => (
          <Chip
            key={m}
            label={MATERIALS[m].label}
            active={material === m}
            onPress={() => setMaterial(m)}
            color={MATERIALS[m].color}
          />
        ))}
      </View>
      <Text style={styles.sheetLabel}>Quantity</Text>
      <Input
        value={quantity}
        onChangeText={setQuantity}
        placeholder="120"
        keyboardType="numeric"
      />
      <Text style={styles.sheetLabel}>Unit</Text>
      <View style={styles.sheetChips}>
        {UNIT_OPTIONS.map((opt) => (
          <Chip key={opt.key} label={opt.label} active={unit === opt.key} onPress={() => setUnit(opt.key)} />
        ))}
      </View>
      <View style={styles.mt16}>
        <Button label="Send proposal" onPress={submit} disabled={!valid} loading={busy} fullWidth />
      </View>
    </Sheet>
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
  list: { padding: 16, gap: 8, flexGrow: 1 },
  dealsWrap: { gap: 10, marginBottom: 6 },
  dealCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.line,
    padding: 14,
  },
  dealHeader: { flexDirection: "row", alignItems: "center", gap: 7 },
  dealTitle: { fontFamily: Fonts.sansBold, fontSize: 14, color: Colors.charcoal, flex: 1 },
  dealStatus: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999 },
  dealStatusText: { fontFamily: Fonts.sansBold, fontSize: 11 },
  dealBody: {
    fontFamily: Fonts.monoBold,
    fontSize: 18,
    color: Colors.skyDeep,
    marginTop: 8,
  },
  dealActions: { flexDirection: "row", gap: 10, marginTop: 12 },
  dealAction: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 42,
    borderRadius: 12,
  },
  dealConfirm: { backgroundColor: Colors.success },
  dealConfirmText: { fontFamily: Fonts.sansBold, fontSize: 14, color: Colors.white },
  dealDecline: { backgroundColor: Colors.cardAlt },
  dealDeclineText: { fontFamily: Fonts.sansSemibold, fontSize: 14, color: Colors.slate },
  dealWaiting: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12.5,
    color: Colors.slate,
    marginTop: 10,
  },
  bubbleRow: { flexDirection: "row" },
  bubbleRowMe: { justifyContent: "flex-end" },
  bubbleRowThem: { justifyContent: "flex-start" },
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleMe: {
    backgroundColor: Colors.sky,
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: Colors.card,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  bubbleText: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    lineHeight: 21,
    color: Colors.charcoal,
  },
  emptyChat: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80 },
  emptyChatText: { fontFamily: Fonts.sans, fontSize: 15, color: Colors.slate },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 10,
    backgroundColor: Colors.paper,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
  },
  flex1: { flex: 1 },
  mt16: { marginTop: 16 },
  dealBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.skySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.line,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 110,
    fontFamily: Fonts.sans,
    fontSize: 15,
    color: Colors.charcoal,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.sky,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetHint: {
    fontFamily: Fonts.sans,
    fontSize: 13.5,
    color: Colors.slate,
    lineHeight: 19,
    marginBottom: 14,
  },
  sheetLabel: {
    fontFamily: Fonts.sansBold,
    fontSize: 13,
    color: Colors.charcoal,
    marginBottom: 8,
    marginTop: 4,
  },
  sheetChips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
});
