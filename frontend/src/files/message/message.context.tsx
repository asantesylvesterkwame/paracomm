import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRoomSocket } from "@/context/RoomSocketContext";
import { useRoomContext } from "@/files/room/room.context";
import { useAuthContext } from "@/files/auth/auth.context";
import { cacheRead, cacheReadSync, cacheWrite } from "@/utils";
import useCachedState from "@/hooks/useCachedState";
import {
  CACHED_MESSAGES_PER_ROOM,
  CACHED_ROOMS,
  draftsCacheKey,
  messagesCacheKey,
} from "@/constants/cache.constants";
import MessageService from "./message.service";
import { MESSAGE_EVENTS, TYPING_CLEAR_MS } from "./message.constants";
import {
  EMPTY_ROOM_MESSAGES,
  capMessages,
  mergeCachedMessages,
  mergeMessages,
  reconcileMessageInto,
  sortByCreatedAt,
  upsertMessageInto,
} from "./message.utils";
import type {
  IClientMessage,
  IMessage,
  IRoomMessagesState,
  IRoomSeen,
  ISeenPayload,
  ITypingPayload,
  MessageContextType,
} from "./message.interface";
import type { ReactNode } from "react";

const MessageContext = createContext<MessageContextType | undefined>(undefined);

const persistable = (items: IClientMessage[]) =>
  capMessages(items, CACHED_MESSAGES_PER_ROOM).map((item) => {
    const { localAudioUrl, ...rest } = item;
    void localAudioUrl;
    return rest.clientStatus === "sending"
      ? { ...rest, clientStatus: "failed" as const, clientError: "network" as const }
      : rest;
  });

