import { motion } from "motion/react";
import { Volume2, VolumeX } from "lucide-react";
import ButtonElement from "@/components/elements/ButtonElement";
import LoadingElement from "@/components/elements/LoadingElement";
import { SPRING, TAP, EQUALIZER_Y, equalizerTransition } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { SpeechStatus } from "../live.interface";

interface SpeakButtonProps {
  status: SpeechStatus;
  onClick: () => void;
}

const BAR_DELAYS = [0, 0.18, 0.36];

const LABELS: Record<SpeechStatus, string> = {
  idle: "Play translation",
  loading: "Generating speech",
  playing: "Stop playback",
  failed: "Retry speech",
};

const SpeakButton = ({ status, onClick }: SpeakButtonProps) => {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.6 }}
      whileTap={TAP}
      transition={SPRING.snappy}
      className="shrink-0"
    >
      <ButtonElement
        variant="ghost"
        size="sm"
        onClick={onClick}
        disabled={status === "loading"}
        aria-label={LABELS[status]}
        className={cn(
          "h-7 w-8 rounded-lg px-0",
          status === "failed" ? "text-destructive" : "text-muted-foreground",
          status === "playing" && "text-primary",
        )}
      >
        {status === "loading" && <LoadingElement className="size-3.5" />}
        {status === "playing" && (
          <span className="flex h-3.5 items-end gap-0.5">
            {BAR_DELAYS.map((delay) => (
              <motion.span
                key={delay}
                animate={EQUALIZER_Y}
                transition={equalizerTransition(delay)}
                className="h-full w-0.5 origin-bottom rounded-full bg-current"
              />
            ))}
          </span>
        )}
        {status === "failed" && <VolumeX className="size-3.5" />}
        {status === "idle" && <Volume2 className="size-3.5" />}
      </ButtonElement>
    </motion.span>
  );
};

export default SpeakButton;
