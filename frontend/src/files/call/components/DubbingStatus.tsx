import { AnimatePresence, motion } from "motion/react";
import { AudioLines } from "lucide-react";
import { EQUALIZER_Y, SPRING, equalizerTransition } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { languageLabelOf } from "@/constants/languages.constants";
import { DUBBING_COPY } from "../dubbing/dubbing.constants";
import type { DubbingState } from "../dubbing/dubbing.interface";

interface DubbingStatusProps {
  state: DubbingState;
  targetLang: string;
  className?: string;
}

const BAR_DELAYS = [0, 0.15, 0.3];

const labelFor = (state: DubbingState, targetLang: string) => {
  if (state === "connecting") return DUBBING_COPY.CONNECTING;
  if (state === "reconnecting") return DUBBING_COPY.RECONNECTING;
  if (state === "limited") return DUBBING_COPY.LIMITED;
  return `${DUBBING_COPY.LIVE} · ${languageLabelOf(targetLang)}`;
};

const DubbingStatus = ({ state, targetLang, className }: DubbingStatusProps) => {
  const isHidden = state === "off" || state === "unavailable";
  const isSpeaking = state === "speaking";
  const isPending = state === "connecting" || state === "reconnecting";

  return (
    <AnimatePresence>
      {!isHidden && (
        <motion.span
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={SPRING.snappy}
          aria-live="polite"
          className={cn(
            "inline-flex items-center gap-2 self-start rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset",
            state === "limited"
              ? "bg-secondary/70 text-muted-foreground ring-border"
              : "bg-primary/12 text-primary ring-primary/25",
            className,
          )}
        >
          {isSpeaking ? (
            <span aria-hidden className="flex h-3 items-end gap-[2px]">
              {BAR_DELAYS.map((delay) => (
                <motion.span
                  key={delay}
                  animate={EQUALIZER_Y}
                  transition={equalizerTransition(delay)}
                  className="h-3 w-[2px] origin-bottom rounded-full bg-current motion-reduce:animate-none"
                />
              ))}
            </span>
          ) : (
            <AudioLines
              aria-hidden
              className={cn("size-3", isPending && "animate-pulse")}
            />
          )}
          {labelFor(state, targetLang)}
        </motion.span>
      )}
    </AnimatePresence>
  );
};

export default DubbingStatus;
