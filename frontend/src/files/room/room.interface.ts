import type { IUser } from "@/files/user/user.interface";
import type { IMessage } from "@/files/message/message.interface";

export interface IRoom {
  id: string;
  type: "dm";
  otherUser: IUser;
  lastMessage: IMessage | null;
  unreadCount: number;
  otherLastSeenMessageId: string | null;
  otherLastSeenAt: string | null;
  lastMessageAt: string | null;
  createdAt: string;
  isPending?: boolean;
}

export interface IRoomListData {
  items: IRoom[];
  nextCursor: string | null;
}

export interface ICreateDmData {
  room: IRoom;
  isNew: boolean;
}

export interface RoomContextType {
  rooms: IRoom[];
  isLoading: boolean;
  hasFetched: boolean;
  isHydrated: boolean;
  isSkeletonVisible: boolean;
  activeRoomId: string | null;
  refetch: () => Promise<void>;
  upsertRoom: (roomId: string, changes: Partial<IRoom>) => void;
  addRoom: (room: IRoom) => void;
  addPendingRoom: (user: IUser) => string;
  resolvePendingRoom: (pendingId: string, room: IRoom | null) => void;
}
