import { useCallback, useEffect, useRef } from "react";
import { arrayBufferToBase64 } from "@/utils/audio";

const WORKLET_URL = "/worklets/pcm-capture.worklet.js";

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
    if (!track || !isEnabled) return;

    let context: AudioContext | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let node: AudioWorkletNode | null = null;
    let sink: HTMLAudioElement | null = null;
    let isCancelled = false;

    const start = async () => {
      const stream = new MediaStream([track]);
      sink = new Audio();
      sink.srcObject = stream;
      sink.muted = true;
      await sink.play().catch(() => undefined);

      const created = new AudioContext();
      if (isCancelled) {
        void created.close();
        return;
      }
      context = created;
      await created.audioWorklet.addModule(WORKLET_URL);
      if (isCancelled) return;

      source = created.createMediaStreamSource(stream);
      node = new AudioWorkletNode(created, "pcm-capture");
      node.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
        if (!isSendingRef.current) return;
        onChunkRef.current(arrayBufferToBase64(event.data));
      };
      source.connect(node);
      if (created.state === "suspended") await created.resume();
    };

    void start();

    return () => {
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
    isSendingRef.current = value;
  }, []);

  return { setIsSending };
};

export default usePcmCapture;
