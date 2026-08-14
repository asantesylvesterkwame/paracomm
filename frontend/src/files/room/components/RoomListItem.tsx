import { NavLink } from "react-router-dom";
import { motion } from "motion/react";
import AvatarElement from "@/components/elements/AvatarElement";
import BadgeElement from "@/components/elements/BadgeElement";
import { SPRING } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { formatTimeAgo } from "@/utils";
import { chatRoomRoute } from "@/constants/routes.constants";
import type { IRoom } from "../room.interface";

const RoomListItem = ({ room, myUserId }: { room: IRoom; myUserId?: string }) => {
  const name = room.otherUser.displayName ?? room.otherUser.username ?? "User";
  const lastMessage = room.lastMessage;
  const preview = lastMessage
    ? lastMessage.senderId !== myUserId &&
      lastMessage.translationStatus === "done" &&
      lastMessage.translatedText
      ? lastMessage.translatedText
      : lastMessage.originalText
    : "Start the conversation";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING.card}
    >
      <NavLink
        to={chatRoomRoute(room.id)}
        className={({ isActive }) =>
          cn(
            "flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-secondary",
            isActive && "bg-secondary",
          )
        }
      >
        <AvatarElement src={room.otherUser.avatarUrl} name={name} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex items-center justify-between gap-2">
            <span className="truncate font-medium">{name}</span>
            {room.lastMessageAt && (
              <span className="shrink-0 text-[11px] text-muted-foreground">
                {formatTimeAgo(room.lastMessageAt)}
              </span>
            )}
          </span>
          <span className="flex items-center justify-between gap-2">
            <span className="truncate text-sm text-muted-foreground">
              {preview}
            </span>
            {room.unreadCount > 0 && (
              <BadgeElement className="h-5 min-w-5 justify-center rounded-full px-1.5 text-[11px]">
                {room.unreadCount}
              </BadgeElement>
            )}
          </span>
        </span>
      </NavLink>
    </motion.div>
  );
};

export default RoomListItem;
