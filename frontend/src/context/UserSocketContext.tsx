import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getAuthToken } from "@/api";
import { useAuthContext } from "@/files/auth/auth.context";
import type { ReactNode } from "react";

type UserSocketHandler = (payload: unknown) => void;

interface UserSocketContextType {
  isUserSocketConnected: boolean;
  userConnectionKey: number;
  on: (event: string, handler: UserSocketHandler) => void;
  off: (event: string, handler: UserSocketHandler) => void;
}

const UserSocketContext = createContext<UserSocketContextType | undefined>(
  undefined,
);

const MAX_BACKOFF_MS = 8000;
const PING_INTERVAL_MS = 30000;

export const UserSocketProvider = ({ children }: { children: ReactNode }) => {
  const { isSignedIn } = useAuthContext();
  const [isUserSocketConnected, setIsUserSocketConnected] = useState(false);
  const [userConnectionKey, setUserConnectionKey] = useState(0);
  const socketRef = useRef<WebSocket | null>(null);
  const isWantedRef = useRef(false);
  const attemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const handlersRef = useRef<Map<string, Set<UserSocketHandler>>>(new Map());
  const connectRef = useRef<() => void>(() => undefined);

  const clearTimers = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (pingTimerRef.current) {
      clearInterval(pingTimerRef.current);
      pingTimerRef.current = null;
    }
  }, []);

  const closeSocket = useCallback(() => {
    const socket = socketRef.current;
    socketRef.current = null;
    if (socket) {
      socket.onclose = null;
      socket.onmessage = null;
      socket.onopen = null;
      try {
        socket.close(1000);
      } catch {
        return;
      }
    }
  }, []);

  const scheduleRetry = useCallback(() => {
    if (!isWantedRef.current || socketRef.current || reconnectTimerRef.current) {
      return;
    }
    const delay =
      Math.min(MAX_BACKOFF_MS, 1000 * 2 ** attemptRef.current) +
      Math.random() * 400;
    attemptRef.current += 1;
    reconnectTimerRef.current = setTimeout(() => {
      reconnectTimerRef.current = null;
      void connectRef.current();
    }, delay);
  }, []);

  const connect = useCallback(async () => {
    if (!isWantedRef.current || socketRef.current) return;
    const token = await getAuthToken();
    if (!token || !isWantedRef.current) {
      if (!token) scheduleRetry();
      return;
    }
    const base = import.meta.env.VITE_PARACOMM_API_URL.replace(
      /^http/,
      "ws",
    ).replace(/\/$/, "");
    const socket = new WebSocket(
      `${base}/users/me/ws?token=${encodeURIComponent(token)}`,
    );
    socketRef.current = socket;
    socket.onopen = () => {
      if (socketRef.current !== socket) return;
      attemptRef.current = 0;
      setIsUserSocketConnected(true);
      setUserConnectionKey((previous) => previous + 1);
      if (pingTimerRef.current) clearInterval(pingTimerRef.current);
      pingTimerRef.current = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) socket.send("ping");
      }, PING_INTERVAL_MS);
    };
    socket.onmessage = (event) => {
      if (typeof event.data !== "string" || event.data === "pong") return;
      try {
        const frame = JSON.parse(event.data) as {
          event?: string;
          payload?: unknown;
        };
        if (!frame.event) return;
        const handlers = handlersRef.current.get(frame.event);
        if (!handlers) return;
        for (const handler of handlers) handler(frame.payload);
      } catch {
        return;
      }
    };
    socket.onclose = () => {
      if (socketRef.current !== socket) return;
      socketRef.current = null;
      setIsUserSocketConnected(false);
      if (pingTimerRef.current) {
        clearInterval(pingTimerRef.current);
        pingTimerRef.current = null;
      }
      if (!isWantedRef.current) return;
      const delay =
        Math.min(MAX_BACKOFF_MS, 1000 * 2 ** attemptRef.current) +
        Math.random() * 400;
      attemptRef.current += 1;
      reconnectTimerRef.current = setTimeout(() => {
        reconnectTimerRef.current = null;
        void connectRef.current();
      }, delay);
    };
  }, [scheduleRetry]);

  useEffect(() => {
    connectRef.current = () => void connect();
  }, [connect]);

  const on = useCallback((event: string, handler: UserSocketHandler) => {
    const handlers = handlersRef.current.get(event) ?? new Set();
    handlers.add(handler);
    handlersRef.current.set(event, handlers);
  }, []);

  const off = useCallback((event: string, handler: UserSocketHandler) => {
    handlersRef.current.get(event)?.delete(handler);
  }, []);

  useEffect(() => {
    isWantedRef.current = isSignedIn;
    if (!isSignedIn) {
      clearTimers();
      closeSocket();
      setIsUserSocketConnected(false);
      return;
    }
    attemptRef.current = 0;
    void connect();
  }, [clearTimers, closeSocket, connect, isSignedIn]);

  useEffect(() => {
    const reconnectNow = () => {
      if (!isWantedRef.current || socketRef.current) return;
      clearTimers();
      void connect();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") reconnectNow();
    };
    window.addEventListener("online", reconnectNow);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("online", reconnectNow);
      document.removeEventListener("visibilitychange", onVisibility);
      clearTimers();
      closeSocket();
    };
  }, [clearTimers, closeSocket, connect]);

  const value = useMemo(
    () => ({ isUserSocketConnected, userConnectionKey, on, off }),
    [isUserSocketConnected, userConnectionKey, on, off],
  );

  return (
    <UserSocketContext.Provider value={value}>
      {children}
    </UserSocketContext.Provider>
  );
};

export const useUserSocket = () => {
  const context = useContext(UserSocketContext);
  if (!context) {
    throw new Error("useUserSocket must be used within a UserSocketProvider");
  }
  return context;
};
