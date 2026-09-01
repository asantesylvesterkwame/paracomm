import { motion } from "motion/react";
import { Phone, PhoneOff } from "lucide-react";
import AvatarElement from "@/components/elements/AvatarElement";
import ButtonElement from "@/components/elements/ButtonElement";
import { SPRING } from "@/lib/motion";
import { languageLabelOf } from "@/constants/languages.constants";
import { CALL_COPY } from "../call.constants";
import type { IUser } from "@/files/user/user.interface";

interface IncomingCallDialogProps {
  caller: IUser;
  isAccepting: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

const IncomingCallDialog = ({
  caller,
  isAccepting,
  onAccept,
  onDecline,
}: IncomingCallDialogProps) => {
  const name = caller.displayName ?? caller.username ?? "Someone";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/20 p-4 backdrop-blur-sm sm:items-center">
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={CALL_COPY.INCOMING}
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.98 }}
        transition={SPRING.panel}
        className="flex w-full max-w-sm flex-col items-center gap-5 rounded-4xl bg-card p-6 text-card-foreground shadow-2xl ring-1 ring-border"
      >
        <motion.span
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          className="motion-reduce:animate-none"
        >
          <AvatarElement
            src={caller.avatarUrl}
            name={name}
            className="size-20"
          />
        </motion.span>

        <span className="flex flex-col items-center gap-1 text-center">
          <span className="text-eyebrow">{CALL_COPY.INCOMING}</span>
          <span className="text-xl font-medium">{name}</span>
          <span className="text-sm text-muted-foreground">
            Speaks {languageLabelOf(caller.preferredLang)}. You will see
            subtitles in yours.
          </span>
        </span>

        <div className="flex w-full items-center gap-3">
          <ButtonElement
            variant="outline"
            onClick={onDecline}
            className="h-12 flex-1 gap-2 rounded-4xl"
          >
            <PhoneOff className="size-4" />
            {CALL_COPY.DECLINE}
          </ButtonElement>
          <ButtonElement
            onClick={onAccept}
            disabled={isAccepting}
            isLoading={isAccepting}
            className="h-12 flex-1 gap-2 rounded-4xl"
          >
            <Phone className="size-4" />
            {CALL_COPY.ANSWER}
          </ButtonElement>
        </div>
      </motion.div>
    </div>
  );
};

export default IncomingCallDialog;
