import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuthContext } from "@/files/auth/auth.context";
import RoomService from "./room.service";
import type { IRoom, RoomContextType } from "./room.interface";
import type { ReactNode } from "react";

const RoomContext = createContext<RoomContextType | undefined>(undefined);

const REFRESH_INTERVAL_MS = 45000;

export const RoomProvider = ({ children }: { children: ReactNode }) => {
  const { isSignedIn, profile } = useAuthContext();
  const [rooms, setRooms] = useState<IRoom[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const fetchingRef = useRef(false);

  const refetch = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setIsLoading(true);
    try {
      const result = await RoomService.getRooms();
      if (result?.data?.items) {
        setRooms(result.data.items);
      }
    } catch {
      setRooms((previous) => previous);
    } finally {
      fetchingRef.current = false;
      setIsLoading(false);
      setHasFetched(true);
    }
  }, []);

  useEffect(() => {
    if (!isSignedIn || !profile) {
      setRooms([]);
      setHasFetched(false);
      setActiveRoomId(null);
      return;
    }
    void refetch();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") void refetch();
    }, REFRESH_INTERVAL_MS);
    const onFocus = () => void refetch();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [isSignedIn, profile, refetch]);

  const upsertRoom = useCallback(
    (roomId: string, changes: Partial<IRoom>) => {
      setRooms((previous) =>
        previous.map((room) =>
          room.id === roomId ? { ...room, ...changes } : room,
        ),
      );
    },
    [],
  );

  const value = useMemo<RoomContextType>(
    () => ({
      rooms,
      isLoading,
      hasFetched,
      refetch,
      upsertRoom,
      activeRoomId,
      setActiveRoomId,
    }),
    [rooms, isLoading, hasFetched, refetch, upsertRoom, activeRoomId],
  );

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
};

export const useRoomContext = () => {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error("useRoomContext must be used within a RoomProvider");
  }
  return context;
};
