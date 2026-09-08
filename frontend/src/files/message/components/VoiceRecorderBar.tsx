import { motion, useReducedMotion } from "motion/react";
import { SendHorizontal, X } from "lucide-react";
import ButtonElement from "@/components/elements/ButtonElement";
import ShimmerTextElement from "@/components/elements/ShimmerTextElement";
import { EQUALIZER_Y, SPRING, TAP, equalizerTransition } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/utils/text";
import { MAX_VOICE_NOTE_MS, VOICE_COPY } from "../voice-note/voice-note.constants";
import type { RecorderStatus } from "@/hooks/useVoiceRecorder";

interface VoiceRecorderBarProps {
  status: RecorderStatus;
  elapsedMs: number;
  onStop: () => void;
  onCancel: () => void;
}

const BAR_DELAYS = [0, 0.15, 0.3, 0.45];

const VoiceRecorderBar = ({
  status,
  elapsedMs,
  onStop,
  onCancel,
}: VoiceRecorderBarProps) => {
  const reduceMotion = useReducedMotion();
  const isRecording = status === "recording";
  const ratio = Math.min(1, elapsedMs / MAX_VOICE_NOTE_MS);
  const remainingSeconds = Math.ceil((MAX_VOICE_NOTE_MS - elapsedMs) / 1000);
  const isNearLimit = isRecording && remainingSeconds <= 10;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.98 }}
      transition={SPRING.snappy}
      className="flex items-center gap-2"
      role="status"
      aria-live="polite"
    >
      <ButtonElement
        variant="ghost"
        size="icon"
        onClick={onCancel}
        disabled={status === "stopping"}
        aria-label={VOICE_COPY.CANCEL}
        className="size-11 shrink-0 rounded-2xl text-muted-foreground hover:text-destructive"
      >
        <X className="size-5" />
      </ButtonElement>

      <div className="relative flex h-11 min-w-0 flex-1 items-center gap-3 overflow-hidden rounded-2xl bg-secondary/70 px-3.5 ring-1 ring-inset ring-border/60">
        <motion.span
          aria-hidden
          className="absolute inset-y-0 left-0 bg-primary/10"
          animate={{ width: `${ratio * 100}%` }}
          transition={{ duration: 0.12, ease: "linear" }}
        />
        <span className="relative flex size-2.5 shrink-0 items-center justify-center">
          {isRecording && !reduceMotion && (
            <motion.span
              aria-hidden
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 2.6, opacity: 0 }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
              className="absolute inset-0 rounded-full bg-destructive/50"
            />
          )}
          <span
            className={cn(
              "relative size-2.5 rounded-full",
              isRecording ? "bg-destructive" : "bg-muted-foreground/50",
            )}
          />
        </span>

        <span className="relative flex h-4 items-end gap-[3px]" aria-hidden>
          {BAR_DELAYS.map((delay) => (
            <motion.span
              key={delay}
              animate={isRecording && !reduceMotion ? EQUALIZER_Y : { scaleY: 0.4 }}
              transition={
                isRecording && !reduceMotion
                  ? equalizerTransition(delay)
                  : SPRING.snappy
              }
              className="h-full w-[3px] origin-bottom rounded-full bg-primary"
            />
          ))}
        </span>

        <span className="relative flex min-w-0 flex-1 items-baseline gap-1.5 text-sm">
          {isRecording ? (
            <>
              <span
                className={cn(
                  "font-medium tabular-nums",
                  isNearLimit ? "text-destructive" : "text-foreground",
                )}
              >
                {formatDuration(elapsedMs / 1000)}
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">
                / {formatDuration(MAX_VOICE_NOTE_MS / 1000)}
              </span>
            </>
          ) : (
            <ShimmerTextElement className="text-xs">
              {VOICE_COPY.PREPARING}
            </ShimmerTextElement>
          )}
        </span>
      </div>

      <motion.div whileTap={isRecording ? TAP : undefined} transition={SPRING.press}>
        <ButtonElement
          onClick={onStop}
          disabled={!isRecording}
          size="icon"
          aria-label={VOICE_COPY.STOP}
          className="size-11 shrink-0 rounded-2xl shadow-[0_8px_20px_-10px_rgba(0,100,255,0.55)]"
        >
          <SendHorizontal className="size-5" />
        </ButtonElement>
      </motion.div>
    </motion.div>
  );
};

export default VoiceRecorderBar;
