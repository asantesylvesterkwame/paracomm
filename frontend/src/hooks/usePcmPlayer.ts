import { useCallback, useEffect, useRef, useState } from "react";
import { base64ToArrayBuffer, pcm16ToFloat32 } from "@/utils/audio";
import { createLogger } from "@/utils/logger";

const logger = createLogger("pcm-player");

const PUSH_LOG_EVERY = 25;

interface UsePcmPlayerOptions {
  sampleRate: number;
  jitterSeconds?: number;
  tailSeconds?: number;
}

const usePcmPlayer = ({
  sampleRate,
  jitterSeconds = 0.12,
  tailSeconds = 0.4,
}: UsePcmPlayerOptions) => {
  const contextRef = useRef<AudioContext | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartRef = useRef(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isSpeakingRef = useRef(false);
  const pushesRef = useRef(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const setSpeaking = useCallback((value: boolean) => {
    if (isSpeakingRef.current === value) return;
    logger.log("speaking", value);
    isSpeakingRef.current = value;
    setIsSpeaking(value);
  }, []);

  const stopPolling = useCallback(() => {
    if (!pollRef.current) return;
    clearInterval(pollRef.current);
    pollRef.current = null;
  }, []);

  const startPolling = useCallback(() => {
    if (pollRef.current) return;
    pollRef.current = setInterval(() => {
      const context = contextRef.current;
      if (!context) return;
      if (context.currentTime < nextStartRef.current + tailSeconds) return;
      setSpeaking(false);
      stopPolling();
    }, 100);
  }, [setSpeaking, stopPolling, tailSeconds]);

  const flush = useCallback(() => {
    logger.log("flush", { pending: sourcesRef.current.size });
    for (const source of sourcesRef.current) {
      try {
        source.onended = null;
        source.stop();
      } catch {
        /* already stopped */
      }
    }
    sourcesRef.current.clear();
    nextStartRef.current = contextRef.current?.currentTime ?? 0;
    stopPolling();
    setSpeaking(false);
  }, [setSpeaking, stopPolling]);

  const push = useCallback(
    (base64: string) => {
      if (!contextRef.current) {
        contextRef.current = new AudioContext();
        logger.log("audio context created", {
          sampleRate: contextRef.current.sampleRate,
          state: contextRef.current.state,
        });
      }
      const context = contextRef.current;
      if (context.state === "suspended") {
        logger.warn("audio context suspended, resuming");
        void context.resume();
      }

      const samples = pcm16ToFloat32(base64ToArrayBuffer(base64));
      if (samples.length === 0) {
        logger.warn("empty audio chunk ignored");
        return;
      }

      const buffer = context.createBuffer(1, samples.length, sampleRate);
      buffer.copyToChannel(samples, 0);

      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(context.destination);

      const earliest = context.currentTime + jitterSeconds;
      const startAt = Math.max(nextStartRef.current, earliest);
      source.start(startAt);
      nextStartRef.current = startAt + buffer.duration;

      pushesRef.current += 1;
      if (pushesRef.current === 1 || pushesRef.current % PUSH_LOG_EVERY === 0) {
        logger.log("audio scheduled", {
          pushes: pushesRef.current,
          samples: samples.length,
          durationMs: Math.round(buffer.duration * 1000),
          startAt: Number(startAt.toFixed(3)),
          contextTime: Number(context.currentTime.toFixed(3)),
          contextState: context.state,
        });
      }

      sourcesRef.current.add(source);
      source.onended = () => {
        sourcesRef.current.delete(source);
      };

      setSpeaking(true);
      startPolling();
    },
    [jitterSeconds, sampleRate, setSpeaking, startPolling],
  );

  const teardown = useCallback(() => {
    stopPolling();
    for (const source of sourcesRef.current) {
      try {
        source.onended = null;
        source.stop();
      } catch {
        /* already stopped */
      }
    }
    sourcesRef.current.clear();
    void contextRef.current?.close();
    contextRef.current = null;
  }, [stopPolling]);

  useEffect(() => teardown, [teardown]);

  return { push, flush, isSpeaking, isSpeakingRef };
};

export default usePcmPlayer;
