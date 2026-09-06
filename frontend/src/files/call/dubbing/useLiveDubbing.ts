import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LiveServerMessage, Session } from "@google/genai";
import { handleApiAction } from "@/utils";
import usePcmCapture from "@/hooks/usePcmCapture";
import usePcmPlayer from "@/hooks/usePcmPlayer";
import DubbingService from "./dubbing.service";
import {
  CAPTURE_MIME_TYPE,
  DUBBING_COPY,
  DUBBING_HISTORY_LINES,
  MAX_DUBBING_LINE_CHARS,
  PLAYBACK_SAMPLE_RATE,
  RECONNECT_BASE_MS,
  RECONNECT_MAX_MS,
  TOKEN_REFRESH_MARGIN_MS,
} from "./dubbing.constants";
import { dubbingUnavailableReason, nextBackoffMs } from "./dubbing.utils";
import type {
  DubbingState,
  IDubbingLine,
  IDubbingResult,
  IDubbingSessionData,
} from "./dubbing.interface";

interface UseLiveDubbingOptions {
  callId: string;
  isEnabled: boolean;
  myLang: string;
  otherUserLang: string;
  remoteTrack: MediaStreamTrack | null;
  isRemoteSpeaking: boolean;
}

const emptyLine = (): IDubbingLine => ({
  id: crypto.randomUUID(),
  original: "",
  translation: "",
  isFinal: false,
});

