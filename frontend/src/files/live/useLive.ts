import { useCallback, useEffect, useRef, useState } from "react";
import { handleApiAction, notify } from "@/utils";
import { splitOversizedUtterance } from "@/utils/text";
import useDictation from "@/hooks/useDictation";
import useSerialQueue, { type QueueOutcome } from "@/hooks/useSerialQueue";
import LiveService from "./live.service";
import {
  DEFAULT_INPUT_LANGUAGE,
  DEFAULT_OUTPUT_LANGUAGE,
  MAX_RECORDING_SECONDS,
  MAX_UTTERANCE_CHARS,
} from "./live.constants";
import useSpeech from "./useSpeech";
import type { IUtterance, LiveStatus } from "./live.interface";

const useLive = () => {
  const [inputLang, setInputLang] = useState(DEFAULT_INPUT_LANGUAGE);
  const [outputLang, setOutputLang] = useState(DEFAULT_OUTPUT_LANGUAGE);
  const [utterances, setUtterances] = useState<IUtterance[]>([]);
  const [quotaExhausted, setQuotaExhausted] = useState(false);
  const [remainingChars, setRemainingChars] = useState<number | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeechActive, setIsSpeechActive] = useState(false);

  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputLangRef = useRef(inputLang);
  const outputLangRef = useRef(outputLang);

  useEffect(() => {
    inputLangRef.current = inputLang;
  }, [inputLang]);

  useEffect(() => {
    outputLangRef.current = outputLang;
  }, [outputLang]);

  const upsertUtterance = useCallback(
    (id: string, changes: Partial<IUtterance>) => {
      setUtterances((previous) =>
        previous.map((item) => (item.id === id ? { ...item, ...changes } : item)),
      );
    },
    [],
  );

  const { speakUtterance, stopSpeech, clearSpeechCache } = useSpeech({
    upsertUtterance,
    onSpeechStart: () => setIsSpeechActive(true),
    onSpeechEnd: () => setIsSpeechActive(false),
  });

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
  }, []);

  const translateUtterance = useCallback(
    (item: IUtterance) =>
      new Promise<QueueOutcome>((resolve) => {
        void handleApiAction({
          action: () =>
            LiveService.translateUtterance({
              text: item.sourceText,
              sourceLang: inputLangRef.current,
              targetLang: outputLangRef.current,
            }),
          onSuccess: (result) => {
            const data = result?.data;
            const direction =
              data?.detectedLang === outputLangRef.current
                ? ("inbound" as const)
                : ("outbound" as const);
            upsertUtterance(item.id, {
              status: "done",
              translation: data?.translation,
              direction,
            });
            if (data?.translation) {
              const speakLang =
                direction === "inbound"
                  ? inputLangRef.current.split("-")[0]
                  : outputLangRef.current;
              speakUtterance(item.id, data.translation, speakLang);
            }
            if (typeof data?.remainingChars === "number") {
              setRemainingChars(data.remainingChars);
            }
            resolve({ outcome: "done" });
          },
          onError: (error) => {
            const status = error?.response?.status;
            const retryAfter = Number(
              error?.response?.headers?.["retry-after"] ?? 0,
            );
            if (status === 429 && retryAfter > 60) {
              resolve({ outcome: "abort" });
              return;
            }
            if (status === 429) {
              notify({
                type: "warning",
                message: "Translating a little too fast",
                description: "Paracomm will catch up in a moment.",
              });
              resolve({ outcome: "retry", afterSeconds: retryAfter || 60 });
              return;
            }
            upsertUtterance(item.id, { status: "failed" });
            resolve({ outcome: "failed" });
          },
          setLoading: setIsTranslating,
          errorMessage: "We could not translate that phrase",
          isToastDisabled: true,
        });
      }),
    [speakUtterance, upsertUtterance],
  );

  const handleQuotaExhausted = useCallback(
    (remaining: IUtterance[]) => {
      for (const item of remaining) {
        upsertUtterance(item.id, { status: "failed" });
      }
      setQuotaExhausted(true);
      setRemainingChars(0);
      stopRecording();
      notify({
        type: "error",
        message: "Daily free limit reached",
        description: "Your free translation time resets at midnight UTC.",
      });
    },
    [stopRecording, upsertUtterance],
  );

  const { enqueue, clear } = useSerialQueue<IUtterance>({
    process: translateUtterance,
    onAbort: handleQuotaExhausted,
  });

  const handleFinal = useCallback(
    (text: string) => {
      const items: IUtterance[] = splitOversizedUtterance(
        text,
        MAX_UTTERANCE_CHARS,
      ).map((sourceText) => ({
        id: crypto.randomUUID(),
        sourceText,
        status: "pending",
      }));
      if (items.length === 0) return;
      setUtterances((previous) => [...previous, ...items]);
      enqueue(items);
    },
    [enqueue],
  );

  const {
    interimTranscript,
    finalTranscript,
    isListening,
    isSupported,
    isMicrophoneAvailable,
    reset,
  } = useDictation({
    lang: inputLang,
    isEnabled: isRecording,
    isPaused: isSpeechActive,
    onFinal: handleFinal,
  });

  useEffect(() => {
    return () => {
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    };
  }, []);

  const startRecording = useCallback(() => {
    if (quotaExhausted) {
      notify({
        type: "error",
        message: "Daily free limit reached",
        description: "Come back after midnight UTC for more free translation.",
      });
      return;
    }
    reset();
    clear();
    clearSpeechCache();
    setUtterances([]);
    setIsRecording(true);
    stopTimerRef.current = setTimeout(() => {
      stopRecording();
      notify({
        type: "info",
        message: "Recording paused",
        description: "Sessions cap at one minute. Hit record to continue.",
      });
    }, MAX_RECORDING_SECONDS * 1000);
  }, [clear, clearSpeechCache, quotaExhausted, reset, stopRecording]);

  const speakUtteranceById = useCallback(
    (id: string) => {
      const target = utterances.find((item) => item.id === id);
      if (!target?.translation) return;
      if (target.speechStatus === "playing") {
        stopSpeech();
        return;
      }
      const speakLang =
        target.direction === "inbound"
          ? inputLangRef.current.split("-")[0]
          : outputLangRef.current;
      speakUtterance(id, target.translation, speakLang);
    },
    [speakUtterance, stopSpeech, utterances],
  );

  const retryUtterance = useCallback(
    (id: string) => {
      const target = utterances.find((item) => item.id === id);
      if (!target || target.status !== "failed") return;
      upsertUtterance(id, { status: "pending" });
      enqueue({ ...target, status: "pending" });
    },
    [enqueue, upsertUtterance, utterances],
  );

  const status: LiveStatus = !isSupported
    ? "unsupported"
    : !isMicrophoneAvailable
      ? "micDenied"
      : isListening
        ? "listening"
        : utterances.length > 0 || finalTranscript
          ? "stopped"
          : "idle";

  return {
    status,
    inputLang,
    setInputLang,
    outputLang,
    setOutputLang,
    utterances,
    interimTranscript,
    finalTranscript,
    isTranslating,
    quotaExhausted,
    remainingChars,
    startRecording,
    stopRecording,
    retryUtterance,
    speakUtteranceById,
  };
};

export default useLive;
