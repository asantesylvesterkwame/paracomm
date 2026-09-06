import { useCallback, useEffect, useRef } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

const RESUME_DELAY_MS = 400;

interface UseDictationOptions {
  lang: string;
  isEnabled: boolean;
  isPaused?: boolean;
  onFinal: (text: string) => void;
}

const useDictation = ({
  lang,
  isEnabled,
  isPaused = false,
  onFinal,
}: UseDictationOptions) => {
  const {
    finalTranscript,
    interimTranscript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    browserSupportsContinuousListening,
    isMicrophoneAvailable,
  } = useSpeechRecognition();

  const sentLengthRef = useRef(0);
  const langRef = useRef(lang);
  const onFinalRef = useRef(onFinal);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasRunRef = useRef(false);

  useEffect(() => {
    onFinalRef.current = onFinal;
  }, [onFinal]);

  const reset = useCallback(() => {
    resetTranscript();
    sentLengthRef.current = 0;
  }, [resetTranscript]);

  useEffect(() => {
    if (langRef.current === lang) return;
    langRef.current = lang;
    if (listening) void SpeechRecognition.abortListening();
  }, [lang, listening]);

  useEffect(() => {
    if (finalTranscript.length < sentLengthRef.current) {
      sentLengthRef.current = 0;
    }
    if (finalTranscript.length === sentLengthRef.current) return;
    const delta = finalTranscript.slice(sentLengthRef.current).trim();
    sentLengthRef.current = finalTranscript.length;
    if (delta) onFinalRef.current(delta);
  }, [finalTranscript]);

  useEffect(() => {
    const clearResume = () => {
      if (resumeTimerRef.current) {
        clearTimeout(resumeTimerRef.current);
        resumeTimerRef.current = null;
      }
    };

    if (!isEnabled || isPaused) {
      clearResume();
      if (listening) void SpeechRecognition.abortListening();
      return;
    }
    if (listening || resumeTimerRef.current) return;

    const delay = hasRunRef.current ? RESUME_DELAY_MS : 0;
    hasRunRef.current = true;
    resumeTimerRef.current = setTimeout(() => {
      resumeTimerRef.current = null;
      resetTranscript();
      sentLengthRef.current = 0;
      void SpeechRecognition.startListening({
        continuous: browserSupportsContinuousListening,
        language: langRef.current,
      });
    }, delay);

    return clearResume;
  }, [
    isEnabled,
    isPaused,
    listening,
    resetTranscript,
    browserSupportsContinuousListening,
  ]);

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      void SpeechRecognition.abortListening();
    };
  }, []);

  return {
    interimTranscript,
    finalTranscript,
    isListening: listening,
    isSupported: browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
    reset,
  };
};

export default useDictation;
