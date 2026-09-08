import { useCallback, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Pause, Play, RotateCw } from "lucide-react";
import ButtonElement from "@/components/elements/ButtonElement";
import LoadingElement from "@/components/elements/LoadingElement";
import ProgressElement from "@/components/elements/ProgressElement";
import useAudioPlayback from "@/hooks/useAudioPlayback";
import { EQUALIZER_Y, SPRING, TAP, equalizerTransition } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/utils/text";
import { VOICE_COPY } from "../voice-note/voice-note.constants";
import type { KeyboardEvent, PointerEvent } from "react";

interface VoiceNotePlayerProps {
  playbackKey: string | null;
  durationMs: number;
  load: () => Promise<Blob | string>;
  isOwn: boolean;
  isDisabled?: boolean;
}

const BAR_DELAYS = [0, 0.18, 0.36];

const SEEK_STEP = 0.05;

const VoiceNotePlayer = ({
  playbackKey,
  durationMs,
  load,
  isOwn,
  isDisabled,
}: VoiceNotePlayerProps) => {
  const reduceMotion = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const { status, progress, toggle, seek } = useAudioPlayback({
    key: playbackKey,
    durationMs,
    load,
  });

  const isPlaying = status === "playing";
  const isLoading = status === "loading";
  const isFailed = status === "failed";
  const canSeek = status === "playing" || status === "paused";
  const positionSeconds =
    status === "idle" ? durationMs / 1000 : (progress * durationMs) / 1000;

  const seekFromPointer = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!canSeek || !trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      if (rect.width <= 0) return;
      seek((event.clientX - rect.left) / rect.width);
    },
    [canSeek, seek],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowRight" || event.key === "ArrowUp") {
        event.preventDefault();
        seek(progress + SEEK_STEP);
      } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
        event.preventDefault();
        seek(progress - SEEK_STEP);
      } else if (event.key === "Home") {
        event.preventDefault();
        seek(0);
      } else if (event.key === "End") {
        event.preventDefault();
        seek(1);
      } else if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        toggle();
      }
    },
    [progress, seek, toggle],
  );

  return (
    <div className="flex min-w-[200px] items-center gap-3 sm:min-w-[240px]">
      <motion.div whileTap={isDisabled ? undefined : TAP} transition={SPRING.press}>
        <ButtonElement
          variant="ghost"
          size="icon"
          onClick={toggle}
          disabled={isDisabled || isLoading}
          aria-label={isPlaying ? VOICE_COPY.PAUSE : VOICE_COPY.PLAY}
          className={cn(
            "size-9 rounded-full",
            isOwn
              ? "bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/25 hover:text-primary-foreground"
              : "bg-primary/12 text-primary hover:bg-primary/18 hover:text-primary",
            isFailed && !isOwn && "bg-destructive/10 text-destructive",
          )}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={isLoading ? "loading" : isPlaying ? "pause" : isFailed ? "retry" : "play"}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={SPRING.snappy}
              className="flex items-center justify-center"
            >
              {isLoading ? (
                <LoadingElement className="size-4 text-current" />
              ) : isPlaying ? (
                <Pause className="size-4 fill-current" strokeWidth={0} />
              ) : isFailed ? (
                <RotateCw className="size-4" />
              ) : (
                <Play className="ms-0.5 size-4 fill-current" strokeWidth={0} />
              )}
            </motion.span>
          </AnimatePresence>
        </ButtonElement>
      </motion.div>

      <div
        ref={trackRef}
        role="slider"
        tabIndex={isDisabled ? -1 : 0}
        aria-label={VOICE_COPY.PLAY}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
        aria-valuetext={formatDuration(positionSeconds)}
        onPointerDown={seekFromPointer}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex min-w-0 flex-1 cursor-pointer items-center py-2 outline-none",
          "focus-visible:[&>[data-slot=progress]>[data-slot=progress-track]]:ring-2",
          isOwn
            ? "focus-visible:[&>[data-slot=progress]>[data-slot=progress-track]]:ring-primary-foreground/50"
            : "focus-visible:[&>[data-slot=progress]>[data-slot=progress-track]]:ring-primary/40",
        )}
      >
        <ProgressElement
          value={Math.round(progress * 100)}
          label={VOICE_COPY.PLAY}
          className="w-full"
          trackClassName={cn(
            "h-1.5 rounded-full",
            isOwn ? "bg-primary-foreground/25" : "bg-foreground/12",
          )}
          indicatorClassName={cn(
            "rounded-full transition-[width] duration-150 ease-linear",
            isOwn ? "bg-primary-foreground" : "bg-primary",
          )}
        />
      </div>

      <span className="flex w-11 shrink-0 items-center justify-end gap-1.5">
        {isPlaying && !reduceMotion ? (
          <span aria-hidden className="flex h-3 items-end gap-[2px]">
            {BAR_DELAYS.map((delay) => (
              <motion.span
                key={delay}
                animate={EQUALIZER_Y}
                transition={equalizerTransition(delay)}
                className="h-full w-[2px] origin-bottom rounded-full bg-current"
              />
            ))}
          </span>
        ) : null}
        <span
          className={cn(
            "text-xs tabular-nums",
            isOwn ? "text-primary-foreground/80" : "text-muted-foreground",
          )}
        >
          {formatDuration(positionSeconds)}
        </span>
      </span>
    </div>
  );
};

export default VoiceNotePlayer;
