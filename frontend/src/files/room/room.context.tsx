import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useMatch } from "react-router-dom";
import { useAuthContext } from "@/files/auth/auth.context";
import { useRoomSocket } from "@/context/RoomSocketContext";
import useCachedState from "@/hooks/useCachedState";
import { CACHED_ROOMS, roomsCacheKey } from "@/constants/cache.constants";
import { ROUTES } from "@/constants/routes.constants";
import { TEMP_ID_PREFIX } from "@/files/message/message.constants";
import RoomService from "./room.service";
import { mergeRooms, pendingRoomOf, sortRooms } from "./room.utils";
import type { IRoom, RoomContextType } from "./room.interface";
import type { IUser } from "@/files/user/user.interface";
import type { ReactNode } from "react";

const RoomContext = createContext<RoomContextType | undefined>(undefined);

const REFRESH_INTERVAL_MS = 45000;

export const RoomProvider = ({ children }: { children: ReactNode }) => {
  const { isSignedIn, profile, identityId } = useAuthContext();
  const { connectionKey } = useRoomSocket();
  const activeRoomId = useMatch(ROUTES.CHAT_ROOM)?.params.roomId ?? null;
  const [rooms, setRooms] = useState<IRoom[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const fetchingRef = useRef(false);
  const activeRoomRef = useRef<string | null>(activeRoomId);

  useEffect(() => {
    activeRoomRef.current = activeRoomId;
  }, [activeRoomId]);

  const refetch = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setIsLoading(true);
    const result = await RoomService.getRooms().catch(() => null);
    if (result?.data?.items) {
      const items = result.data.items;
      setRooms((previous) =>
        mergeRooms(items, previous, {
          activeRoomId: activeRoomRef.current,
        }),
      );
      setHasFetched(true);
    }
    fetchingRef.current = false;
    setIsLoading(false);
  }, []);

  const { isHydrated } = useCachedState<IRoom[]>({
    key: identityId ? roomsCacheKey(identityId) : null,
    value: rooms,
    onHydrate: (cached) =>
      setRooms((previous) =>
        previous.length > 0 ? previous : sortRooms(cached),
      ),
    transform: (value) =>
      value.filter((room) => !room.isPending).slice(0, CACHED_ROOMS),
    enabled: Boolean(identityId),
  });

  useEffect(() => {
    if (!isSignedIn) {
      setRooms([]);
      setHasFetched(false);
      return;
    }
    if (!profile) return;
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

  useEffect(() => {
    if (connectionKey < 2) return;
    void refetch();
  }, [connectionKey, refetch]);

  const upsertRoom = useCallback((roomId: string, changes: Partial<IRoom>) => {
    setRooms((previous) => {
      if (!previous.some((room) => room.id === roomId)) return previous;
      return sortRooms(
        previous.map((room) =>
          room.id === roomId ? { ...room, ...changes } : room,
        ),
      );
    });
  }, []);

  const addRoom = useCallback((room: IRoom) => {
    setRooms((previous) =>
      previous.some((item) => item.id === room.id)
        ? sortRooms(
            previous.map((item) => (item.id === room.id ? room : item)),
          )
        : sortRooms([room, ...previous]),
    );
  }, []);

  const addPendingRoom = useCallback((user: IUser) => {
    const pendingId = `${TEMP_ID_PREFIX}${crypto.randomUUID()}`;
    setRooms((previous) => [pendingRoomOf(user, pendingId), ...previous]);
    return pendingId;
  }, []);

  const resolvePendingRoom = useCallback(
    (pendingId: string, room: IRoom | null) => {
      setRooms((previous) => {
        const without = previous.filter((item) => item.id !== pendingId);
        if (!room) return without;
        return sortRooms(
          without.some((item) => item.id === room.id)
            ? without.map((item) => (item.id === room.id ? room : item))
            : [room, ...without],
        );
      });
    },
    [],
  );

  useEffect(() => {
    if (!activeRoomId) return;
    upsertRoom(activeRoomId, { unreadCount: 0 });
  }, [activeRoomId, upsertRoom]);

  const value = useMemo<RoomContextType>(
    () => ({
      rooms,
      isLoading,
      hasFetched,
      isHydrated,
      isSkeletonVisible: !hasFetched && rooms.length === 0,
      activeRoomId,
      refetch,
      upsertRoom,
      addRoom,
      addPendingRoom,
      resolvePendingRoom,
    }),
    [
      rooms,
      isLoading,
      hasFetched,
      isHydrated,
      activeRoomId,
      refetch,
      upsertRoom,
      addRoom,
      addPendingRoom,
      resolvePendingRoom,
    ],
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
