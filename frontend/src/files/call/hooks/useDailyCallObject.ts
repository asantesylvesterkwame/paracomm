import { useEffect, useRef, useState } from "react";
import Daily from "@daily-co/daily-js";
import type { DailyCall } from "@daily-co/daily-js";

interface UseDailyCallObjectOptions {
  roomUrl: string;
  token: string;
  userName: string;
  onJoinError: (error: unknown) => void;
}

let pendingDestroy: Promise<void> = Promise.resolve();

const destroyInstance = (instance: DailyCall) => {
  const next = pendingDestroy
    .then(() => (instance.isDestroyed() ? undefined : instance.destroy()))
    .catch(() => undefined);
  pendingDestroy = next;
  return next;
};

const settleStaleInstances = async () => {
  await pendingDestroy;
  const stale = Daily.getCallInstance();
  if (stale && !stale.isDestroyed()) await destroyInstance(stale);
};

const useDailyCallObject = ({
  roomUrl,
  token,
  userName,
  onJoinError,
}: UseDailyCallObjectOptions) => {
  const [callObject, setCallObject] = useState<DailyCall | null>(null);
  const userNameRef = useRef(userName);
  const onJoinErrorRef = useRef(onJoinError);

  useEffect(() => {
    userNameRef.current = userName;
    onJoinErrorRef.current = onJoinError;
  }, [onJoinError, userName]);

  useEffect(() => {
    let isActive = true;
    let instance: DailyCall | null = null;

    const connect = async () => {
      await settleStaleInstances();
      if (!isActive) return;
      instance = Daily.createCallObject({ strictMode: true });
      setCallObject(instance);
      try {
        await instance.join({
          url: roomUrl,
          token,
          userName: userNameRef.current,
        });
      } catch (error) {
        if (isActive) onJoinErrorRef.current(error);
      }
    };

    void connect();

    return () => {
      isActive = false;
      setCallObject(null);
      if (instance) void destroyInstance(instance);
    };
  }, [roomUrl, token]);

  return callObject;
};

export default useDailyCallObject;
