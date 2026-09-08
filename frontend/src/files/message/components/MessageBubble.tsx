import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Languages } from "lucide-react";
import { Bubble, BubbleContent } from "@/components/elements/BubbleElement";
import ShimmerTextElement from "@/components/elements/ShimmerTextElement";
import ButtonElement from "@/components/elements/ButtonElement";
import { SPRING } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { languageLabelOf } from "@/constants/languages.constants";
import useDelayedFlag from "@/hooks/useDelayedFlag";
import CallEntry from "@/components/common/CallEntry";
import MessageStatus from "./MessageStatus";
import VoiceNoteBubble from "./VoiceNoteBubble";
import { TRANSLATING_HINT_DELAY_MS } from "../message.constants";
import type { IClientMessage } from "../message.interface";
import type { IDubRequestTarget } from "../voice-note/voice-note.interface";

interface MessageBubbleProps {
  message: IClientMessage;
  isOwn: boolean;
  isSeen: boolean;
  myLang: string;
  requestingDubFor: IDubRequestTarget | null;
  onRetrySend: (id: string) => void;
  onRetryTranslation: (id: string) => void;
  onDismiss: (id: string) => void;
  onRequestDub: (messageId: string, lang: string) => void;
}

const MessageBubble = ({
  message,
  isOwn,
  isSeen,
  myLang,
  requestingDubFor,
  onRetrySend,
  onRetryTranslation,
  onDismiss,
  onRequestDub,
}: MessageBubbleProps) => {
  const [showOriginal, setShowOriginal] = useState(false);
  const isTranslationPending =
    !isOwn && message.kind === "text" && message.translationStatus === "pending";
  const isTranslating = useDelayedFlag(
    isTranslationPending,
    TRANSLATING_HINT_DELAY_MS,
  );

  if (message.kind === "call") {
    return (
      <CallEntry
        label={message.originalText}
        createdAt={message.createdAt}
        isOwn={isOwn}
      />
    );
  }

  if (message.kind === "voice") {
    return (
      <VoiceNoteBubble
        message={message}
        isOwn={isOwn}
        isSeen={isSeen}
        myLang={myLang}
        requestingDubFor={requestingDubFor}
        onRetrySend={onRetrySend}
        onDismiss={onDismiss}
        onRequestDub={onRequestDub}
      />
    );
  }

  const isTranslated = !isOwn && message.translationStatus === "done";
  const translationFailed = !isOwn && message.translationStatus === "failed";
  const displayText =
    isTranslated && message.translatedText
      ? message.translatedText
      : message.originalText;

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={SPRING.card}
      className={cn("flex flex-col gap-1", isOwn ? "items-end" : "items-start")}
    >
      <Bubble
        variant={isOwn ? "default" : "secondary"}
        align={isOwn ? "end" : "start"}
        className={cn(
          "transition-opacity",
          message.clientStatus === "sending" && "opacity-70",
          message.clientStatus === "failed" && "opacity-60",
        )}
      >
        <BubbleContent
          render={isTranslated ? <button type="button" /> : undefined}
          onClick={
            isTranslated ? () => setShowOriginal((value) => !value) : undefined
          }
          aria-expanded={isTranslated ? showOriginal : undefined}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={displayText}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={SPRING.snappy}
              className="block"
            >
              {displayText}
            </motion.span>
          </AnimatePresence>
          {isTranslated && (
            <Languages
              aria-hidden
              className="ml-1.5 inline size-3 align-[-0.125em] opacity-60"
            />
          )}
        </BubbleContent>
      </Bubble>

      <AnimatePresence initial={false}>
        {isTranslating && (
          <motion.span
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={SPRING.card}
            className="flex items-center gap-1.5 px-1 text-[11px]"
          >
            <Languages className="size-3 text-muted-foreground" />
            <ShimmerTextElement>Translating</ShimmerTextElement>
          </motion.span>
        )}
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

      <span className="flex items-center gap-2">
        {translationFailed ? (
          <ButtonElement
            variant="ghost"
            size="sm"
            onClick={() => onRetryTranslation(message.id)}
            className="h-6 gap-1 rounded-lg px-2 text-[11px]"
          >
            <Languages className="size-3" />
            Showing original. Translate again
          </ButtonElement>
        ) : (
          <MessageStatus
            message={message}
            isOwn={isOwn}
            isSeen={isSeen}
            onRetrySend={onRetrySend}
          />
        )}
      </span>
    </motion.div>
  );
};

export default MessageBubble;
