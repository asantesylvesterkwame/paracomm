import { AnimatePresence, motion } from "motion/react";
import { CaptionsOff, MicOff } from "lucide-react";
import { SPRING } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { CALL_COPY } from "../call.constants";
import SubtitleLine from "./SubtitleLine";
import type { ICaption } from "../call.interface";

interface SubtitleTrackProps {
  captions: ICaption[];
  interim: string;
  remoteInterim: string;
  isEnabled: boolean;
  isSupported: boolean;
  isMicMuted: boolean;
  className?: string;
}

const Notice = ({
  icon: Icon,
  children,
}: {
  icon: typeof CaptionsOff;
  children: string;
}) => (
  <p className="flex items-center gap-2 text-sm text-muted-foreground">
    <Icon aria-hidden className="size-4 shrink-0" />
    {children}
  </p>
);

const SubtitleTrack = ({
  captions,
  interim,
  remoteInterim,
  isEnabled,
  isSupported,
  isMicMuted,
  className,
}: SubtitleTrackProps) => {
  const hasLines = captions.length > 0;
  const liveText = remoteInterim || interim;

  return (
    <motion.section
      layout
      transition={SPRING.card}
      aria-live="polite"
      aria-label="Live subtitles"
      className={cn(
        "w-full max-w-3xl rounded-3xl bg-background/70 px-5 py-4 ring-1 ring-border backdrop-blur-xl",
        className,
      )}
    >
      {!isSupported ? (
        <Notice icon={CaptionsOff}>{CALL_COPY.CAPTIONS_UNSUPPORTED}</Notice>
      ) : !isEnabled ? (
        <Notice icon={CaptionsOff}>{CALL_COPY.CAPTIONS_DISABLED}</Notice>
      ) : (
        <div className="flex flex-col gap-3">
          <ul className="flex flex-col gap-3">
            <AnimatePresence initial={false} mode="popLayout">
              {captions.map((caption) => (
                <SubtitleLine key={caption.id} caption={caption} />
              ))}
            </AnimatePresence>
          </ul>

          <AnimatePresence initial={false}>
            {liveText && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={SPRING.snappy}
                className="ps-5 text-sm text-muted-foreground italic"
              >
                {liveText}
              </motion.p>
            )}
          </AnimatePresence>

          {!hasLines && !liveText && (
            <p className="text-sm text-muted-foreground">
              {CALL_COPY.CAPTIONS_IDLE}
            </p>
          )}

          {isMicMuted && (
            <Notice icon={MicOff}>{CALL_COPY.CAPTIONS_MIC_MUTED}</Notice>
          )}
        </div>
      )}
    </motion.section>
  );
};

export default SubtitleTrack;
