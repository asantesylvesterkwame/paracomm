import { useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { SendHorizontal } from "lucide-react";
import TextareaElement from "@/components/elements/TextareaElement";
import ButtonElement from "@/components/elements/ButtonElement";
import { SPRING, TAP } from "@/lib/motion";
import { MAX_MESSAGE_CHARS } from "../message.constants";
import type { KeyboardEvent } from "react";

interface MessageComposerProps {
  draft: string;
  setDraft: (value: string) => void;
  onSend: () => void;
  onTyping: () => void;
  onStopTyping: () => void;
}

const COUNTER_THRESHOLD = 120;

const MessageComposer = ({
  draft,
  setDraft,
  onSend,
  onTyping,
  onStopTyping,
}: MessageComposerProps) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const remaining = MAX_MESSAGE_CHARS - draft.length;
  const canSend = Boolean(draft.trim());

  const submit = () => {
    if (!canSend) return;
    onSend();
    inputRef.current?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <div className="flex flex-col gap-1 border-t border-border/60 bg-background/95 p-3">
      <div className="flex items-end gap-2">
        <TextareaElement
          ref={inputRef}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            onTyping();
          }}
          onBlur={onStopTyping}
          onKeyDown={handleKeyDown}
          placeholder="Write a message in your language"
          maxLength={MAX_MESSAGE_CHARS}
          rows={1}
          aria-label="Message"
          className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl field-sizing-content"
        />
        <motion.div whileTap={canSend ? TAP : undefined} transition={SPRING.press}>
          <ButtonElement
            onClick={submit}
            disabled={!canSend}
            size="icon"
            aria-label="Send message"
            className="size-11 shrink-0 rounded-2xl"
          >
            <SendHorizontal className="size-5" />
          </ButtonElement>
        </motion.div>
      </div>
      <AnimatePresence>
        {remaining <= COUNTER_THRESHOLD && (
          <motion.span
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={SPRING.card}
            className="self-end pr-1 text-[11px] text-muted-foreground"
          >
            {remaining} characters left
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MessageComposer;
