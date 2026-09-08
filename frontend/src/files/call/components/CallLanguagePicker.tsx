import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import ButtonElement from "@/components/elements/ButtonElement";
import BadgeElement from "@/components/elements/BadgeElement";
import PopoverElement from "@/components/elements/PopoverElement";
import ScrollAreaElement from "@/components/elements/ScrollAreaElement";
import { cn } from "@/lib/utils";
import {
  PREFERRED_LANGUAGES,
  languageLabelOf,
} from "@/constants/languages.constants";
import { isDubbingSupportedFor } from "../dubbing/dubbing.utils";
import { CALL_COPY } from "../call.constants";

interface CallLanguagePickerProps {
  myLang: string;
  otherUserLang: string;
  isBusy: boolean;
  onSelect: (lang: string) => void;
}

const CallLanguagePicker = ({
  myLang,
  otherUserLang,
  isBusy,
  onSelect,
}: CallLanguagePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const choose = (code: string) => {
    setIsOpen(false);
    if (code !== myLang) onSelect(code);
  };

  return (
    <PopoverElement
      open={isOpen}
      onOpenChange={setIsOpen}
      title={CALL_COPY.HEAR_IN}
      description={CALL_COPY.HEAR_IN_HINT}
      align="start"
      contentClassName="dark w-64 gap-3 p-3"
      trigger={
        <ButtonElement
          variant="ghost"
          aria-label={CALL_COPY.CHANGE_LANGUAGE}
          className="group -mx-1.5 h-auto gap-1 rounded-lg px-1.5 py-0.5 text-xs font-normal text-muted-foreground hover:bg-foreground/8 hover:text-foreground"
        >
          <span>{languageLabelOf(otherUserLang)}</span>
          <span aria-hidden className="opacity-60">
            to
          </span>
          <span className="font-medium text-foreground">
            {languageLabelOf(myLang)}
          </span>
          <ChevronDown
            aria-hidden
            className={cn(
              "size-3 transition-transform duration-200",
              isOpen && "rotate-180",
            )}
          />
        </ButtonElement>
      }
    >
      <ScrollAreaElement className="h-72 -mx-1">
        <ul
          role="listbox"
          aria-label={CALL_COPY.HEAR_IN}
          className="flex flex-col gap-0.5 px-1"
        >
          {PREFERRED_LANGUAGES.map((language) => {
            const isCurrent = language.code === myLang;
            const hasVoice = isDubbingSupportedFor(language.code);
            return (
              <li key={language.code}>
                <ButtonElement
                  variant="ghost"
                  role="option"
                  aria-selected={isCurrent}
                  disabled={isBusy}
                  onClick={() => choose(language.code)}
                  className={cn(
                    "h-10 w-full justify-between rounded-xl px-3 text-sm font-normal",
                    isCurrent &&
                      "bg-primary/12 text-primary hover:bg-primary/16 hover:text-primary",
                  )}
                >
                  <span>{language.label}</span>
                  <span className="flex items-center gap-2">
                    {!hasVoice && (
                      <BadgeElement
                        variant="outline"
                        animate={false}
                        className="h-5 px-1.5 text-[10px] font-medium text-muted-foreground"
                      >
                        {CALL_COPY.SUBTITLES_ONLY}
                      </BadgeElement>
                    )}
                    {isCurrent && <Check aria-hidden className="size-4" />}
                  </span>
                </ButtonElement>
              </li>
            );
          })}
        </ul>
      </ScrollAreaElement>
    </PopoverElement>
  );
};

export default CallLanguagePicker;
