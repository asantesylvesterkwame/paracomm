import { SendHorizontal } from "lucide-react";
import TextareaElement from "@/components/elements/TextareaElement";
import ButtonElement from "@/components/elements/ButtonElement";
import { MAX_MESSAGE_CHARS } from "../message.constants";
import type { KeyboardEvent } from "react";

interface MessageComposerProps {
  draft: string;
  setDraft: (value: string) => void;
  onSend: () => void;
  onTyping: () => void;
  onStopTyping: () => void;
  isSending: boolean;
}

const MessageComposer = ({
  draft,
  setDraft,
  onSend,
  onTyping,
  onStopTyping,
  isSending,
}: MessageComposerProps) => {
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  };

  return (
    <div className="flex items-end gap-2 border-t border-border/60 bg-background/95 p-3">
      <TextareaElement
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
        className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl"
      />
      <ButtonElement
        onClick={onSend}
        disabled={!draft.trim() || isSending}
        isLoading={isSending}
        size="icon"
        aria-label="Send message"
        className="size-11 shrink-0 rounded-2xl"
      >
        <SendHorizontal className="size-5" />
      </ButtonElement>
    </div>
  );
};

export default MessageComposer;
