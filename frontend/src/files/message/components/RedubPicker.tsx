import { useState } from "react";
import { Check, Languages, RotateCw } from "lucide-react";
import BadgeElement from "@/components/elements/BadgeElement";
import ButtonElement from "@/components/elements/ButtonElement";
import LoadingElement from "@/components/elements/LoadingElement";
import PopoverElement from "@/components/elements/PopoverElement";
import ScrollAreaElement from "@/components/elements/ScrollAreaElement";
import TooltipElement from "@/components/elements/TooltipElement";
import { cn } from "@/lib/utils";
import {
  PREFERRED_LANGUAGES,
  isVoiceSupportedFor,
} from "@/constants/languages.constants";
import { VOICE_COPY } from "../voice-note/voice-note.constants";
import { dubFor, isOriginalInLang } from "../voice-note/voice-note.utils";
import type {
  IDubRequestTarget,
  IVoiceNote,
} from "../voice-note/voice-note.interface";

interface RedubPickerProps {
  voiceNote: IVoiceNote;
  messageId: string;
  activeLang: string | null;
  requestingDubFor: IDubRequestTarget | null;
  onChoose: (lang: string | null) => void;
  onRequestDub: (lang: string) => void;
}

const RedubPicker = ({
  voiceNote,
  messageId,
  activeLang,
  requestingDubFor,
  onChoose,
  onRequestDub,
}: RedubPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <PopoverElement
      open={isOpen}
      onOpenChange={setIsOpen}
      title={VOICE_COPY.HEAR_IN}
      description={VOICE_COPY.HEAR_IN_HINT}
      align="start"
      contentClassName="w-64 gap-3 p-3"
      trigger={
        <ButtonElement
          variant="ghost"
          size="icon"
          aria-label={VOICE_COPY.HEAR_IN}
          className="size-6 rounded-full text-muted-foreground ring-1 ring-inset ring-border hover:text-foreground"
        >
          <Languages className="size-3" />
        </ButtonElement>
      }
    >
      <ScrollAreaElement className="h-64 -mx-1">
        <ul
          role="listbox"
          aria-label={VOICE_COPY.HEAR_IN}
          className="flex flex-col gap-0.5 px-1"
        >
          {PREFERRED_LANGUAGES.map((language) => {
            const dub = dubFor(voiceNote, language.code);
            const isOriginal = isOriginalInLang(voiceNote, language.code);
            const isActive =
              activeLang === language.code || (isOriginal && activeLang === null);
            const isRequesting =
              requestingDubFor?.messageId === messageId &&
              requestingDubFor.lang === language.code;
            const isPending = dub?.status === "pending" || isRequesting;
            const hasVoice = isVoiceSupportedFor(language.code);
            const isSelectable = !isPending && (hasVoice || isOriginal);

            const choose = () => {
              setIsOpen(false);
              if (isOriginal) {
                onChoose(null);
                return;
              }
              if (dub?.status === "done") {
                onChoose(language.code);
                return;
              }
              onRequestDub(language.code);
            };

            const trailing = isPending ? (
              <LoadingElement className="size-3.5" />
            ) : isOriginal ? (
              <span className="text-[11px] text-muted-foreground">
                {VOICE_COPY.ORIGINAL}
              </span>
            ) : dub?.status === "done" ? (
              <Check aria-hidden className="size-4" />
            ) : dub?.status === "failed" ? (
              <RotateCw aria-hidden className="size-3.5 text-destructive" />
            ) : !hasVoice ? (
              <TooltipElement content={VOICE_COPY.DUB_UNSUPPORTED}>
                <BadgeElement
                  variant="outline"
                  animate={false}
                  className="h-5 px-1.5 text-[10px] font-medium text-muted-foreground"
                >
                  {VOICE_COPY.NO_VOICE}
                </BadgeElement>
              </TooltipElement>
            ) : null;

            return (
              <li key={language.code}>
                <ButtonElement
                  variant="ghost"
                  role="option"
                  aria-selected={isActive}
                  disabled={!isSelectable}
                  onClick={choose}
                  className={cn(
                    "h-10 w-full justify-between rounded-xl px-3 text-sm font-normal",
                    isActive &&
                      "bg-primary/12 text-primary hover:bg-primary/16 hover:text-primary",
                  )}
                >
                  <span>{language.label}</span>
                  <span className="flex items-center gap-2">{trailing}</span>
                </ButtonElement>
              </li>
            );
          })}
        </ul>
      </ScrollAreaElement>
    </PopoverElement>
  );
};

export default RedubPicker;
