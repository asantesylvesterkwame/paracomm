import { useCallback, useEffect, useRef } from "react";

export type QueueOutcome =
  | { outcome: "done" }
  | { outcome: "failed" }
  | { outcome: "retry"; afterSeconds: number }
  | { outcome: "abort" };

interface UseSerialQueueOptions<T> {
  process: (item: T) => Promise<QueueOutcome>;
  onAbort?: (remaining: T[]) => void;
}

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const useSerialQueue = <T,>({ process, onAbort }: UseSerialQueueOptions<T>) => {
  const queueRef = useRef<T[]>([]);
  const isPumpingRef = useRef(false);
  const isStoppedRef = useRef(false);
  const processRef = useRef(process);
  const onAbortRef = useRef(onAbort);

  useEffect(() => {
    processRef.current = process;
  }, [process]);

  useEffect(() => {
    onAbortRef.current = onAbort;
  }, [onAbort]);

  useEffect(() => {
    isStoppedRef.current = false;
    return () => {
      isStoppedRef.current = true;
      queueRef.current = [];
    };
  }, []);

  const pump = useCallback(async () => {
    if (isPumpingRef.current) return;
    isPumpingRef.current = true;
    while (queueRef.current.length > 0 && !isStoppedRef.current) {
      const next = queueRef.current[0];
      const result = await processRef.current(next);
      if (isStoppedRef.current) break;
      if (result.outcome === "abort") {
        const remaining = queueRef.current.slice();
        queueRef.current = [];
        onAbortRef.current?.(remaining);
        break;
      }
      if (result.outcome === "retry") {
        await sleep(result.afterSeconds * 1000);
        continue;
      }
      queueRef.current.shift();
    }
    isPumpingRef.current = false;
  }, []);

  const enqueue = useCallback(
    (items: T | T[]) => {
      queueRef.current.push(...(Array.isArray(items) ? items : [items]));
      void pump();
    },
    [pump],
  );

  const clear = useCallback(() => {
    queueRef.current = [];
  }, []);

  return { enqueue, clear };
};

export default useSerialQueue;
