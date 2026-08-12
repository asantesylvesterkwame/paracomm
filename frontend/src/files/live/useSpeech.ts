import { useCallback, useEffect, useRef, useState } from "react";
import { handleApiAction } from "@/utils";
import LiveService from "./live.service";
import { TTS_UNSUPPORTED_OUTPUT_LANGS } from "./live.constants";
import type { IUtterance } from "./live.interface";

const base64ToBlobUrl = (base64: string, mimeType: string) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return URL.createObjectURL(new Blob([bytes], { type: mimeType }));
};

const useSpeech = ({
  upsertUtterance,
}: {
  upsertUtterance: (id: string, changes: Partial<IUtterance>) => void;
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlCacheRef = useRef<Map<string, string>>(new Map());
  const currentIdRef = useRef<string | null>(null);
  const [isSpeechLoading, setIsSpeechLoading] = useState(false);

  const stopSpeech = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (currentIdRef.current) {
      upsertUtterance(currentIdRef.current, { speechStatus: "idle" });
      currentIdRef.current = null;
    }
  }, [upsertUtterance]);

  const play = useCallback(
    (id: string, url: string) => {
      stopSpeech();
      const audio = new Audio(url);
      audioRef.current = audio;
      currentIdRef.current = id;
      audio.onended = () => {
        upsertUtterance(id, { speechStatus: "idle" });
        if (currentIdRef.current === id) currentIdRef.current = null;
      };
      audio.onerror = () => {
        upsertUtterance(id, { speechStatus: "failed" });
        if (currentIdRef.current === id) currentIdRef.current = null;
      };
      upsertUtterance(id, { speechStatus: "playing" });
      audio.play().catch(() => {
        upsertUtterance(id, { speechStatus: "idle" });
        if (currentIdRef.current === id) currentIdRef.current = null;
      });
    },
    [stopSpeech, upsertUtterance],
  );

  const speakWithBrowser = useCallback(
    (id: string, text: string, lang: string) => {
      if (!("speechSynthesis" in window)) {
        upsertUtterance(id, { speechStatus: "failed" });
        return;
      }
      stopSpeech();
      currentIdRef.current = id;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.onstart = () => upsertUtterance(id, { speechStatus: "playing" });
      utterance.onend = () => {
        upsertUtterance(id, { speechStatus: "idle" });
        if (currentIdRef.current === id) currentIdRef.current = null;
      };
      utterance.onerror = () => {
        upsertUtterance(id, { speechStatus: "failed" });
        if (currentIdRef.current === id) currentIdRef.current = null;
      };
      window.speechSynthesis.speak(utterance);
    },
    [stopSpeech, upsertUtterance],
  );

  const speakUtterance = useCallback(
    (id: string, text: string, lang: string) => {
      const cachedUrl = urlCacheRef.current.get(id);
      if (cachedUrl) {
        play(id, cachedUrl);
        return;
      }
      if (TTS_UNSUPPORTED_OUTPUT_LANGS.includes(lang)) {
        speakWithBrowser(id, text, lang);
        return;
      }
      upsertUtterance(id, { speechStatus: "loading" });
      void handleApiAction({
        action: () => LiveService.speakUtterance({ text, lang }),
        onSuccess: (result) => {
          const data = result?.data;
          if (!data?.audioBase64) {
            speakWithBrowser(id, text, lang);
            return;
          }
          const url = base64ToBlobUrl(data.audioBase64, data.mimeType);
          urlCacheRef.current.set(id, url);
          play(id, url);
        },
        onError: () => speakWithBrowser(id, text, lang),
        setLoading: setIsSpeechLoading,
        errorMessage: "Could not speak this phrase",
        isToastDisabled: true,
      });
    },
    [play, speakWithBrowser, upsertUtterance],
  );

  const clearSpeechCache = useCallback(() => {
    stopSpeech();
    for (const url of urlCacheRef.current.values()) {
      URL.revokeObjectURL(url);
    }
    urlCacheRef.current.clear();
  }, [stopSpeech]);

  useEffect(() => {
    const cache = urlCacheRef.current;
    return () => {
      if (audioRef.current) audioRef.current.pause();
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      for (const url of cache.values()) {
        URL.revokeObjectURL(url);
      }
      cache.clear();
    };
  }, []);

  return { speakUtterance, stopSpeech, clearSpeechCache, isSpeechLoading };
};

export default useSpeech;
