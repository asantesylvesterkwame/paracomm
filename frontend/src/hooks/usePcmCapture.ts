import { useCallback, useEffect, useRef } from "react";
import { arrayBufferToBase64 } from "@/utils/audio";
import { createLogger, describeError } from "@/utils/logger";

const WORKLET_URL = "/worklets/pcm-capture.worklet.js";

const logger = createLogger("pcm-capture");

const FRAME_LOG_EVERY = 50;

interface UsePcmCaptureOptions {
  track: MediaStreamTrack | null;
  isEnabled: boolean;
  onChunk: (base64: string) => void;
}

const usePcmCapture = ({ track, isEnabled, onChunk }: UsePcmCaptureOptions) => {
  const onChunkRef = useRef(onChunk);
  const isSendingRef = useRef(false);

  useEffect(() => {
    onChunkRef.current = onChunk;
  }, [onChunk]);

  useEffect(() => {
    if (!track || !isEnabled) {
      logger.log("idle", { hasTrack: Boolean(track), isEnabled });
      return;
    }

    let context: AudioContext | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let node: AudioWorkletNode | null = null;
    let sink: HTMLAudioElement | null = null;
    let isCancelled = false;
    let framesSeen = 0;
    let framesForwarded = 0;
    let framesGated = 0;

    const start = async () => {
      logger.log("starting", {
        trackId: track.id,
        readyState: track.readyState,
        enabled: track.enabled,
        muted: track.muted,
        settings: track.getSettings(),
      });
      const stream = new MediaStream([track]);
      sink = new Audio();
      sink.srcObject = stream;
      sink.muted = true;
      await sink
        .play()
        .then(() => logger.log("sink playing"))
        .catch((error) => logger.warn("sink play failed", describeError(error)));

      const created = new AudioContext();
      logger.log("audio context created", {
        sampleRate: created.sampleRate,
        state: created.state,
      });
      if (isCancelled) {
        void created.close();
        return;
      }
      context = created;
      try {
        await created.audioWorklet.addModule(WORKLET_URL);
        logger.log("worklet module loaded", WORKLET_URL);
      } catch (error) {
        logger.error("worklet module failed to load", describeError(error));
        throw error;
      }
      if (isCancelled) return;

      source = created.createMediaStreamSource(stream);
      node = new AudioWorkletNode(created, "pcm-capture");
      node.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
        framesSeen += 1;
        if (framesSeen === 1) {
          logger.log("first frame from worklet", {
            bytes: event.data.byteLength,
          });
        }
        if (!isSendingRef.current) {
          framesGated += 1;
          if (framesGated % FRAME_LOG_EVERY === 0) {
            logger.log("frames gated while not sending", {
              gated: framesGated,
              seen: framesSeen,
            });
          }
          return;
        }
        framesForwarded += 1;
        if (framesForwarded === 1 || framesForwarded % FRAME_LOG_EVERY === 0) {
          logger.log("frames forwarded", {
            forwarded: framesForwarded,
            seen: framesSeen,
          });
        }
        onChunkRef.current(arrayBufferToBase64(event.data));
      };
      source.connect(node);
      if (created.state === "suspended") {
        await created.resume();
        logger.log("audio context resumed", created.state);
      }
      track.addEventListener("mute", () => logger.warn("track muted"));
      track.addEventListener("unmute", () => logger.log("track unmuted"));
      track.addEventListener("ended", () => logger.warn("track ended"));
    };

    void start().catch((error) =>
      logger.error("capture start failed", describeError(error)),
    );

    return () => {
      logger.log("stopping", { framesSeen, framesForwarded, framesGated });
      isCancelled = true;
      if (node) {
        node.port.onmessage = null;
        node.disconnect();
      }
      source?.disconnect();
      if (sink) {
        sink.pause();
        sink.srcObject = null;
      }
      void context?.close();
    };
  }, [isEnabled, track]);

  const setIsSending = useCallback((value: boolean) => {
    if (isSendingRef.current !== value) {
      logger.log("sending toggled", value);
    }
    isSendingRef.current = value;
  }, []);

  return { setIsSending };
};

export default usePcmCapture;
