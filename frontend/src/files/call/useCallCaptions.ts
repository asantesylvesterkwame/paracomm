import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useActiveSpeakerId,
  useAppMessage,
  useLocalSessionId,
} from "@daily-co/daily-react";
import { handleApiAction } from "@/utils";
import { splitOversizedUtterance } from "@/utils/text";
import useDictation from "@/hooks/useDictation";
import useSerialQueue, { type QueueOutcome } from "@/hooks/useSerialQueue";
import { useAuthContext } from "@/files/auth/auth.context";
import CallService from "./call.service";
import {
  CAPTION_HISTORY_LINES,
  CAPTION_INTERIM_CLEAR_MS,
  CAPTION_WIRE_KIND,
  MAX_CAPTION_CHARS,
} from "./call.constants";
import {
  dictationLocaleOf,
  isCaptionSupported,
  isCaptionWireMessage,
} from "./call.utils";
import type { ICaption, ICaptionWireMessage } from "./call.interface";

interface UseCallCaptionsOptions {
  callId: string;
  isEnabled: boolean;
  isMicMuted: boolean;
  otherUserLang: string;
  isDubbingActive: boolean;
  isDubSpeaking: boolean;
}

const useCallCaptions = ({
  callId,
  isEnabled,
  isMicMuted,
  otherUserLang,
  isDubbingActive,
  isDubSpeaking,
}: UseCallCaptionsOptions) => {
  const { profile } = useAuthContext();
  const localSessionId = useLocalSessionId();
  const activeSpeakerId = useActiveSpeakerId();

  const [captions, setCaptions] = useState<ICaption[]>([]);
  const [remoteInterim, setRemoteInterim] = useState("");

  const seqRef = useRef(0);
  const captionsRef = useRef<ICaption[]>([]);
  const isDubbingActiveRef = useRef(isDubbingActive);
  const wasLocalActiveRef = useRef(false);
  const remoteInterimTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    isDubbingActiveRef.current = isDubbingActive;
  }, [isDubbingActive]);

  const myLang = profile?.preferredLang ?? "en";
  const previousLangRef = useRef(myLang);
  const isSupported = useMemo(() => isCaptionSupported(), []);
  const dictationLocale = useMemo(() => dictationLocaleOf(myLang), [myLang]);

  useEffect(() => {
    captionsRef.current = captions;
  }, [captions]);

  const upsertCaption = useCallback(
    (id: string, changes: Partial<ICaption>) => {
      setCaptions((previous) =>
        previous.map((item) => (item.id === id ? { ...item, ...changes } : item)),
      );
    },
    [],
  );

  const pushCaption = useCallback((caption: ICaption) => {
    setCaptions((previous) =>
      [...previous, caption].slice(-(CAPTION_HISTORY_LINES + 4)),
    );
  }, []);

  const translateCaption = useCallback(
    (caption: ICaption) =>
      new Promise<QueueOutcome>((resolve) => {
        void handleApiAction({
          action: () =>
            CallService.translateCaption(callId, {
              text: caption.originalText,
              sourceLang: caption.originalLang,
              targetLang: myLang,
            }),
          onSuccess: (result) => {
            const translation = result?.data?.translation;
            upsertCaption(caption.id, {
              translation: translation ?? null,
              status: translation ? "done" : "untranslated",
            });
            resolve({ outcome: "done" });
          },
          onError: (error) => {
            const status = error?.response?.status;
            const retryAfter = Number(
              error?.response?.headers?.["retry-after"] ?? 0,
            );
            if (status === 429 && retryAfter > 0 && retryAfter <= 60) {
              resolve({ outcome: "retry", afterSeconds: retryAfter });
              return;
            }
            upsertCaption(caption.id, { status: "untranslated" });
            resolve({ outcome: "failed" });
          },
          setLoading: () => {},
          errorMessage: "We could not translate that line",
          isToastDisabled: true,
        });
      }),
    [callId, myLang, upsertCaption],
  );

  const handleAbort = useCallback(
    (remaining: ICaption[]) => {
      for (const caption of remaining) {
        upsertCaption(caption.id, { status: "untranslated" });
      }
    },
    [upsertCaption],
  );

  const { enqueue, clear } = useSerialQueue<ICaption>({
    process: translateCaption,
    onAbort: handleAbort,
  });

  useEffect(() => {
    if (previousLangRef.current === myLang) return;
    previousLangRef.current = myLang;
    const stale = captionsRef.current.filter(
      (caption) => !caption.isOwn && caption.originalLang !== myLang,
    );
    setCaptions((previous) =>
      previous.map((caption) => {
        if (caption.isOwn) return caption;
        if (caption.originalLang === myLang) {
          return { ...caption, translation: null, status: "untranslated" };
        }
        return { ...caption, status: "pending" };
      }),
    );
    if (stale.length > 0) enqueue(stale);
  }, [enqueue, myLang]);

  const receiveWireMessage = useCallback(
    (message: ICaptionWireMessage, sessionId: string) => {
      if (isDubbingActiveRef.current) return;
      if (message.state === "interim") {
        setRemoteInterim(message.text);
        if (remoteInterimTimerRef.current) {
          clearTimeout(remoteInterimTimerRef.current);
        }
        remoteInterimTimerRef.current = setTimeout(
          () => setRemoteInterim(""),
          CAPTION_INTERIM_CLEAR_MS,
        );
        return;
      }
      setRemoteInterim("");
      const caption: ICaption = {
        id: `${sessionId}-${message.seq}`,
        sessionId,
        isOwn: false,
        originalText: message.text,
        originalLang: message.lang,
        translation: null,
        status: message.lang === myLang ? "untranslated" : "pending",
        createdAt: Date.now(),
      };
      pushCaption(caption);
      if (caption.status === "pending") enqueue(caption);
    },
    [enqueue, myLang, pushCaption],
  );

  const sendAppMessage = useAppMessage<ICaptionWireMessage>({
    onAppMessage: (event) => {
      if (!isCaptionWireMessage(event.data)) return;
      if (event.fromId === localSessionId) return;
      receiveWireMessage(event.data, event.fromId ?? "remote");
    },
  });

  useEffect(() => {
    if (activeSpeakerId && activeSpeakerId === localSessionId) {
      wasLocalActiveRef.current = true;
    }
  }, [activeSpeakerId, localSessionId]);

  const handleFinal = useCallback(
    (text: string) => {
      const isEcho = Boolean(activeSpeakerId) && !wasLocalActiveRef.current;
      wasLocalActiveRef.current = false;
      if (isEcho) return;
      const pieces = splitOversizedUtterance(text, MAX_CAPTION_CHARS);
      for (const piece of pieces) {
        seqRef.current += 1;
        const seq = seqRef.current;
        sendAppMessage({
          kind: CAPTION_WIRE_KIND,
          state: "final",
          seq,
          text: piece,
          lang: myLang,
        });
        pushCaption({
          id: `${localSessionId ?? "local"}-${seq}`,
          sessionId: localSessionId ?? "local",
          isOwn: true,
          originalText: piece,
          originalLang: myLang,
          translation: null,
          status: "untranslated",
          createdAt: Date.now(),
        });
      }
    },
    [activeSpeakerId, localSessionId, myLang, pushCaption, sendAppMessage],
  );

  const isDictationOn = isEnabled && isSupported && !isMicMuted;

  const { interimTranscript, isMicrophoneAvailable, reset } = useDictation({
    lang: dictationLocale,
    isEnabled: isDictationOn,
    isPaused: isDubSpeaking,
    onFinal: handleFinal,
  });

  const interim = isDictationOn ? interimTranscript : "";

  useEffect(() => {
    if (!interim) return;
    sendAppMessage({
      kind: CAPTION_WIRE_KIND,
      state: "interim",
      seq: seqRef.current,
      text: interim,
      lang: myLang,
    });
  }, [interim, myLang, sendAppMessage]);

  useEffect(() => {
    if (isDictationOn) return;
    reset();
  }, [isDictationOn, reset]);

  useEffect(() => {
    return () => {
      clear();
      if (remoteInterimTimerRef.current) {
        clearTimeout(remoteInterimTimerRef.current);
      }
    };
  }, [clear]);

  const visibleCaptions = useMemo(
    () => captions.slice(-CAPTION_HISTORY_LINES),
    [captions],
  );

  return {
    captions: visibleCaptions,
    interim,
    remoteInterim,
    isSupported,
    isMicrophoneAvailable,
    myLang,
    otherUserLang,
  };
};

export default useCallCaptions;
