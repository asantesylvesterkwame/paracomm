import { useCallback, useRef, useState } from "react";
import { handleApiAction } from "@/utils";
import { useRoomSocket } from "@/context/RoomSocketContext";
import { useRoomContext } from "@/files/room/room.context";
import { useAuthContext } from "@/files/auth/auth.context";
import MessageService from "./message.service";
import { useMessageContext } from "./message.context";
import { MESSAGE_EVENTS, TYPING_THROTTLE_MS } from "./message.constants";
import type { IClientMessage } from "./message.interface";

const useMessage = () => {
  const { activeRoomId } = useRoomContext();
  const { profile } = useAuthContext();
  const { sendEvent } = useRoomSocket();
  const { messages, upsertMessage, removeMessage } = useMessageContext();
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingRetryTranslation, setIsLoadingRetryTranslation] =
    useState(false);
  const lastTypingRef = useRef(0);

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

  const send = useCallback(() => {
    const text = draft.trim();
    if (!text || !activeRoomId || !profile) return;
    const now = new Date().toISOString();
    const optimistic: IClientMessage = {
      id: `temp_${crypto.randomUUID()}`,
      roomId: activeRoomId,
      senderId: profile.id,
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
    upsertMessage(optimistic);
    setDraft("");
    stopTyping();
    void handleApiAction({
      action: () => MessageService.sendMessage(activeRoomId, text),
      onSuccess: (result) => {
        if (result?.data) {
          upsertMessage(result.data, optimistic.id);
        } else {
          removeMessage(optimistic.id);
        }
      },
      onError: () => {
        upsertMessage({ ...optimistic, clientStatus: "failed" });
      },
      setLoading: setIsSending,
      errorMessage: "We could not send that message",
      isToastDisabled: true,
    });
  }, [activeRoomId, draft, profile, removeMessage, stopTyping, upsertMessage]);

  const retrySend = useCallback(
    (id: string) => {
      const failed = messages.find(
        (item) => item.id === id && item.clientStatus === "failed",
      );
      if (!failed || !activeRoomId) return;
      upsertMessage({ ...failed, clientStatus: "sending" });
      void handleApiAction({
        action: () =>
          MessageService.sendMessage(activeRoomId, failed.originalText),
        onSuccess: (result) => {
          if (result?.data) {
            upsertMessage(result.data, failed.id);
          }
        },
        onError: () => {
          upsertMessage({ ...failed, clientStatus: "failed" });
        },
        setLoading: setIsSending,
        errorMessage: "We could not send that message",
        isToastDisabled: true,
      });
    },
    [activeRoomId, messages, upsertMessage],
  );

  const retryTranslation = useCallback(
    (messageId: string) => {
      if (!activeRoomId) return;
      void handleApiAction({
        action: () => MessageService.retryTranslation(activeRoomId, messageId),
        onSuccess: (result) => {
          if (result?.data) upsertMessage(result.data);
        },
        setLoading: setIsLoadingRetryTranslation,
        errorMessage: "We could not translate that message again",
      });
    },
    [activeRoomId, upsertMessage],
  );

  const markSeen = useCallback(
    (lastSeenMessageId: string) => {
      if (!activeRoomId || lastSeenMessageId.startsWith("temp_")) return;
      MessageService.markSeen(activeRoomId, lastSeenMessageId).catch(() => {});
    },
    [activeRoomId],
  );

  return {
    draft,
    setDraft,
    send,
    retrySend,
    retryTranslation,
    markSeen,
    emitTyping,
    stopTyping,
    isSending,
    isLoadingRetryTranslation,
  };
};

export default useMessage;