export const MessageProvider = ({ children }: { children: ReactNode }) => {
  const { rooms, activeRoomId, upsertRoom } = useRoomContext();
  const { profile, identityId } = useAuthContext();
  const { joinRoom, leaveRoom, on, off, connectionKey } = useRoomSocket();
  const [byRoom, setByRoom] = useState<Record<string, IRoomMessagesState>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [typingUserIds, setTypingUserIds] = useState<string[]>([]);
  const [seenByRoom, setSeenByRoom] = useState<Record<string, IRoomSeen>>({});
  const typingTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  const fetchingRef = useRef<Set<string>>(new Set());
  const byRoomRef = useRef(byRoom);

  useEffect(() => {
    byRoomRef.current = byRoom;
  });

  const patchRoomState = useCallback(
    (
      roomId: string,
      changes:
        | Partial<IRoomMessagesState>
        | ((current: IRoomMessagesState) => Partial<IRoomMessagesState>),
    ) => {
      setByRoom((previous) => {
        const current = previous[roomId] ?? EMPTY_ROOM_MESSAGES;
        const next =
          typeof changes === "function" ? changes(current) : changes;
        return { ...previous, [roomId]: { ...current, ...next } };
      });
    },
    [],
  );

  const getRoomState = useCallback(
    (roomId: string | null) =>
      (roomId ? byRoom[roomId] : undefined) ?? EMPTY_ROOM_MESSAGES,
    [byRoom],
  );

  const upsertMessage = useCallback(
    (roomId: string, message: IClientMessage) => {
      patchRoomState(roomId, (current) => ({
        items: upsertMessageInto(current.items, message),
      }));
    },
    [patchRoomState],
  );

  const reconcileMessage = useCallback(
    (roomId: string, message: IMessage, replaceId?: string) => {
      patchRoomState(roomId, (current) => ({
        items: reconcileMessageInto(current.items, message, replaceId),
      }));
    },
    [patchRoomState],
  );

  const patchMessage = useCallback(
    (roomId: string, id: string, changes: Partial<IClientMessage>) => {
      patchRoomState(roomId, (current) => ({
        items: current.items.map((item) =>
          item.id === id ? { ...item, ...changes } : item,
        ),
      }));
    },
    [patchRoomState],
  );

  const removeMessage = useCallback(
    (roomId: string, id: string) => {
      patchRoomState(roomId, (current) => ({
        items: current.items.filter((item) => item.id !== id),
      }));
    },
    [patchRoomState],
  );

  const setDraft = useCallback((roomId: string, draft: string) => {
    setDrafts((previous) =>
      previous[roomId] === draft ? previous : { ...previous, [roomId]: draft },
    );
  }, []);

  const markRoomSeenLocally = useCallback((roomId: string, seen: IRoomSeen) => {
    setSeenByRoom((previous) => ({ ...previous, [roomId]: seen }));
  }, []);

  const refetch = useCallback(
    async (roomId: string, options?: { isSilent?: boolean }) => {
      if (!roomId || fetchingRef.current.has(roomId)) return;
      fetchingRef.current.add(roomId);
      const current = byRoomRef.current[roomId] ?? EMPTY_ROOM_MESSAGES;
      const isBackground = options?.isSilent || current.items.length > 0;
      patchRoomState(
        roomId,
        isBackground ? { isRevalidating: true } : { isLoading: true },
      );
      const result = await MessageService.getMessages(roomId).catch(
        () => null,
      );
      if (result?.data?.items) {
        const items = result.data.items;
        const nextCursor = result.data.nextCursor;
        patchRoomState(roomId, (state) => ({
          items: mergeMessages(items, state.items),
          nextCursor: state.nextCursor ?? nextCursor,
        }));
      }
      fetchingRef.current.delete(roomId);
      patchRoomState(roomId, {
        isLoading: false,
        isRevalidating: false,
        hasFetched: true,
      });
    },
    [patchRoomState],
  );

  const loadOlder = useCallback(
    async (roomId: string) => {
      const current = byRoomRef.current[roomId] ?? EMPTY_ROOM_MESSAGES;
      if (!roomId || !current.nextCursor || current.isLoadingMore) return;
      patchRoomState(roomId, { isLoadingMore: true });
      const result = await MessageService.getMessages(
        roomId,
        current.nextCursor,
      ).catch(() => null);
      if (result?.data?.items) {
        const older = result.data.items;
        const nextCursor = result.data.nextCursor;
        patchRoomState(roomId, (state) => ({
          items: sortByCreatedAt([
            ...older.filter(
              (item) => !state.items.some((existing) => existing.id === item.id),
            ),
            ...state.items,
          ]),
          nextCursor,
        }));
      }
      patchRoomState(roomId, { isLoadingMore: false });
    },
    [patchRoomState],
  );

  const markTyping = useCallback((userId: string, active: boolean) => {
    const timers = typingTimersRef.current;
    const existing = timers.get(userId);
    if (existing) clearTimeout(existing);
    if (!active) {
      timers.delete(userId);
      setTypingUserIds((previous) => previous.filter((id) => id !== userId));
      return;
    }
    setTypingUserIds((previous) =>
      previous.includes(userId) ? previous : [...previous, userId],
    );
    timers.set(
      userId,
      setTimeout(() => {
        timers.delete(userId);
        setTypingUserIds((previous) => previous.filter((id) => id !== userId));
      }, TYPING_CLEAR_MS),
    );
  }, []);

  useCachedState<Record<string, string>>({
    key: identityId ? draftsCacheKey(identityId) : null,
    value: drafts,
    onHydrate: (cached) =>
      setDrafts((previous) => ({ ...cached, ...previous })),
    enabled: Boolean(identityId),
  });

  useEffect(() => {
    if (!identityId) return;
    for (const room of rooms.slice(0, CACHED_ROOMS)) {
      void cacheRead<IClientMessage[]>(messagesCacheKey(identityId, room.id));
    }
  }, [identityId, rooms]);

  useLayoutEffect(() => {
    if (!identityId || !activeRoomId) return;
    if (byRoomRef.current[activeRoomId]?.isHydrated) return;
    const key = messagesCacheKey(identityId, activeRoomId);
    const warm = cacheReadSync<IClientMessage[]>(key);
    if (warm) {
      patchRoomState(activeRoomId, (current) => ({
        items: mergeCachedMessages(warm, current.items),
        isHydrated: true,
      }));
      return;
    }
    let cancelled = false;
    void cacheRead<IClientMessage[]>(key).then((cached) => {
      if (cancelled) return;
      patchRoomState(activeRoomId, (current) => ({
        items: cached
          ? mergeCachedMessages(cached, current.items)
          : current.items,
        isHydrated: true,
      }));
    });
    return () => {
      cancelled = true;
    };
  }, [activeRoomId, identityId, patchRoomState]);

  useEffect(() => {
    if (!identityId || !activeRoomId) return;
    const state = byRoom[activeRoomId];
    if (!state?.isHydrated) return;
    cacheWrite(
      messagesCacheKey(identityId, activeRoomId),
      persistable(state.items),
    );
  }, [activeRoomId, byRoom, identityId]);

  useEffect(() => {
    setTypingUserIds([]);
    typingTimersRef.current.forEach((timer) => clearTimeout(timer));
    typingTimersRef.current.clear();
    if (!activeRoomId) {
      leaveRoom();
      return;
    }
    joinRoom(activeRoomId);
    void refetch(activeRoomId);

    const onNew = (payload: unknown) => {
      const message = payload as IMessage;
      if (message.roomId !== activeRoomId) return;
      reconcileMessage(message.roomId, message);
      markTyping(message.senderId, false);
      upsertRoom(message.roomId, {
        lastMessage: message,
        lastMessageAt: message.createdAt,
        ...(message.senderId === profile?.id ? {} : { unreadCount: 0 }),
      });
    };
    const onUpdated = (payload: unknown) => {
      const message = payload as IMessage;
      if (message.roomId !== activeRoomId) return;
      reconcileMessage(message.roomId, message);
    };
    const onSeen = (payload: unknown) => {
      const seen = payload as ISeenPayload;
      if (!seen?.roomId || seen.userId === profile?.id) return;
      const target = (byRoomRef.current[seen.roomId] ?? EMPTY_ROOM_MESSAGES)
        .items.find((item) => item.id === seen.lastSeenMessageId);
      markRoomSeenLocally(seen.roomId, {
        lastSeenMessageId: seen.lastSeenMessageId,
        lastSeenAt: target?.createdAt ?? new Date().toISOString(),
      });
    };
    const onTypingStart = (payload: unknown) => {
      const typing = payload as ITypingPayload;
      if (typing.userId === profile?.id) return;
      markTyping(typing.userId, true);
    };
    const onTypingStop = (payload: unknown) => {
      const typing = payload as ITypingPayload;
      markTyping(typing.userId, false);
    };

    on(MESSAGE_EVENTS.NEW, onNew);
    on(MESSAGE_EVENTS.UPDATED, onUpdated);
    on(MESSAGE_EVENTS.SEEN, onSeen);
    on(MESSAGE_EVENTS.TYPING_START, onTypingStart);
    on(MESSAGE_EVENTS.TYPING_STOP, onTypingStop);
    return () => {
      off(MESSAGE_EVENTS.NEW, onNew);
      off(MESSAGE_EVENTS.UPDATED, onUpdated);
      off(MESSAGE_EVENTS.SEEN, onSeen);
      off(MESSAGE_EVENTS.TYPING_START, onTypingStart);
      off(MESSAGE_EVENTS.TYPING_STOP, onTypingStop);
    };
  }, [
    activeRoomId,
    joinRoom,
    leaveRoom,
    markRoomSeenLocally,
    markTyping,
    off,
    on,
    profile?.id,
    reconcileMessage,
    refetch,
    upsertRoom,
  ]);

  useEffect(() => {
    if (!activeRoomId || connectionKey < 2) return;
    void refetch(activeRoomId, { isSilent: true });
  }, [activeRoomId, connectionKey, refetch]);

  useEffect(() => {
    if (!activeRoomId) return;
    const onFocus = () => {
      if (document.visibilityState !== "visible") return;
      void refetch(activeRoomId, { isSilent: true });
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [activeRoomId, refetch]);

  const value = useMemo<MessageContextType>(
    () => ({
      byRoom,
      drafts,
      typingUserIds,
      seenByRoom,
      getRoomState,
      setDraft,
      refetch,
      loadOlder,
      upsertMessage,
      reconcileMessage,
      patchMessage,
      removeMessage,
      markRoomSeenLocally,
    }),
    [
      byRoom,
      drafts,
      typingUserIds,
      seenByRoom,
      getRoomState,
      setDraft,
      refetch,
      loadOlder,
      upsertMessage,
      reconcileMessage,
      patchMessage,
      removeMessage,
      markRoomSeenLocally,
    ],
  );

  return (
    <MessageContext.Provider value={value}>{children}</MessageContext.Provider>
  );
};

export const useMessageContext = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error("useMessageContext must be used within a MessageProvider");
  }
  return context;
};
