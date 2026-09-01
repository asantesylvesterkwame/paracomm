import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { notify } from "@/utils";
import { useUserSocket } from "@/context/UserSocketContext";
import { useAuthContext } from "@/files/auth/auth.context";
import { CALL_EVENTS, RING_TIMEOUT_MS } from "./call.constants";
import useCall from "./useCall";
import type { ReactNode } from "react";
import type {
  CallContextType,
  CallPhase,
  ICall,
  ICallCredentials,
  ICallStatePayload,
  IRingingPayload,
} from "./call.interface";

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider = ({ children }: { children: ReactNode }) => {
  const { profile } = useAuthContext();
  const { on, off } = useUserSocket();

  const [credentials, setCredentials] = useState<ICallCredentials | null>(null);
  const [incoming, setIncoming] = useState<IRingingPayload | null>(null);
  const [call, setCall] = useState<ICall | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isCaptionsOn, setIsCaptionsOn] = useState(true);

  const ringTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeCallIdRef = useRef<string | null>(null);

  const clearRingTimer = useCallback(() => {
    if (ringTimerRef.current) {
      clearTimeout(ringTimerRef.current);
      ringTimerRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    clearRingTimer();
    activeCallIdRef.current = null;
    setCredentials(null);
    setIncoming(null);
    setCall(null);
    setIsMinimized(false);
  }, [clearRingTimer]);

  const handleCredentials = useCallback(
    (next: ICallCredentials) => {
      clearRingTimer();
      activeCallIdRef.current = next.call.id;
      setIncoming(null);
      setCredentials(next);
      setCall(next.call);
    },
    [clearRingTimer],
  );

  const handleClosed = useCallback(() => reset(), [reset]);

  const { start, accept, decline, end, isStarting, isAccepting } = useCall({
    onCredentials: handleCredentials,
    onClosed: handleClosed,
  });

  const startCall = useCallback(
    async (roomId: string) => {
      if (activeCallIdRef.current) {
        notify({
          type: "info",
          message: "You are already on a call",
          description: "Leave the current call before starting another.",
        });
        return;
      }
      await start(roomId);
    },
    [start],
  );

  const acceptCall = useCallback(async () => {
    const target = incoming?.call.id;
    if (!target) return;
    await accept(target);
  }, [accept, incoming]);

  const declineCall = useCallback(async () => {
    const target = incoming?.call.id;
    setIncoming(null);
    if (!target) return;
    await decline(target);
  }, [decline, incoming]);

  const endCall = useCallback(async () => {
    const target = activeCallIdRef.current;
    reset();
    if (!target) return;
    await end(target);
  }, [end, reset]);

  useEffect(() => {
    const onRinging = (payload: unknown) => {
      const data = payload as IRingingPayload;
      if (!data?.call || !profile) return;
      if (data.caller.id === profile.id) {
        clearRingTimer();
        ringTimerRef.current = setTimeout(() => {
          ringTimerRef.current = null;
        }, RING_TIMEOUT_MS);
        return;
      }
      if (activeCallIdRef.current) return;
      setIncoming(data);
    };

    const onAccepted = (payload: unknown) => {
      const data = payload as ICallStatePayload;
      if (!data?.call) return;
      clearRingTimer();
      setCall((previous) =>
        previous && previous.id === data.call.id ? data.call : previous,
      );
    };

    const onClosedEvent = (payload: unknown) => {
      const data = payload as ICallStatePayload;
      if (!data?.call) return;
      const isIncoming = data.call.id === incoming?.call.id;
      const isActive = data.call.id === activeCallIdRef.current;
      if (!isIncoming && !isActive) return;
      if (isActive && data.call.status === "declined") {
        notify({
          type: "info",
          message: `${credentials?.otherUser.displayName ?? "They"} declined`,
          description: "Try again in a moment or send a message instead.",
        });
      }
      reset();
    };

    on(CALL_EVENTS.RINGING, onRinging);
    on(CALL_EVENTS.ACCEPTED, onAccepted);
    on(CALL_EVENTS.DECLINED, onClosedEvent);
    on(CALL_EVENTS.ENDED, onClosedEvent);
    return () => {
      off(CALL_EVENTS.RINGING, onRinging);
      off(CALL_EVENTS.ACCEPTED, onAccepted);
      off(CALL_EVENTS.DECLINED, onClosedEvent);
      off(CALL_EVENTS.ENDED, onClosedEvent);
    };
  }, [
    clearRingTimer,
    credentials?.otherUser.displayName,
    incoming?.call.id,
    off,
    on,
    profile,
    reset,
  ]);

  useEffect(() => {
    if (!incoming) return;
    const timer = setTimeout(() => setIncoming(null), RING_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [incoming]);

  useEffect(() => {
    if (!credentials) return;
    const onBeforeUnload = () => {
      const target = activeCallIdRef.current;
      if (!target) return;
      const base = import.meta.env.VITE_PARACOMM_API_URL.replace(/\/$/, "");
      navigator.sendBeacon?.(`${base}/calls/${target}/end`);
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [credentials]);

  const phase: CallPhase = credentials
    ? "active"
    : incoming
      ? "incoming"
      : "idle";

  const value = useMemo(
    () => ({
      phase,
      call,
      credentials,
      incoming,
      otherUser: credentials?.otherUser ?? incoming?.caller ?? null,
      isMinimized,
      isStarting,
      isAccepting,
      isCaptionsOn,
      startCall,
      acceptCall,
      declineCall,
      endCall,
      setIsMinimized,
      setIsCaptionsOn,
    }),
    [
      acceptCall,
      call,
      credentials,
      declineCall,
      endCall,
      incoming,
      isAccepting,
      isCaptionsOn,
      isMinimized,
      isStarting,
      phase,
      startCall,
    ],
  );

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};

export const useCallContext = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error("useCallContext must be used within a CallProvider");
  }
  return context;
};
