import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { RotateCw, Languages } from "lucide-react";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import SkeletonElement from "@/components/elements/SkeletonElement";
import ButtonElement from "@/components/elements/ButtonElement";
import { SPRING } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { formatTimeAgo } from "@/utils";
import { languageLabelOf } from "@/constants/languages.constants";
import type { IClientMessage } from "../message.interface";

interface MessageBubbleProps {
  message: IClientMessage;
  isOwn: boolean;
  onRetrySend: (id: string) => void;
  onRetryTranslation: (id: string) => void;
}

const MessageBubble = ({
  message,
  isOwn,
  onRetrySend,
  onRetryTranslation,
}: MessageBubbleProps) => {
  const [showOriginal, setShowOriginal] = useState(false);
  const isTranslated = !isOwn && message.translationStatus === "done";
  const isTranslating = !isOwn && message.translationStatus === "pending";
  const translationFailed = !isOwn && message.translationStatus === "failed";
  const displayText =
    isTranslated && message.translatedText
      ? message.translatedText
      : message.originalText;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={SPRING.card}
      className={cn("flex flex-col gap-1", isOwn ? "items-end" : "items-start")}
    >
      <Bubble
        variant={isOwn ? "default" : "secondary"}
        align={isOwn ? "end" : "start"}
        className={cn(message.clientStatus === "failed" && "opacity-70")}
      >
        <BubbleContent
          render={isTranslated ? <button type="button" /> : undefined}
          onClick={
            isTranslated ? () => setShowOriginal((value) => !value) : undefined
          }
          aria-expanded={isTranslated ? showOriginal : undefined}
        >
          {displayText}
          {isTranslated && (
            <Languages
              aria-hidden
              className="ml-1.5 inline size-3 align-[-0.125em] opacity-60"
            />
          )}
        </BubbleContent>
      </Bubble>
      {isTranslating && <SkeletonElement className="h-3 w-24 rounded-md" />}
      <AnimatePresence initial={false}>
        {showOriginal && isTranslated && (
          <motion.p
            initial={{ opacity: 0, height: 0, y: -4 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -4 }}
            transition={SPRING.card}
            className="max-w-[80%] overflow-hidden rounded-2xl bg-muted/60 px-3 py-2 text-xs text-muted-foreground"
          >
            <span className="mb-0.5 flex items-center gap-1 font-medium">
              <Languages className="size-3" />
              {languageLabelOf(message.originalLang)}
            </span>
            {message.originalText}
          </motion.p>
        )}
      </AnimatePresence>
      <span className="flex items-center gap-2 text-[11px] text-muted-foreground">
        {message.clientStatus === "sending" && "Sending"}
        {message.clientStatus === "failed" && (
          <ButtonElement
            variant="ghost"
            size="sm"
            onClick={() => onRetrySend(message.id)}
            className="h-6 gap-1 rounded-lg px-2 text-[11px] text-destructive"
          >
            <RotateCw className="size-3" />
            Failed. Tap to retry
          </ButtonElement>
        )}
        {translationFailed && (
          <ButtonElement
            variant="ghost"
            size="sm"
            onClick={() => onRetryTranslation(message.id)}
            className="h-6 gap-1 rounded-lg px-2 text-[11px]"
          >
            <Languages className="size-3" />
            Showing original. Translate again
          </ButtonElement>
        )}
        {!message.clientStatus && !translationFailed && (
          <span>{formatTimeAgo(message.createdAt)}</span>
        )}
      </span>
    </motion.div>
  );
};

export default MessageBubble;
