import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRoomSocket } from "@/context/RoomSocketContext";
import { useRoomContext } from "@/files/room/room.context";
import { useAuthContext } from "@/files/auth/auth.context";
import MessageService from "./message.service";
import { MESSAGE_EVENTS, TYPING_CLEAR_MS } from "./message.constants";
import type {
  IClientMessage,
  IMessage,
  ITypingPayload,
  MessageContextType,
} from "./message.interface";
import type { ReactNode } from "react";

const MessageContext = createContext<MessageContextType | undefined>(undefined);

const sortByCreatedAt = (items: IClientMessage[]) =>
  [...items].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

export const MessageProvider = ({ children }: { children: ReactNode }) => {
  const { activeRoomId, upsertRoom } = useRoomContext();
  const { profile } = useAuthContext();
  const { joinRoom, leaveRoom, on, off } = useRoomSocket();
  const [messages, setMessages] = useState<IClientMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [typingUserIds, setTypingUserIds] = useState<string[]>([]);
  const typingTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  const roomRef = useRef<string | null>(null);

  const upsertMessage = useCallback(
    (message: IClientMessage, replaceId?: string) => {
      setMessages((previous) => {
        const withoutReplaced = replaceId
          ? previous.filter((item) => item.id !== replaceId)
          : previous;
        const exists = withoutReplaced.some((item) => item.id === message.id);
        const merged = exists
          ? withoutReplaced.map((item) =>
              item.id === message.id ? { ...item, ...message } : item,
            )
          : [...withoutReplaced, message];
        return sortByCreatedAt(merged);
      });
    },
    [],
  );

  const removeMessage = useCallback((id: string) => {
    setMessages((previous) => previous.filter((item) => item.id !== id));
  }, []);

  const refetch = useCallback(async () => {
    const roomId = roomRef.current;
    if (!roomId) return;
    setIsLoading(true);
    try {
      const result = await MessageService.getMessages(roomId);
      if (roomRef.current !== roomId) return;
      if (result?.data?.items) {
        const fetched = sortByCreatedAt(result.data.items);
        setMessages((previous) => {
          const pending = previous.filter((item) => item.clientStatus);
          return sortByCreatedAt([...fetched, ...pending]);
        });
        setNextCursor(result.data.nextCursor);
      }
    } catch {
      setMessages((previous) => previous);
    } finally {
      if (roomRef.current === roomId) {
        setIsLoading(false);
        setHasFetched(true);
      }
    }
  }, []);

  const loadOlder = useCallback(async () => {
    const roomId = roomRef.current;
    if (!roomId || !nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const result = await MessageService.getMessages(roomId, nextCursor);
      if (roomRef.current !== roomId) return;
      if (result?.data?.items) {
        const older = result.data.items;
        setMessages((previous) =>
          sortByCreatedAt([
            ...older.filter(
              (item) => !previous.some((existing) => existing.id === item.id),
            ),
            ...previous,
          ]),
        );
        setNextCursor(result.data.nextCursor);
      }
    } catch {
      setMessages((previous) => previous);
    } finally {
      if (roomRef.current === roomId) setIsLoadingMore(false);
    }
  }, [nextCursor, isLoadingMore]);

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

  useEffect(() => {
    roomRef.current = activeRoomId;
    setMessages([]);
    setNextCursor(null);
    setHasFetched(false);
    setTypingUserIds([]);
    if (!activeRoomId) {
      leaveRoom();
      return;
    }
    joinRoom(activeRoomId);
    void refetch();

    const onNew = (payload: unknown) => {
      const message = payload as IMessage;
      if (message.roomId !== roomRef.current) return;
      upsertMessage(message);
      markTyping(message.senderId, false);
      upsertRoom(message.roomId, {
        lastMessage: message,
        lastMessageAt: message.createdAt,
      });
    };
    const onUpdated = (payload: unknown) => {
      const message = payload as IMessage;
      if (message.roomId !== roomRef.current) return;
      upsertMessage(message);
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
    on(MESSAGE_EVENTS.TYPING_START, onTypingStart);
    on(MESSAGE_EVENTS.TYPING_STOP, onTypingStop);
    return () => {
      off(MESSAGE_EVENTS.NEW, onNew);
      off(MESSAGE_EVENTS.UPDATED, onUpdated);
      off(MESSAGE_EVENTS.TYPING_START, onTypingStart);
      off(MESSAGE_EVENTS.TYPING_STOP, onTypingStop);
      leaveRoom();
    };
  }, [
    activeRoomId,
    joinRoom,
    leaveRoom,
    markTyping,
    off,
    on,
    profile?.id,
    refetch,
    upsertMessage,
    upsertRoom,
  ]);

  const value = useMemo<MessageContextType>(
    () => ({
      messages,
      isLoading,
      hasFetched,
      isLoadingMore,
      nextCursor,
      typingUserIds,
      refetch,
      loadOlder,
      upsertMessage,
      removeMessage,
    }),
    [
      messages,
      isLoading,
      hasFetched,
      isLoadingMore,
      nextCursor,
      typingUserIds,
      refetch,
      loadOlder,
      upsertMessage,
      removeMessage,
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
