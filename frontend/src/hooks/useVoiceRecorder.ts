import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createLogger, describeError } from "@/utils/logger";

export type RecorderStatus = "idle" | "requesting" | "recording" | "stopping";

export type RecorderError = "unsupported" | "permission" | "too_short" | "failed";

export interface IRecording {
  blob: Blob;
  mimeType: string;
  durationMs: number;
}

interface UseVoiceRecorderOptions {
  maxDurationMs: number;
  minDurationMs: number;
  onComplete: (recording: IRecording) => void;
  onError: (reason: RecorderError) => void;
}

const logger = createLogger("voice-recorder");

const MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/mp4;codecs=mp4a.40.2",
  "audio/mp4",
];

const TIMESLICE_MS = 250;

const TICK_MS = 100;

const AUDIO_BITS_PER_SECOND = 48000;

const pickRecorderMimeType = () =>
  MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type)) ?? null;

export const isVoiceRecordingSupported = () =>
  typeof window !== "undefined" &&
  typeof MediaRecorder !== "undefined" &&
  Boolean(navigator.mediaDevices?.getUserMedia) &&
  pickRecorderMimeType() !== null;

const isPermissionError = (error: unknown) => {
  const name = (error as { name?: string } | undefined)?.name ?? "";
  return /NotAllowed|Permission|Security/i.test(name);
};

const useVoiceRecorder = ({
  maxDurationMs,
  minDurationMs,
  onComplete,
  onError,
}: UseVoiceRecorderOptions) => {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [elapsedMs, setElapsedMs] = useState(0);

  const statusRef = useRef<RecorderStatus>("idle");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isCancelledRef = useRef(false);
  const isMountedRef = useRef(true);
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);

  const isSupported = useMemo(() => isVoiceRecordingSupported(), []);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const updateStatus = useCallback((next: RecorderStatus) => {
    statusRef.current = next;
    if (isMountedRef.current) setStatus(next);
  }, []);

  const clearTick = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const releaseStream = useCallback(() => {
    for (const track of streamRef.current?.getTracks() ?? []) track.stop();
    streamRef.current = null;
  }, []);

  const finalize = useCallback(() => {
    clearTick();
    releaseStream();
    const recorder = recorderRef.current;
    recorderRef.current = null;
    const elapsed = Math.min(
      performance.now() - startedAtRef.current,
      maxDurationMs,
    );
    const chunks = chunksRef.current;
    chunksRef.current = [];
    const wasCancelled = isCancelledRef.current;
    isCancelledRef.current = false;
    updateStatus("idle");
    if (isMountedRef.current) setElapsedMs(0);
    if (wasCancelled) {
      logger.log("recording discarded", { elapsedMs: Math.round(elapsed) });
      return;
    }
    if (elapsed < minDurationMs || chunks.length === 0) {
      logger.warn("recording too short", { elapsedMs: Math.round(elapsed) });
      onErrorRef.current("too_short");
      return;
    }
    const rawType = recorder?.mimeType || chunks[0]?.type || "audio/webm";
    const mimeType = rawType.split(";")[0].trim().toLowerCase();
    const blob = new Blob(chunks, { type: mimeType });
    logger.log("recording complete", {
      mimeType,
      bytes: blob.size,
      durationMs: Math.round(elapsed),
    });
    onCompleteRef.current({ blob, mimeType, durationMs: Math.round(elapsed) });
  }, [clearTick, maxDurationMs, minDurationMs, releaseStream, updateStatus]);

  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || statusRef.current !== "recording") return;
    updateStatus("stopping");
    clearTick();
    if (recorder.state !== "inactive") recorder.stop();
  }, [clearTick, updateStatus]);

  const cancel = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    isCancelledRef.current = true;
    updateStatus("stopping");
    clearTick();
    if (recorder.state !== "inactive") recorder.stop();
  }, [clearTick, updateStatus]);

  const start = useCallback(async () => {
    if (statusRef.current !== "idle") return;
    if (!isSupported) {
      onErrorRef.current("unsupported");
      return;
    }
    updateStatus("requesting");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch (error) {
      logger.warn("microphone unavailable", describeError(error));
      updateStatus("idle");
      onErrorRef.current(isPermissionError(error) ? "permission" : "failed");
      return;
    }
    if (!isMountedRef.current || (statusRef.current as RecorderStatus) !== "requesting") {
      for (const track of stream.getTracks()) track.stop();
      return;
    }
    const mimeType = pickRecorderMimeType();
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(
        stream,
        mimeType
          ? { mimeType, audioBitsPerSecond: AUDIO_BITS_PER_SECOND }
          : undefined,
      );
    } catch (error) {
      logger.error("recorder failed to start", describeError(error));
      for (const track of stream.getTracks()) track.stop();
      updateStatus("idle");
      onErrorRef.current("failed");
      return;
    }
    streamRef.current = stream;
    recorderRef.current = recorder;
    chunksRef.current = [];
    isCancelledRef.current = false;
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onerror = (event) => {
      logger.error("recorder error", describeError(event));
      isCancelledRef.current = true;
      finalize();
      onErrorRef.current("failed");
    };
    recorder.onstop = finalize;
    recorder.start(TIMESLICE_MS);
    startedAtRef.current = performance.now();
    updateStatus("recording");
    setElapsedMs(0);
    logger.log("recording started", { mimeType: recorder.mimeType });
    tickRef.current = setInterval(() => {
      const elapsed = performance.now() - startedAtRef.current;
      if (isMountedRef.current) setElapsedMs(Math.min(elapsed, maxDurationMs));
      if (elapsed >= maxDurationMs) stop();
    }, TICK_MS);
  }, [finalize, isSupported, maxDurationMs, stop, updateStatus]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      clearTick();
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        isCancelledRef.current = true;
        recorder.onstop = null;
        recorder.stop();
      }
      recorderRef.current = null;
      releaseStream();
    };
  }, [clearTick, releaseStream]);

  return { status, elapsedMs, isSupported, start, stop, cancel };
};

export default useVoiceRecorder;
