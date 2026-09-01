import { useMemo } from "react";
import { useRoomContext } from "@/files/room/room.context";
import { useMessageContext } from "../message.context";
import { failedMessagesOf, pendingMessagesOf } from "../message.utils";
import type { IRoomSeen } from "../message.interface";

const latestSeen = (a: IRoomSeen, b: IRoomSeen): IRoomSeen => {
  const aTime = a.lastSeenAt ? new Date(a.lastSeenAt).getTime() : 0;
  const bTime = b.lastSeenAt ? new Date(b.lastSeenAt).getTime() : 0;
  return bTime > aTime ? b : a;
};

const useRoomMessages = (roomId?: string) => {
  const { rooms, activeRoomId } = useRoomContext();
  const { getRoomState, typingUserIds, seenByRoom, loadOlder } =
    useMessageContext();
  const state = getRoomState(roomId ?? null);
  const room = useMemo(
    () => rooms.find((item) => item.id === roomId) ?? null,
    [rooms, roomId],
  );

  const seen = useMemo<IRoomSeen>(() => {
    const fromSocket = (roomId && seenByRoom[roomId]) || {
      lastSeenMessageId: null,
      lastSeenAt: null,
    };
    const fromRoom: IRoomSeen = {
      lastSeenMessageId: room?.otherLastSeenMessageId ?? null,
      lastSeenAt: room?.otherLastSeenAt ?? null,
    };
    return latestSeen(fromRoom, fromSocket);
  }, [room, roomId, seenByRoom]);

  const pendingCount = useMemo(
    () => pendingMessagesOf(state.items).length,
    [state.items],
  );
  const failedCount = useMemo(
    () => failedMessagesOf(state.items).length,
    [state.items],
  );

  return {
    ...state,
    room,
    seen,
    pendingCount,
    failedCount,
    typingUserIds: activeRoomId === roomId ? typingUserIds : [],
    isSkeletonVisible:
      state.isHydrated && !state.hasFetched && state.items.length === 0,
    loadOlder: () => (roomId ? loadOlder(roomId) : Promise.resolve()),
  };
};

export default useRoomMessages;
