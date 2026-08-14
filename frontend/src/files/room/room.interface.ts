import type { IUser } from "@/files/user/user.interface";
import type { IMessage } from "@/files/message/message.interface";

export interface IRoom {
  id: string;
  type: "dm";
  otherUser: IUser;
  lastMessage: IMessage | null;
  unreadCount: number;
  lastMessageAt: string | null;
  createdAt: string;
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
  refetch: () => Promise<void>;
  upsertRoom: (roomId: string, changes: Partial<IRoom>) => void;
  addRoom: (room: IRoom) => void;
  activeRoomId: string | null;
  setActiveRoomId: (roomId: string | null) => void;
}
