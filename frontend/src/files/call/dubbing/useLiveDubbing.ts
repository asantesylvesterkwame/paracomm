import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LiveServerMessage, Session } from "@google/genai";
import { handleApiAction } from "@/utils";
import { createLogger, describeError } from "@/utils/logger";
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
  RETARGET_DEBOUNCE_MS,
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

const logger = createLogger("dubbing");

const CHUNK_LOG_EVERY = 25;

const emptyLine = (): IDubbingLine => ({
  id: crypto.randomUUID(),
  original: "",
  translation: "",
  isFinal: false,
});

const summarizeMessage = (message: LiveServerMessage) => {
  const content = message.serverContent;
  const parts = content?.modelTurn?.parts ?? [];
  const audioBytes = parts.reduce(
    (total, part) => total + (part.inlineData?.data?.length ?? 0),
    0,
  );
  return {
    keys: Object.keys(message),
    setupComplete: Boolean(message.setupComplete),
    goAway: message.goAway ?? undefined,
    resumable: message.sessionResumptionUpdate?.resumable,
    interrupted: content?.interrupted,
    turnComplete: content?.turnComplete,
    generationComplete: content?.generationComplete,
    inputText: content?.inputTranscription?.text,
    outputText: content?.outputTranscription?.text,
    audioParts: parts.filter((part) => part.inlineData?.data).length,
    audioBase64Chars: audioBytes,
    textParts: parts.filter((part) => part.text).map((part) => part.text),
    usage: message.usageMetadata,
  };
};

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
  const retargetRef = useRef<() => void>(() => {});
  const targetLangRef = useRef(myLang);
  const connectionSeqRef = useRef(0);
  const sentChunksRef = useRef(0);
  const droppedChunksRef = useRef(0);
  const messagesRef = useRef(0);

  const { push, flush, isSpeaking, isSpeakingRef } = usePcmPlayer({
    sampleRate: PLAYBACK_SAMPLE_RATE,
  });

  const unavailableReason = useMemo(
    () => dubbingUnavailableReason(myLang, otherUserLang),
    [myLang, otherUserLang],
  );

  useEffect(() => {
    targetLangRef.current = myLang;
  }, [myLang]);

  useEffect(() => {
    logger.log("state", state);
  }, [state]);

  const commitCurrent = useCallback(() => {
    const line = currentRef.current;
    if (!line.original && !line.translation) return;
    logger.log("commit line", {
      original: line.original,
      translation: line.translation,
    });
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
    const targetLang = targetLangRef.current;
    const existing = credentialsRef.current;
    const expiresAt = existing ? new Date(existing.expiresAt).getTime() : 0;
    if (
      existing &&
      existing.targetLang === targetLang &&
      expiresAt - Date.now() > TOKEN_REFRESH_MARGIN_MS
    ) {
      logger.log("reusing credentials", {
        model: existing.model,
        targetLang,
        expiresInMs: expiresAt - Date.now(),
      });
      return existing;
    }
    logger.log("requesting credentials", { callId, targetLang });
    const startedAt = performance.now();
    const outcome: {
      data: IDubbingSessionData | null;
      isLimited: boolean;
    } = { data: null, isLimited: false };
    await handleApiAction({
      action: () => DubbingService.startSession(callId, { targetLang }),
      onSuccess: (result) => {
        outcome.data = result?.data ?? null;
        logger.log("credentials received", {
          elapsedMs: Math.round(performance.now() - startedAt),
          model: outcome.data?.model,
          provider: outcome.data?.provider,
          targetLang: outcome.data?.targetLang,
          expiresAt: outcome.data?.expiresAt,
          sessionSeconds: outcome.data?.sessionSeconds,
          remainingSeconds: outcome.data?.remainingSeconds,
          tokenPrefix: outcome.data?.token?.slice(0, 24),
          tokenLength: outcome.data?.token?.length,
          message: result?.message,
        });
      },
      onError: (error) => {
        outcome.isLimited = error?.response?.status === 429;
        logger.error("credentials request failed", {
          elapsedMs: Math.round(performance.now() - startedAt),
          ...describeError(error),
        });
      },
      setLoading: () => {},
      errorMessage: DUBBING_COPY.FAILED,
      isToastDisabled: true,
    });
    if (outcome.isLimited) {
      logger.warn("credentials limited, stopping");
      isStoppedRef.current = true;
      setState("limited");
      return null;
    }
    if (!outcome.data) {
      logger.error(
        "no credentials returned, connect will stop here and no reconnect is scheduled",
      );
    }
    credentialsRef.current = outcome.data;
    return outcome.data;
  }, [callId]);

  const scheduleReconnect = useCallback(() => {
    if (isStoppedRef.current || retryTimerRef.current) {
      logger.log("reconnect skipped", {
        isStopped: isStoppedRef.current,
        hasTimer: Boolean(retryTimerRef.current),
      });
      return;
    }
    attemptRef.current += 1;
    const delayMs = nextBackoffMs(
      attemptRef.current,
      RECONNECT_BASE_MS,
      RECONNECT_MAX_MS,
    );
    logger.warn("scheduling reconnect", {
      attempt: attemptRef.current,
      delayMs,
    });
    setState("reconnecting");
    retryTimerRef.current = setTimeout(() => {
      retryTimerRef.current = null;
      void connectRef.current();
    }, delayMs);
  }, []);

  const handleMessage = useCallback(
    (message: LiveServerMessage) => {
      messagesRef.current += 1;
      logger.log(`message #${messagesRef.current}`, summarizeMessage(message));

      if (message.setupComplete) {
        logger.log("setup complete, now listening");
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
        logger.warn("server sent goAway, closing session", message.goAway);
        connectionSeqRef.current += 1;
        sessionRef.current?.close();
        sessionRef.current = null;
        scheduleReconnect();
      }
    },
    [appendToCurrent, commitCurrent, flush, push, scheduleReconnect],
  );

  const connect = useCallback(async () => {
    if (isStoppedRef.current || sessionRef.current) {
      logger.log("connect skipped", {
        isStopped: isStoppedRef.current,
        hasSession: Boolean(sessionRef.current),
      });
      return;
    }
    connectionSeqRef.current += 1;
    const connectionId = connectionSeqRef.current;
    const isCurrent = () =>
      connectionId === connectionSeqRef.current && !isStoppedRef.current;

    logger.log("connect start", {
      connectionId,
      attempt: attemptRef.current,
      isConstrained: isConstrainedRef.current,
      hasResumeHandle: Boolean(resumeHandleRef.current),
      targetLang: targetLangRef.current,
    });
    setState((previous) =>
      previous === "reconnecting" || previous === "switching"
        ? previous
        : "connecting",
    );

    const credentials = await fetchCredentials();
    if (!credentials || !isCurrent()) {
      logger.warn("connect aborted after credentials step", {
        hasCredentials: Boolean(credentials),
        isStopped: isStoppedRef.current,
        isSuperseded: connectionId !== connectionSeqRef.current,
      });
      return;
    }

    const { GoogleGenAI, Modality } = await import("@google/genai");
    if (!isCurrent()) {
      logger.log("connect aborted, superseded while loading sdk");
      return;
    }

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

    logger.log("opening live session", {
      connectionId,
      model: `models/${credentials.model}`,
      config,
    });
    const openedAt = performance.now();

    try {
      const session = await client.live.connect({
        model: `models/${credentials.model}`,
        config,
        callbacks: {
          onopen: () => {
            logger.log("live socket open", {
              connectionId,
              elapsedMs: Math.round(performance.now() - openedAt),
            });
          },
          onmessage: (message) => {
            if (connectionId !== connectionSeqRef.current) return;
            handleMessage(message);
          },
          onerror: (event) => {
            logger.error("live socket error", {
              connectionId,
              isStale: connectionId !== connectionSeqRef.current,
              type: event?.type,
              message: (event as ErrorEvent | undefined)?.message,
              elapsedMs: Math.round(performance.now() - openedAt),
            });
            if (connectionId !== connectionSeqRef.current) return;
            sessionRef.current = null;
            scheduleReconnect();
          },
          onclose: (event) => {
            logger.warn("live socket closed", {
              connectionId,
              isStale: connectionId !== connectionSeqRef.current,
              code: event?.code,
              reason: event?.reason,
              wasClean: event?.wasClean,
              messagesReceived: messagesRef.current,
              chunksSent: sentChunksRef.current,
              elapsedMs: Math.round(performance.now() - openedAt),
            });
            if (connectionId !== connectionSeqRef.current) return;
            sessionRef.current = null;
            scheduleReconnect();
          },
        },
      });
      logger.log("live.connect resolved", {
        connectionId,
        elapsedMs: Math.round(performance.now() - openedAt),
        isStopped: isStoppedRef.current,
        isSuperseded: connectionId !== connectionSeqRef.current,
      });
      if (!isCurrent()) {
        session.close();
        return;
      }
      sessionRef.current = session;
      if (credentials.targetLang !== targetLangRef.current) {
        logger.log("target changed during connect, retargeting now");
        retargetRef.current();
      }
    } catch (error) {
      logger.error("live.connect threw", {
        connectionId,
        isConstrained: isConstrainedRef.current,
        ...describeError(error),
        raw: error,
      });
      if (!isCurrent()) return;
      if (!isConstrainedRef.current) {
        isConstrainedRef.current = true;
        logger.warn("retrying without resumption and compression");
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

  const retarget = useCallback(() => {
    const targetLang = targetLangRef.current;
    const session = sessionRef.current;
    if (isStoppedRef.current || !session) {
      logger.log("retarget skipped, no live session", { targetLang });
      return;
    }
    if (credentialsRef.current?.targetLang === targetLang) {
      logger.log("retarget skipped, target unchanged", { targetLang });
      return;
    }
    logger.log("retargeting live session", {
      from: credentialsRef.current?.targetLang,
      to: targetLang,
    });
    setState("switching");
    commitCurrent();
    flush();
    resumeHandleRef.current = undefined;
    connectionSeqRef.current += 1;
    sessionRef.current = null;
    session.close();
    void connect();
  }, [commitCurrent, connect, flush]);

  useEffect(() => {
    retargetRef.current = retarget;
  }, [retarget]);

  const sendChunk = useCallback((base64: string) => {
    if (!sessionRef.current) {
      droppedChunksRef.current += 1;
      if (droppedChunksRef.current === 1 || droppedChunksRef.current % CHUNK_LOG_EVERY === 0) {
        logger.warn("audio chunk dropped, no live session", {
          dropped: droppedChunksRef.current,
        });
      }
      return;
    }
    sentChunksRef.current += 1;
    if (sentChunksRef.current === 1 || sentChunksRef.current % CHUNK_LOG_EVERY === 0) {
      logger.log("audio chunk sent", {
        sent: sentChunksRef.current,
        base64Chars: base64.length,
        mimeType: CAPTURE_MIME_TYPE,
      });
    }
    sessionRef.current.sendRealtimeInput({
      audio: { data: base64, mimeType: CAPTURE_MIME_TYPE },
    });
  }, []);

  const isActive = isEnabled && !unavailableReason && Boolean(remoteTrack);

  useEffect(() => {
    logger.log("activation inputs", {
      isEnabled,
      unavailableReason,
      hasRemoteTrack: Boolean(remoteTrack),
      remoteTrackState: remoteTrack?.readyState,
      remoteTrackMuted: remoteTrack?.muted,
      isActive,
      myLang,
      otherUserLang,
    });
  }, [isActive, isEnabled, myLang, otherUserLang, remoteTrack, unavailableReason]);

  const { setIsSending } = usePcmCapture({
    track: remoteTrack,
    isEnabled: isActive,
    onChunk: sendChunk,
  });

  useEffect(() => {
    const isSending = isActive && (isRemoteSpeaking || isSpeakingRef.current);
    logger.log("sending gate", {
      isActive,
      isRemoteSpeaking,
      isPlaybackSpeaking: isSpeakingRef.current,
      isSending,
    });
    setIsSending(isSending);
  }, [isActive, isRemoteSpeaking, isSpeakingRef, setIsSending]);

  useEffect(() => {
    if (!isActive) return;
    logger.log("activating");
    isStoppedRef.current = false;
    sentChunksRef.current = 0;
    droppedChunksRef.current = 0;
    messagesRef.current = 0;
    void connect();

    return () => {
      logger.log("deactivating", {
        chunksSent: sentChunksRef.current,
        chunksDropped: droppedChunksRef.current,
        messagesReceived: messagesRef.current,
      });
      isStoppedRef.current = true;
      connectionSeqRef.current += 1;
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

  useEffect(() => {
    if (!isActive) return;
    const timer = setTimeout(() => retargetRef.current(), RETARGET_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [isActive, myLang]);

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
