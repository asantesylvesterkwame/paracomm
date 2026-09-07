import { NavLink } from "react-router-dom";
import { motion } from "motion/react";
import AvatarElement from "@/components/elements/AvatarElement";
import BadgeElement from "@/components/elements/BadgeElement";
import ShimmerTextElement from "@/components/elements/ShimmerTextElement";
import useDelayedFlag from "@/hooks/useDelayedFlag";
import { TRANSLATING_HINT_DELAY_MS } from "@/files/message/message.constants";
import { SPRING } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { formatTimeAgo } from "@/utils";
import { chatRoomRoute } from "@/constants/routes.constants";
import { roomNameOf, roomPreviewOf } from "../room.utils";
import type { IRoom } from "../room.interface";

const ROW_CLASSNAME =
  "flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors";

const RoomListItem = ({
  room,
  myUserId,
}: {
  room: IRoom;
  myUserId?: string;
}) => {
  const name = roomNameOf(room);
  const preview = roomPreviewOf(room, myUserId);
  const isTranslating = useDelayedFlag(
    preview.isTranslating,
    TRANSLATING_HINT_DELAY_MS,
  );

  const body = (
    <>
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
            {isTranslating || room.isPending ? (
              <ShimmerTextElement>{preview.text}</ShimmerTextElement>
            ) : (
              <>
                {preview.isOwn && (
                  <span className="text-muted-foreground/70">You: </span>
                )}
                {preview.text}
              </>
            )}
          </span>
          {room.unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={SPRING.snappy}
            >
              <BadgeElement className="h-5 min-w-5 justify-center rounded-full px-1.5 text-[11px]">
                {room.unreadCount}
              </BadgeElement>
            </motion.span>
          )}
        </span>
      </span>
    </>
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={SPRING.card}
    >
      {room.isPending ? (
        <span className={cn(ROW_CLASSNAME, "opacity-60")} aria-busy>
          {body}
        </span>
      ) : (
        <NavLink
          to={chatRoomRoute(room.id)}
          className={({ isActive }) =>
            cn(ROW_CLASSNAME, "hover:bg-secondary", isActive && "bg-secondary")
          }
        >
          {body}
        </NavLink>
      )}
    </motion.div>
  );
};

export default RoomListItem;
