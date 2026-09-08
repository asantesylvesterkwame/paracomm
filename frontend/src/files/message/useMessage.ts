import { useCallback, useEffect, useRef, useState } from "react";
import { handleApiAction, notify } from "@/utils";
import { useRoomSocket } from "@/context/RoomSocketContext";
import { useRoomContext } from "@/files/room/room.context";
import { useAuthContext } from "@/files/auth/auth.context";
import MessageService from "./message.service";
import VoiceNoteService from "./voice-note/voice-note.service";
import { useMessageContext } from "./message.context";
import { MESSAGE_EVENTS, TYPING_THROTTLE_MS } from "./message.constants";
import { VOICE_COPY } from "./voice-note/voice-note.constants";
import { pendingRecordingStore } from "./voice-note/voice-note.utils";
import {
  classifySendError,
  failedMessagesOf,
  isTempMessage,
  sortByCreatedAt,
  tempIdOf,
} from "./message.utils";
import type { IClientMessage } from "./message.interface";
import type { IRecording } from "./voice-note/voice-note.interface";

const RECORDING_LOST_ERROR = { code: "RECORDING_LOST", response: { status: 400 } };

const sendByKind = (roomId: string, message: IClientMessage) => {
  if (message.kind === "voice") {
    const recording = pendingRecordingStore.get(message.clientId);
    if (!recording) return Promise.reject(RECORDING_LOST_ERROR);
    return VoiceNoteService.sendVoiceNote(
      roomId,
      recording,
      message.clientId ?? message.id,
    );
  }
  return MessageService.sendMessage(
    roomId,
    message.originalText,
    message.clientId ?? message.id,
  );
};

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
          action: () => sendByKind(targetRoomId, message),
          onSuccess: (result) => {
            if (!result?.data) {
              removeMessage(targetRoomId, message.id);
              return;
            }
            if (message.kind === "voice") {
              pendingRecordingStore.take(message.clientId);
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
      voiceNoteId: null,
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

  const sendVoiceNote = useCallback(
    (recording: IRecording) => {
      if (!roomId) {
        notify({
          type: "error",
          message: "Open a conversation first",
          description: "Pick a chat from the list, then record your note.",
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
      const tempId = tempIdOf(clientId);
      const optimistic: IClientMessage = {
        id: tempId,
        roomId,
        clientId,
        senderId: profile.id,
        kind: "voice",
        callId: null,
        voiceNoteId: null,
        voiceNote: {
          id: tempId,
          messageId: tempId,
          roomId,
          senderId: profile.id,
          mimeType: recording.mimeType,
          durationMs: recording.durationMs,
          byteSize: recording.blob.size,
          transcript: null,
          transcriptLang: null,
          transcriptionStatus: "pending",
          transcriptionError: null,
          dubs: [],
          createdAt: now,
          updatedAt: now,
        },
        originalText: VOICE_COPY.PREVIEW,
        originalLang: profile.preferredLang,
        translatedText: null,
        translatedLang: null,
        translationStatus: "none",
        translationError: null,
        createdAt: now,
        updatedAt: now,
        clientStatus: "sending",
        localAudioUrl: URL.createObjectURL(recording.blob),
      };
      pendingRecordingStore.put(clientId, recording);
      upsertMessage(roomId, optimistic);
      upsertRoom(roomId, { lastMessage: optimistic, lastMessageAt: now });
      stopTyping();
      void dispatchSend(roomId, optimistic);
    },
    [dispatchSend, profile, roomId, stopTyping, upsertMessage, upsertRoom],
  );

  const dismissMessage = useCallback(
    (id: string) => {
      if (!roomId) return;
      removeMessage(roomId, id);
    },
    [removeMessage, roomId],
  );

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
    sendVoiceNote,
    dismissMessage,
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
