import { motion } from "motion/react";
import { AudioLines, RotateCw } from "lucide-react";
import ButtonElement from "@/components/elements/ButtonElement";
import ShimmerTextElement from "@/components/elements/ShimmerTextElement";
import useDelayedFlag from "@/hooks/useDelayedFlag";
import { SPRING } from "@/lib/motion";
import { languageLabelOf } from "@/constants/languages.constants";
import { DUB_HINT_DELAY_MS, VOICE_COPY, voicingIn } from "../voice-note/voice-note.constants";
import type { IVoiceNoteDub } from "../voice-note/voice-note.interface";

interface DubStatusProps {
  dub: IVoiceNoteDub;
  isRequesting: boolean;
  onRetry: (lang: string) => void;
}

const failureCopyOf = (error: string | null) => {
  if (error === "unsupported") return VOICE_COPY.DUB_UNSUPPORTED;
  if (error === "quota") return VOICE_COPY.DUB_QUOTA;
  return VOICE_COPY.DUB_FAILED;
};

const DubStatus = ({ dub, isRequesting, onRetry }: DubStatusProps) => {
  const isPending = dub.status === "pending" || isRequesting;
  const isVisible = useDelayedFlag(isPending, DUB_HINT_DELAY_MS);
  const canRetry = dub.status === "failed" && dub.error !== "unsupported";

  if (isPending && !isVisible) return null;

  return (
    <motion.span
      layout="position"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={SPRING.card}
      aria-live="polite"
      className="flex items-center gap-1.5 text-[11px]"
    >
      {isPending ? (
        <>
          <AudioLines className="size-3 animate-pulse text-primary" aria-hidden />
          <ShimmerTextElement>{voicingIn(languageLabelOf(dub.lang))}</ShimmerTextElement>
        </>
      ) : canRetry ? (
        <ButtonElement
          variant="ghost"
          size="sm"
          onClick={() => onRetry(dub.lang)}
          className="h-6 gap-1 rounded-lg px-2 text-[11px] text-destructive hover:text-destructive"
        >
          <RotateCw className="size-3" />
          {failureCopyOf(dub.error)}
        </ButtonElement>
      ) : (
        <span className="px-1 text-muted-foreground">{failureCopyOf(dub.error)}</span>
      )}
    </motion.span>
  );
};

export default DubStatus;
