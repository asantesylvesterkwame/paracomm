import { useCallback, useEffect, useRef, useState } from "react";
import { handleApiAction, notify } from "@/utils";
import { useRoomSocket } from "@/context/RoomSocketContext";
import { useRoomContext } from "@/files/room/room.context";
import { useAuthContext } from "@/files/auth/auth.context";
import MessageService from "./message.service";
import { useMessageContext } from "./message.context";
import { MESSAGE_EVENTS, TYPING_THROTTLE_MS } from "./message.constants";
import {
  classifySendError,
  failedMessagesOf,
  isTempMessage,
  sortByCreatedAt,
  tempIdOf,
} from "./message.utils";
import type { IClientMessage } from "./message.interface";

const useMessage = (roomId?: string) => {
  const { profile } = useAuthContext();
  const { sendEvent, connectionKey } = useRoomSocket();
  const { upsertRoom } = useRoomContext();
  const {
    drafts,
    setDraft: setRoomDraft,
    getRoomState,
    upsertMessage,
    reconcileMessage,
    patchMessage,
    removeMessage,
  } = useMessageContext();
  const [isSending, setIsSending] = useState(false);
  const [isLoadingRetryTranslation, setIsLoadingRetryTranslation] =
    useState(false);
  const lastTypingRef = useRef(0);
  const queueRef = useRef<Promise<unknown>>(Promise.resolve());
  const draft = (roomId && drafts[roomId]) || "";

  const setDraft = useCallback(
    (value: string) => {
      if (!roomId) return;
      setRoomDraft(roomId, value);
    },
    [roomId, setRoomDraft],
  );

  const emitTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastTypingRef.current < TYPING_THROTTLE_MS) return;
    lastTypingRef.current = now;
    sendEvent(MESSAGE_EVENTS.TYPING_START);
  }, [sendEvent]);

  const stopTyping = useCallback(() => {
    lastTypingRef.current = 0;
    sendEvent(MESSAGE_EVENTS.TYPING_STOP);
  }, [sendEvent]);

  const dispatchSend = useCallback(
    (targetRoomId: string, message: IClientMessage) => {
      queueRef.current = queueRef.current.then(() =>
        handleApiAction({
          action: () =>
            MessageService.sendMessage(
              targetRoomId,
              message.originalText,
              message.clientId ?? message.id,
            ),
          onSuccess: (result) => {
            if (!result?.data) {
              removeMessage(targetRoomId, message.id);
              return;
            }
            reconcileMessage(targetRoomId, result.data, message.id);
            upsertRoom(targetRoomId, {
              lastMessage: result.data,
              lastMessageAt: result.data.createdAt,
            });
          },
          onError: (error) => {
            patchMessage(targetRoomId, message.id, {
              clientStatus: "failed",
              clientError: classifySendError(error),
            });
          },
          setLoading: setIsSending,
          errorMessage: "We could not send that message",
          isToastDisabled: true,
        }),
      );
      return queueRef.current;
    },
    [patchMessage, reconcileMessage, removeMessage, upsertRoom],
  );

  const send = useCallback(() => {
    const text = draft.trim();
    if (!text) return;
    if (!roomId) {
      notify({
        type: "error",
        message: "Open a conversation first",
        description: "Pick a chat from the list, then send your message.",
      });
      return;
    }
    if (!profile) {
      notify({
        type: "error",
        message: "Your profile is still loading",
        description: "Give it a second and try again.",
      });
      return;
    }
    const now = new Date().toISOString();
    const clientId = crypto.randomUUID();
    const optimistic: IClientMessage = {
      id: tempIdOf(clientId),
      roomId,
      clientId,
      senderId: profile.id,
      kind: "text",
      callId: null,
      originalText: text,
      originalLang: profile.preferredLang,
      translatedText: null,
      translatedLang: null,
      translationStatus: "none",
      translationError: null,
      createdAt: now,
      updatedAt: now,
      clientStatus: "sending",
    };
    upsertMessage(roomId, optimistic);
    upsertRoom(roomId, { lastMessage: optimistic, lastMessageAt: now });
    setDraft("");
    stopTyping();
    void dispatchSend(roomId, optimistic);
  }, [
    dispatchSend,
    draft,
    profile,
    roomId,
    setDraft,
    stopTyping,
    upsertMessage,
    upsertRoom,
  ]);

  const retrySend = useCallback(
    (id: string) => {
      if (!roomId) return;
      const failed = getRoomState(roomId).items.find(
        (item) => item.id === id && item.clientStatus === "failed",
      );
      if (!failed) return;
      patchMessage(roomId, id, {
        clientStatus: "sending",
        clientError: undefined,
      });
      void dispatchSend(roomId, { ...failed, clientStatus: "sending" });
    },
    [dispatchSend, getRoomState, patchMessage, roomId],
  );

  const flushQueue = useCallback(() => {
    if (!roomId) return;
    const queued = sortByCreatedAt(
      failedMessagesOf(getRoomState(roomId).items),
    ).filter((item) => item.clientError === "network");
    for (const message of queued) {
      patchMessage(roomId, message.id, {
        clientStatus: "sending",
        clientError: undefined,
      });
      void dispatchSend(roomId, { ...message, clientStatus: "sending" });
    }
  }, [dispatchSend, getRoomState, patchMessage, roomId]);

  const flushQueueRef = useRef(flushQueue);

  useEffect(() => {
    flushQueueRef.current = flushQueue;
  });

  useEffect(() => {
    if (!roomId) return;
    const onOnline = () => flushQueueRef.current();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [roomId]);

  useEffect(() => {
    if (!roomId || connectionKey < 1) return;
    flushQueueRef.current();
  }, [connectionKey, roomId]);

  const retryTranslation = useCallback(
    (messageId: string) => {
      if (!roomId) return;
      void handleApiAction({
        action: () => MessageService.retryTranslation(roomId, messageId),
        onSuccess: (result) => {
          if (result?.data) reconcileMessage(roomId, result.data);
        },
        setLoading: setIsLoadingRetryTranslation,
        errorMessage: "We could not translate that message again",
      });
    },
    [reconcileMessage, roomId],
  );

  const markSeen = useCallback(
    (lastSeenMessageId: string) => {
      if (!roomId || isTempMessage(lastSeenMessageId)) return;
      MessageService.markSeen(roomId, lastSeenMessageId).catch(() => {});
    },
    [roomId],
  );

  return {
    draft,
    setDraft,
    send,
    retrySend,
    flushQueue,
    retryTranslation,
    markSeen,
    emitTyping,
    stopTyping,
    isSending,
    isLoadingRetryTranslation,
  };
};

export default useMessage;
