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
import type { ReactNode } from "react";

type SocketHandler = (payload: unknown) => void;

interface RoomSocketContextType {
  isSocketConnected: boolean;
  joinRoom: (roomId: string) => void;
  leaveRoom: () => void;
  sendEvent: (event: string, payload?: unknown) => void;
  on: (event: string, handler: SocketHandler) => void;
  off: (event: string, handler: SocketHandler) => void;
}

const RoomSocketContext = createContext<RoomSocketContextType | undefined>(
  undefined,
);

const MAX_BACKOFF_MS = 8000;
const PING_INTERVAL_MS = 30000;

export const RoomSocketProvider = ({ children }: { children: ReactNode }) => {
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const roomIdRef = useRef<string | null>(null);
  const attemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const handlersRef = useRef<Map<string, Set<SocketHandler>>>(new Map());

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

  const connect = useCallback(async () => {
    const roomId = roomIdRef.current;
    if (!roomId) return;
    const token = await getAuthToken();
    if (!token || roomIdRef.current !== roomId) return;
    const base = import.meta.env.VITE_PARACOMM_API_URL.replace(
      /^http/,
      "ws",
    ).replace(/\/$/, "");
    const socket = new WebSocket(
      `${base}/rooms/${roomId}/ws?token=${encodeURIComponent(token)}`,
    );
    socketRef.current = socket;
    socket.onopen = () => {
      if (socketRef.current !== socket) return;
      attemptRef.current = 0;
      setIsSocketConnected(true);
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
      setIsSocketConnected(false);
      if (pingTimerRef.current) {
        clearInterval(pingTimerRef.current);
        pingTimerRef.current = null;
      }
      if (!roomIdRef.current) return;
      const delay = Math.min(
        MAX_BACKOFF_MS,
        1000 * 2 ** attemptRef.current,
      );
      attemptRef.current += 1;
      reconnectTimerRef.current = setTimeout(() => {
        void connect();
      }, delay);
    };
  }, []);

  const joinRoom = useCallback(
    (roomId: string) => {
      if (roomIdRef.current === roomId && socketRef.current) return;
      clearTimers();
      closeSocket();
      roomIdRef.current = roomId;
      attemptRef.current = 0;
      void connect();
    },
    [clearTimers, closeSocket, connect],
  );

  const leaveRoom = useCallback(() => {
    roomIdRef.current = null;
    clearTimers();
    closeSocket();
    setIsSocketConnected(false);
  }, [clearTimers, closeSocket]);

  const sendEvent = useCallback((event: string, payload?: unknown) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify({ event, payload }));
  }, []);

  const on = useCallback((event: string, handler: SocketHandler) => {
    const handlers = handlersRef.current.get(event) ?? new Set();
    handlers.add(handler);
    handlersRef.current.set(event, handlers);
  }, []);

  const off = useCallback((event: string, handler: SocketHandler) => {
    handlersRef.current.get(event)?.delete(handler);
  }, []);

  useEffect(() => {
    const reconnectNow = () => {
      if (!roomIdRef.current || socketRef.current) return;
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
    () => ({ isSocketConnected, joinRoom, leaveRoom, sendEvent, on, off }),
    [isSocketConnected, joinRoom, leaveRoom, sendEvent, on, off],
  );

  return (
    <RoomSocketContext.Provider value={value}>
      {children}
    </RoomSocketContext.Provider>
  );
};

export const useRoomSocket = () => {
  const context = useContext(RoomSocketContext);
  if (!context) {
    throw new Error("useRoomSocket must be used within a RoomSocketProvider");
  }
  return context;
};
