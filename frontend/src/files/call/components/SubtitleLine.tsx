import { motion } from "motion/react";
import ShimmerTextElement from "@/components/elements/ShimmerTextElement";
import { SPRING } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { languageLabelOf } from "@/constants/languages.constants";
import { CALL_COPY } from "../call.constants";
import type { ICaption } from "../call.interface";

interface SubtitleLineProps {
  caption: ICaption;
}

const SubtitleLine = ({ caption }: SubtitleLineProps) => {
  const isPending = caption.status === "pending";
  const isTranslated = caption.status === "done" && Boolean(caption.translation);
  const leadText = isTranslated ? caption.translation : caption.originalText;

  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={SPRING.card}
      className={cn(
        "flex gap-3 border-s-2 ps-3",
        caption.isOwn ? "border-muted-foreground/40" : "border-primary",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "mt-1 shrink-0 text-[10px] font-semibold tracking-[0.14em] uppercase tabular-nums",
          caption.isOwn ? "text-muted-foreground/70" : "text-primary",
        )}
      >
        {caption.originalLang.slice(0, 2)}
      </span>

      <span className="flex min-w-0 flex-col gap-0.5">
        {isTranslated && (
          <span className="text-[13px] leading-snug text-muted-foreground">
            {caption.originalText}
          </span>
        )}
        <span
          className={cn(
            "max-w-[36ch] text-balance font-medium tracking-tight",
            caption.isOwn
              ? "text-[15px] leading-snug text-muted-foreground"
              : "text-[clamp(1.125rem,2.2vw,1.75rem)] leading-tight text-foreground",
          )}
        >
          {isPending ? (
            <ShimmerTextElement>{caption.originalText}</ShimmerTextElement>
          ) : (
            leadText
          )}
        </span>
        {caption.status === "untranslated" && !caption.isOwn && (
          <span className="text-[11px] text-muted-foreground">
            {CALL_COPY.UNTRANSLATED} in {languageLabelOf(caption.originalLang)}
          </span>
        )}
      </span>
    </motion.li>
  );
};

export default SubtitleLine;
