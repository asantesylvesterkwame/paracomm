import { TEMP_ID_PREFIX } from "@/files/message/message.constants";
import type { IUser } from "@/files/user/user.interface";
import type { IRoom } from "./room.interface";

export const isPendingRoom = (room: IRoom) => Boolean(room.isPending);

export const roomActivityAt = (room: IRoom) =>
  new Date(room.lastMessageAt ?? room.createdAt).getTime();

export const sortRooms = (rooms: IRoom[]) =>
  [...rooms].sort((a, b) => roomActivityAt(b) - roomActivityAt(a));

const seenAtOf = (room: IRoom) =>
  room.otherLastSeenAt ? new Date(room.otherLastSeenAt).getTime() : 0;

const isLocalSeenNewer = (local: IRoom, server: IRoom) =>
  seenAtOf(local) > seenAtOf(server);

export const mergeRooms = (
  server: IRoom[],
  previous: IRoom[],
  options?: { activeRoomId?: string | null },
): IRoom[] => {
  const previousById = new Map(previous.map((room) => [room.id, room]));
  const serverIds = new Set(server.map((room) => room.id));
  const merged = server.map((room) => {
    const local = previousById.get(room.id);
    if (!local) return room;
    const isLocalNewer =
      roomActivityAt(local) > roomActivityAt(room) ||
      Boolean(local.lastMessage?.id.startsWith(TEMP_ID_PREFIX));
    return {
      ...room,
      lastMessage: isLocalNewer ? local.lastMessage : room.lastMessage,
      lastMessageAt: isLocalNewer ? local.lastMessageAt : room.lastMessageAt,
      unreadCount:
        options?.activeRoomId === room.id ? 0 : room.unreadCount,
      ...(isLocalSeenNewer(local, room)
        ? {
            otherLastSeenAt: local.otherLastSeenAt,
            otherLastSeenMessageId: local.otherLastSeenMessageId,
          }
        : {}),
    };
  });
  const pending = previous.filter(
    (room) => isPendingRoom(room) && !serverIds.has(room.id),
  );
  return sortRooms([...merged, ...pending]);
};

export const pendingRoomOf = (user: IUser, pendingId: string): IRoom => {
  const now = new Date().toISOString();
  return {
    id: pendingId,
    type: "dm",
    otherUser: user,
    lastMessage: null,
    unreadCount: 0,
    otherLastSeenMessageId: null,
    otherLastSeenAt: null,
    lastMessageAt: null,
    createdAt: now,
    isPending: true,
  };
};

export const roomNameOf = (room: IRoom) =>
  room.otherUser.displayName ?? room.otherUser.username ?? "User";

export const roomPreviewOf = (room: IRoom, myUserId?: string) => {
  const message = room.lastMessage;
  if (!message) {
    return {
      text: room.isPending ? "Opening chat" : "Start the conversation",
      isTranslating: false,
      isOwn: false,
    };
  }
  const isOwn = message.senderId === myUserId;
  const isTranslating = !isOwn && message.translationStatus === "pending";
  const text =
    !isOwn && message.translationStatus === "done" && message.translatedText
      ? message.translatedText
      : message.originalText;
  return { text, isTranslating, isOwn };
};
