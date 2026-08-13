import { useCallback, useEffect, useRef, useState } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { handleApiAction, notify } from "@/utils";
import LiveService from "./live.service";
import {
  DEFAULT_INPUT_LANGUAGE,
  DEFAULT_OUTPUT_LANGUAGE,
  MAX_RECORDING_SECONDS,
  MAX_UTTERANCE_CHARS,
} from "./live.constants";
import { splitOversizedUtterance } from "./live.utils";
import useSpeech from "./useSpeech";
import type { IUtterance, LiveStatus } from "./live.interface";

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const useLive = () => {
  const {
    finalTranscript,
    interimTranscript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    browserSupportsContinuousListening,
    isMicrophoneAvailable,
  } = useSpeechRecognition();

  const [inputLang, setInputLang] = useState(DEFAULT_INPUT_LANGUAGE);
  const [outputLang, setOutputLang] = useState(DEFAULT_OUTPUT_LANGUAGE);
  const [utterances, setUtterances] = useState<IUtterance[]>([]);
  const [quotaExhausted, setQuotaExhausted] = useState(false);
  const [remainingChars, setRemainingChars] = useState<number | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  const sentLenRef = useRef(0);
  const wantListeningRef = useRef(false);
  const queueRef = useRef<IUtterance[]>([]);
  const pumpingRef = useRef(false);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speechActiveRef = useRef(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
        previous.map((item) =>
          item.id === id ? { ...item, ...changes } : item,
        ),
      );
    },
    [],
  );

  const handleSpeechStart = useCallback(() => {
    speechActiveRef.current = true;
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
    if (wantListeningRef.current) {
      void SpeechRecognition.abortListening();
    }
  }, []);

  const handleSpeechEnd = useCallback(() => {
    speechActiveRef.current = false;
    if (!wantListeningRef.current) return;
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      resumeTimerRef.current = null;
      if (!wantListeningRef.current || speechActiveRef.current) return;
      resetTranscript();
      sentLenRef.current = 0;
      void SpeechRecognition.startListening({
        continuous: browserSupportsContinuousListening,
        language: inputLangRef.current,
      });
    }, 400);
  }, [browserSupportsContinuousListening, resetTranscript]);

  const { speakUtterance, stopSpeech, clearSpeechCache } = useSpeech({
    upsertUtterance,
    onSpeechStart: handleSpeechStart,
    onSpeechEnd: handleSpeechEnd,
  });

  const stopRecording = useCallback(() => {
    wantListeningRef.current = false;
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    void SpeechRecognition.stopListening();
  }, []);

  const failRemainingQueue = useCallback(() => {
    for (const item of queueRef.current) {
      upsertUtterance(item.id, { status: "failed" });
    }
    queueRef.current = [];
  }, [upsertUtterance]);

  const pumpQueue = useCallback(async () => {
    if (pumpingRef.current) return;
    pumpingRef.current = true;
    while (queueRef.current.length > 0) {
      const next = queueRef.current[0];
      let retryDelaySeconds = 0;
      let dailyExhausted = false;
      await new Promise<void>((resolve) => {
        handleApiAction({
          action: () =>
            LiveService.translateUtterance({
              text: next.sourceText,
              sourceLang: inputLangRef.current,
              targetLang: outputLangRef.current,
            }),
          onSuccess: (result) => {
            const data = result?.data;
            const direction =
              data?.detectedLang === outputLangRef.current
                ? ("inbound" as const)
                : ("outbound" as const);
            upsertUtterance(next.id, {
              status: "done",
              translation: data?.translation,
              direction,
            });
            if (data?.translation) {
              const speakLang =
                direction === "inbound"
                  ? inputLangRef.current.split("-")[0]
                  : outputLangRef.current;
              speakUtterance(next.id, data.translation, speakLang);
            }
            if (typeof data?.remainingChars === "number") {
              setRemainingChars(data.remainingChars);
            }
            queueRef.current.shift();
            resolve();
          },
          onError: (error) => {
            const status = error?.response?.status;
            const retryAfter = Number(
              error?.response?.headers?.["retry-after"] ?? 0,
            );
            if (status === 429 && retryAfter > 60) {
              dailyExhausted = true;
            } else if (status === 429) {
              retryDelaySeconds = retryAfter || 60;
            } else {
              upsertUtterance(next.id, { status: "failed" });
              queueRef.current.shift();
            }
            resolve();
          },
          setLoading: setIsTranslating,
          errorMessage: "We could not translate that phrase",
          isToastDisabled: true,
        });
      });
      if (dailyExhausted) {
        setQuotaExhausted(true);
        setRemainingChars(0);
        failRemainingQueue();
        stopRecording();
        notify({
          type: "error",
          message: "Daily free limit reached",
          description: "Your free translation time resets at midnight UTC.",
        });
        break;
      }
      if (retryDelaySeconds > 0) {
        notify({
          type: "warning",
          message: "Translating a little too fast",
          description: "Paracomm will catch up in a moment.",
        });
        await sleep(retryDelaySeconds * 1000);
      }
    }
    pumpingRef.current = false;
  }, [failRemainingQueue, speakUtterance, stopRecording, upsertUtterance]);

  useEffect(() => {
    if (finalTranscript.length < sentLenRef.current) {
      sentLenRef.current = 0;
    }
    if (finalTranscript.length === sentLenRef.current) return;
    const delta = finalTranscript.slice(sentLenRef.current).trim();
    sentLenRef.current = finalTranscript.length;
    if (!delta) return;
    const pieces = splitOversizedUtterance(delta, MAX_UTTERANCE_CHARS);
    const items: IUtterance[] = pieces.map((sourceText) => ({
      id: crypto.randomUUID(),
      sourceText,
      status: "pending",
    }));
    setUtterances((previous) => [...previous, ...items]);
    queueRef.current.push(...items);
    void pumpQueue();
  }, [finalTranscript, pumpQueue]);

  useEffect(() => {
    if (!listening && wantListeningRef.current && !speechActiveRef.current) {
      void SpeechRecognition.startListening({
        continuous: browserSupportsContinuousListening,
        language: inputLangRef.current,
      });
    }
  }, [listening, browserSupportsContinuousListening]);

  useEffect(() => {
    return () => {
      wantListeningRef.current = false;
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      void SpeechRecognition.abortListening();
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
    resetTranscript();
    sentLenRef.current = 0;
    queueRef.current = [];
    clearSpeechCache();
    setUtterances([]);
    wantListeningRef.current = true;
    stopTimerRef.current = setTimeout(() => {
      stopRecording();
      notify({
        type: "info",
        message: "Recording paused",
        description: "Sessions cap at one minute. Hit record to continue.",
      });
    }, MAX_RECORDING_SECONDS * 1000);
    void SpeechRecognition.startListening({
      continuous: browserSupportsContinuousListening,
      language: inputLang,
    });
  }, [
    browserSupportsContinuousListening,
    clearSpeechCache,
    inputLang,
    quotaExhausted,
    resetTranscript,
    stopRecording,
  ]);

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
      queueRef.current.push({ ...target, status: "pending" });
      void pumpQueue();
    },
    [pumpQueue, upsertUtterance, utterances],
  );

  const status: LiveStatus = !browserSupportsSpeechRecognition
    ? "unsupported"
    : !isMicrophoneAvailable
      ? "micDenied"
      : listening
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
