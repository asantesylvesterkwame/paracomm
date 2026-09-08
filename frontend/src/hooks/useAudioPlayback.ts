import { useCallback, useEffect, useRef, useState } from "react";
import { createLogger, describeError } from "@/utils/logger";

export type PlaybackStatus = "idle" | "loading" | "playing" | "paused" | "failed";

interface PlaybackSnapshot {
  status: PlaybackStatus;
  progress: number;
}

interface UseAudioPlaybackOptions {
  key: string | null;
  durationMs: number;
  load: () => Promise<Blob | string>;
}

const logger = createLogger("audio-playback");

const URL_CACHE_LIMIT = 40;

const urlCache = new Map<string, string>();

const listeners = new Map<string, Set<(snapshot: PlaybackSnapshot) => void>>();

const snapshots = new Map<string, PlaybackSnapshot>();

let active: { key: string; audio: HTMLAudioElement } | null = null;

const IDLE: PlaybackSnapshot = { status: "idle", progress: 0 };

const snapshotOf = (key: string | null) =>
  (key && snapshots.get(key)) || IDLE;

const emit = (key: string, patch: Partial<PlaybackSnapshot>) => {
  const next = { ...snapshotOf(key), ...patch };
  snapshots.set(key, next);
  for (const listener of listeners.get(key) ?? []) listener(next);
};

const subscribe = (key: string, listener: (snapshot: PlaybackSnapshot) => void) => {
  const set = listeners.get(key) ?? new Set();
  set.add(listener);
  listeners.set(key, set);
  return () => {
    set.delete(listener);
    if (set.size === 0) listeners.delete(key);
  };
};

const rememberUrl = (key: string, url: string) => {
  if (urlCache.size >= URL_CACHE_LIMIT) {
    const oldest = urlCache.keys().next().value;
    if (oldest) {
      const staleUrl = urlCache.get(oldest);
      urlCache.delete(oldest);
      if (staleUrl && active?.key !== oldest) URL.revokeObjectURL(staleUrl);
    }
  }
  urlCache.set(key, url);
};

const resolveUrl = async (key: string, load: () => Promise<Blob | string>) => {
  const cached = urlCache.get(key);
  if (cached) return cached;
  const result = await load();
  if (typeof result === "string") return result;
  const url = URL.createObjectURL(result);
  rememberUrl(key, url);
  return url;
};

const stopActive = () => {
  if (!active) return;
  const { key, audio } = active;
  audio.pause();
  audio.onended = null;
  audio.ontimeupdate = null;
  audio.onpause = null;
  audio.onplay = null;
  audio.onerror = null;
  audio.removeAttribute("src");
  audio.load();
  active = null;
  emit(key, { status: "idle", progress: 0 });
};

const useAudioPlayback = ({ key, durationMs, load }: UseAudioPlaybackOptions) => {
  const [snapshot, setSnapshot] = useState<PlaybackSnapshot>(() => snapshotOf(key));
  const loadRef = useRef(load);
  const durationRef = useRef(durationMs);

  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  useEffect(() => {
    durationRef.current = durationMs;
  }, [durationMs]);

  useEffect(() => {
    if (!key) {
      setSnapshot(IDLE);
      return;
    }
    setSnapshot(snapshotOf(key));
    return subscribe(key, setSnapshot);
  }, [key]);

  const pause = useCallback(() => {
    if (key && active?.key === key) active.audio.pause();
  }, [key]);

  const play = useCallback(async () => {
    if (!key) return;
    if (active && active.key !== key) {
      const previous = active;
      previous.audio.pause();
      emit(previous.key, { status: "paused" });
    }
    if (active?.key === key) {
      try {
        await active.audio.play();
      } catch (error) {
        logger.warn("resume failed", describeError(error));
        emit(key, { status: "failed" });
      }
      return;
    }
    emit(key, { status: "loading" });
    let url: string;
    try {
      url = await resolveUrl(key, loadRef.current);
    } catch (error) {
      logger.error("audio load failed", { key, ...describeError(error) });
      emit(key, { status: "failed" });
      return;
    }
    if (active && active.key !== key) stopActive();
    const audio = new Audio(url);
    audio.preload = "auto";
    active = { key, audio };
    audio.ontimeupdate = () => {
      const total = durationRef.current / 1000;
      const ratio = total > 0 ? Math.min(1, audio.currentTime / total) : 0;
      emit(key, { progress: ratio });
    };
    audio.onplay = () => emit(key, { status: "playing" });
    audio.onpause = () => {
      if (!audio.ended) emit(key, { status: "paused" });
    };
    audio.onended = () => {
      emit(key, { status: "idle", progress: 0 });
      if (active?.audio === audio) active = null;
    };
    audio.onerror = () => {
      logger.error("audio element error", { key, code: audio.error?.code });
      emit(key, { status: "failed" });
      if (active?.audio === audio) active = null;
    };
    try {
      await audio.play();
    } catch (error) {
      logger.warn("play rejected", describeError(error));
      emit(key, { status: "failed" });
      if (active?.audio === audio) active = null;
    }
  }, [key]);

  const toggle = useCallback(() => {
    if (snapshot.status === "playing") {
      pause();
      return;
    }
    void play();
  }, [pause, play, snapshot.status]);

  const seek = useCallback(
    (ratio: number) => {
      if (!key || active?.key !== key) return;
      const total = durationRef.current / 1000;
      if (total <= 0) return;
      const clamped = Math.max(0, Math.min(1, ratio));
      active.audio.currentTime = clamped * total;
      emit(key, { progress: clamped });
    },
    [key],
  );

  useEffect(() => {
    return () => {
      if (key && active?.key === key) stopActive();
    };
  }, [key]);

  return {
    status: snapshot.status,
    progress: snapshot.progress,
    play,
    pause,
    toggle,
    seek,
  };
};

export default useAudioPlayback;
