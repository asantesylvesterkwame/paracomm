import { motion } from "motion/react";
import { Check, CheckCheck, Clock3, RotateCw } from "lucide-react";
import ButtonElement from "@/components/elements/ButtonElement";
import { SPRING } from "@/lib/motion";
import { formatTimeAgo } from "@/utils";
import { SEND_ERROR_COPY } from "../message.constants";
import type { IClientMessage } from "../message.interface";

interface MessageStatusProps {
  message: IClientMessage;
  isOwn: boolean;
  isSeen: boolean;
  onRetrySend: (id: string) => void;
}

const MessageStatus = ({
  message,
  isOwn,
  isSeen,
  onRetrySend,
}: MessageStatusProps) => {
  if (message.clientStatus === "failed") {
    return (
      <ButtonElement
        variant="ghost"
        size="sm"
        onClick={() => onRetrySend(message.id)}
        className="h-6 gap-1.5 rounded-lg px-2 text-[11px] text-destructive hover:text-destructive"
      >
        <RotateCw className="size-3" />
        {SEND_ERROR_COPY[message.clientError ?? "fatal"]}
      </ButtonElement>
    );
  }

  if (message.clientStatus === "sending") {
    return (
      <motion.span
        layout
        transition={SPRING.snappy}
        className="flex items-center gap-1 text-[11px] text-muted-foreground"
      >
        <Clock3 className="size-3" />
        Sending
      </motion.span>
    );
  }

  return (
    <motion.span
      layout
      transition={SPRING.snappy}
      className="flex items-center gap-1 text-[11px] text-muted-foreground"
    >
      {formatTimeAgo(message.createdAt)}
      {isOwn &&
        (isSeen ? (
          <CheckCheck className="size-3.5 text-primary" />
        ) : (
          <Check className="size-3.5" />
        ))}
    </motion.span>
  );
};

export default MessageStatus;
