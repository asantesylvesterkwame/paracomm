import { AnimatePresence, motion } from "motion/react";
import { AudioLines, RotateCw } from "lucide-react";
import SkeletonElement from "@/components/elements/SkeletonElement";
import ButtonElement from "@/components/elements/ButtonElement";
import EmptyState from "@/components/common/EmptyState";
import SpeakButton from "./SpeakButton";
import { SPRING } from "@/lib/motion";
import { languageLabel } from "../live.utils";
import { INPUT_LANGUAGES, OUTPUT_LANGUAGES } from "../live.constants";
import type { IUtterance, LiveStatus } from "../live.interface";

interface TranscriptPanelProps {
  status: LiveStatus;
  utterances: IUtterance[];
  interimTranscript: string;
  inputLang: string;
  outputLang: string;
  onRetry: (id: string) => void;
  onSpeak: (id: string) => void;
}

const TranscriptPanel = ({
  status,
  utterances,
  interimTranscript,
  inputLang,
  outputLang,
  onRetry,
  onSpeak,
}: TranscriptPanelProps) => {
  if (status === "idle" && utterances.length === 0 && !interimTranscript) {
    return (
      <EmptyState
        icon={AudioLines}
        title="Press record and start speaking"
        description="Your words appear here in both languages as you talk."
        className="w-full"
      />
    );
  }

  return (
    <div className="grid w-full gap-4 md:grid-cols-2">
      <div className="flex flex-col gap-3 rounded-3xl border border-border/60 bg-card/95 p-5">
        <span className="text-eyebrow">
          {languageLabel(INPUT_LANGUAGES, inputLang)}
        </span>
        <div className="flex flex-col gap-2 text-[15px] leading-relaxed">
          <AnimatePresence initial={false}>
            {utterances.map((utterance) => (
              <motion.div
                key={utterance.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={SPRING.card}
              >
                {utterance.direction === "inbound" &&
                utterance.status === "done" ? (
                  <span className="flex items-start justify-between gap-2">
                    <p className="font-medium text-foreground">
                      {utterance.translation}
                    </p>
                    <SpeakButton
                      status={utterance.speechStatus ?? "idle"}
                      onClick={() => onSpeak(utterance.id)}
                    />
                  </span>
                ) : (
                  <p className="text-foreground">{utterance.sourceText}</p>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {interimTranscript && (
            <p className="text-muted-foreground italic">{interimTranscript}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-3xl border border-primary/25 bg-primary/[0.04] p-5">
        <span className="text-eyebrow">
          {languageLabel(OUTPUT_LANGUAGES, outputLang)}
        </span>
        <div className="flex flex-col gap-2 text-[15px] leading-relaxed">
          <AnimatePresence initial={false}>
            {utterances.map((utterance) => (
              <motion.div
                key={utterance.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={SPRING.card}
              >
                {utterance.status === "pending" && (
                  <SkeletonElement className="h-5 w-3/4 rounded-lg" />
                )}
                {utterance.status === "done" &&
                  (utterance.direction === "inbound" ? (
                    <p className="text-foreground">{utterance.sourceText}</p>
                  ) : (
                    <span className="flex items-start justify-between gap-2">
                      <p className="font-medium text-foreground">
                        {utterance.translation}
                      </p>
                      <SpeakButton
                        status={utterance.speechStatus ?? "idle"}
                        onClick={() => onSpeak(utterance.id)}
                      />
                    </span>
                  ))}
                {utterance.status === "failed" && (
                  <span className="flex items-center gap-2 text-sm text-destructive">
                    Could not translate this phrase
                    <ButtonElement
                      variant="ghost"
                      size="sm"
                      onClick={() => onRetry(utterance.id)}
                      className="h-7 gap-1 rounded-lg px-2 text-xs"
                    >
                      <RotateCw className="size-3" />
                      Retry
                    </ButtonElement>
                  </span>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default TranscriptPanel;