const useLiveDubbing = ({
  callId,
  isEnabled,
  myLang,
  otherUserLang,
  remoteTrack,
  isRemoteSpeaking,
}: UseLiveDubbingOptions): IDubbingResult => {
  const [state, setState] = useState<DubbingState>("off");
  const [lines, setLines] = useState<IDubbingLine[]>([]);
  const [current, setCurrent] = useState<IDubbingLine | null>(null);

  const sessionRef = useRef<Session | null>(null);
  const credentialsRef = useRef<IDubbingSessionData | null>(null);
  const resumeHandleRef = useRef<string | undefined>(undefined);
  const isConstrainedRef = useRef(false);
  const attemptRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isStoppedRef = useRef(true);
  const currentRef = useRef<IDubbingLine>(emptyLine());
  const connectRef = useRef<() => Promise<void>>(async () => {});

  const { push, flush, isSpeaking, isSpeakingRef } = usePcmPlayer({
    sampleRate: PLAYBACK_SAMPLE_RATE,
  });

  const unavailableReason = useMemo(
    () => dubbingUnavailableReason(myLang, otherUserLang),
    [myLang, otherUserLang],
  );

  const commitCurrent = useCallback(() => {
    const line = currentRef.current;
    if (!line.original && !line.translation) return;
    setLines((previous) =>
      [...previous, { ...line, isFinal: true }].slice(-(DUBBING_HISTORY_LINES + 2)),
    );
    currentRef.current = emptyLine();
    setCurrent(null);
  }, []);

  const appendToCurrent = useCallback(
    (changes: { original?: string; translation?: string }) => {
      const line = currentRef.current;
      currentRef.current = {
        ...line,
        original: line.original + (changes.original ?? ""),
        translation: line.translation + (changes.translation ?? ""),
      };
      setCurrent(currentRef.current);
      if (currentRef.current.translation.length > MAX_DUBBING_LINE_CHARS) {
        commitCurrent();
      }
    },
    [commitCurrent],
  );

  const fetchCredentials = useCallback(async () => {
    const existing = credentialsRef.current;
    const expiresAt = existing ? new Date(existing.expiresAt).getTime() : 0;
    if (existing && expiresAt - Date.now() > TOKEN_REFRESH_MARGIN_MS) {
      return existing;
    }
    const outcome: {
      data: IDubbingSessionData | null;
      isLimited: boolean;
    } = { data: null, isLimited: false };
    await handleApiAction({
      action: () => DubbingService.startSession(callId, { targetLang: myLang }),
      onSuccess: (result) => {
        outcome.data = result?.data ?? null;
      },
      onError: (error) => {
        outcome.isLimited = error?.response?.status === 429;
      },
      setLoading: () => {},
      errorMessage: DUBBING_COPY.FAILED,
      isToastDisabled: true,
    });
    if (outcome.isLimited) {
      isStoppedRef.current = true;
      setState("limited");
      return null;
    }
    credentialsRef.current = outcome.data;
    return outcome.data;
  }, [callId, myLang]);

  const scheduleReconnect = useCallback(() => {
    if (isStoppedRef.current || retryTimerRef.current) return;
    attemptRef.current += 1;
    setState("reconnecting");
    retryTimerRef.current = setTimeout(
      () => {
        retryTimerRef.current = null;
        void connectRef.current();
      },
      nextBackoffMs(attemptRef.current, RECONNECT_BASE_MS, RECONNECT_MAX_MS),
    );
  }, []);

  const handleMessage = useCallback(
    (message: LiveServerMessage) => {
      if (message.setupComplete) {
        attemptRef.current = 0;
        setState("listening");
      }

      const update = message.sessionResumptionUpdate;
      if (update?.resumable && update.newHandle) {
        resumeHandleRef.current = update.newHandle;
      }

      const content = message.serverContent;
      if (content?.interrupted) flush();
      if (content?.inputTranscription?.text) {
        appendToCurrent({ original: content.inputTranscription.text });
      }
      if (content?.outputTranscription?.text) {
        appendToCurrent({ translation: content.outputTranscription.text });
      }
      for (const part of content?.modelTurn?.parts ?? []) {
        if (part.inlineData?.data) push(part.inlineData.data);
      }
      if (content?.turnComplete || content?.generationComplete) commitCurrent();

      if (message.goAway) {
        sessionRef.current?.close();
        sessionRef.current = null;
        scheduleReconnect();
      }
    },
    [appendToCurrent, commitCurrent, flush, push, scheduleReconnect],
  );

  const connect = useCallback(async () => {
    if (isStoppedRef.current || sessionRef.current) return;
    setState((previous) =>
      previous === "reconnecting" ? previous : "connecting",
    );

    const credentials = await fetchCredentials();
    if (!credentials || isStoppedRef.current) return;

    const { GoogleGenAI, Modality } = await import("@google/genai");
    if (isStoppedRef.current) return;

    const client = new GoogleGenAI({
      apiKey: credentials.token,
      httpOptions: { apiVersion: "v1alpha" },
    });

    const config = {
      responseModalities: [Modality.AUDIO],
      translationConfig: {
        targetLanguageCode: credentials.targetLang,
        echoTargetLanguage: false,
      },
      inputAudioTranscription: {},
      outputAudioTranscription: {},
      ...(isConstrainedRef.current
        ? {}
        : {
            sessionResumption: resumeHandleRef.current
              ? { handle: resumeHandleRef.current }
              : {},
            contextWindowCompression: { slidingWindow: {} },
          }),
    };

    try {
      const session = await client.live.connect({
        model: `models/${credentials.model}`,
        config,
        callbacks: {
          onmessage: handleMessage,
          onerror: () => {
            sessionRef.current = null;
            scheduleReconnect();
          },
          onclose: () => {
            sessionRef.current = null;
            scheduleReconnect();
          },
        },
      });
      if (isStoppedRef.current) {
        session.close();
        return;
      }
      sessionRef.current = session;
    } catch (error) {
      if (!isConstrainedRef.current) {
        isConstrainedRef.current = true;
        void connect();
        return;
      }
      console.error("dubbing session failed to connect", error);
      scheduleReconnect();
    }
  }, [fetchCredentials, handleMessage, scheduleReconnect]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  const sendChunk = useCallback((base64: string) => {
    sessionRef.current?.sendRealtimeInput({
      audio: { data: base64, mimeType: CAPTURE_MIME_TYPE },
    });
  }, []);

  const isActive = isEnabled && !unavailableReason && Boolean(remoteTrack);

  const { setIsSending } = usePcmCapture({
    track: remoteTrack,
    isEnabled: isActive,
    onChunk: sendChunk,
  });

  useEffect(() => {
    setIsSending(isActive && (isRemoteSpeaking || isSpeakingRef.current));
  }, [isActive, isRemoteSpeaking, isSpeakingRef, setIsSending]);

  useEffect(() => {
    if (!isActive) return;
    isStoppedRef.current = false;
    void connect();

    return () => {
      isStoppedRef.current = true;
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      sessionRef.current?.close();
      sessionRef.current = null;
      credentialsRef.current = null;
      resumeHandleRef.current = undefined;
      attemptRef.current = 0;
      flush();
      currentRef.current = emptyLine();
      setCurrent(null);
      setLines([]);
      setState("off");
    };
  }, [connect, flush, isActive]);

  const resolvedState: DubbingState = !isEnabled
    ? "off"
    : unavailableReason
      ? "unavailable"
      : state === "listening" && isSpeaking
        ? "speaking"
        : state;

  return {
    state: resolvedState,
    lines: lines.slice(-DUBBING_HISTORY_LINES),
    current,
    isSpeaking,
    isSpeakingRef,
    unavailableReason,
  };
};

export default useLiveDubbing;
