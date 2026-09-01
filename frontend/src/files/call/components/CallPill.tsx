import { motion } from "motion/react";
import { Maximize2, PhoneOff } from "lucide-react";
import AvatarElement from "@/components/elements/AvatarElement";
import ButtonElement from "@/components/elements/ButtonElement";
import { SPRING } from "@/lib/motion";
import { formatDuration } from "@/utils/text";
import { CALL_COPY } from "../call.constants";
import type { IUser } from "@/files/user/user.interface";

interface CallPillProps {
  otherUser: IUser | null;
  elapsedSeconds: number;
  onExpand: () => void;
  onLeave: () => void;
}

const CallPill = ({
  otherUser,
  elapsedSeconds,
  onExpand,
  onLeave,
}: CallPillProps) => {
  const name = otherUser?.displayName ?? otherUser?.username ?? "On a call";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={SPRING.panel}
      className="fixed inset-x-4 bottom-4 z-50 mx-auto flex w-auto max-w-sm items-center gap-3 rounded-4xl bg-card p-2 ps-3 text-card-foreground shadow-2xl ring-1 ring-border sm:inset-x-auto sm:end-6 sm:w-sm"
    >
      <AvatarElement src={otherUser?.avatarUrl} name={name} size="sm" />
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium">{name}</span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {formatDuration(elapsedSeconds)}
        </span>
      </span>
      <span className="ms-auto flex items-center gap-1">
        <ButtonElement
          variant="ghost"
          size="icon"
          onClick={onExpand}
          aria-label={CALL_COPY.EXPAND}
          className="size-9 rounded-full"
        >
          <Maximize2 className="size-4" />
        </ButtonElement>
        <ButtonElement
          variant="destructive"
          size="icon"
          onClick={onLeave}
          aria-label={CALL_COPY.HANG_UP}
          className="size-9 rounded-full"
        >
          <PhoneOff className="size-4" />
        </ButtonElement>
      </span>
    </motion.div>
  );
};

export default CallPill;
