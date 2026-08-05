import { ArrowLeftRight } from "lucide-react";
import SelectElement from "@/components/elements/SelectElement";
import ButtonElement from "@/components/elements/ButtonElement";
import { INPUT_LANGUAGES, OUTPUT_LANGUAGES } from "../live.constants";

interface LanguagePickerProps {
  inputLang: string;
  outputLang: string;
  onInputChange: (value: string) => void;
  onOutputChange: (value: string) => void;
  disabled?: boolean;
}

const LanguagePicker = ({
  inputLang,
  outputLang,
  onInputChange,
  onOutputChange,
  disabled,
}: LanguagePickerProps) => {
  const swap = () => {
    const matchingInput = INPUT_LANGUAGES.find((option) =>
      option.code.toLowerCase().startsWith(outputLang.toLowerCase()),
    );
    const matchingOutput = OUTPUT_LANGUAGES.find(
      (option) => option.code === inputLang.split("-")[0].toLowerCase(),
    );
    if (!matchingInput || !matchingOutput) return;
    onInputChange(matchingInput.code);
    onOutputChange(matchingOutput.code);
  };

  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-2 sm:flex-row sm:gap-3">
      <SelectElement
        label="Speak in"
        placeholder="Speak in"
        items={INPUT_LANGUAGES.map((option) => ({
          value: option.code,
          label: option.label,
        }))}
        value={inputLang}
        onValueChange={onInputChange}
        disabled={disabled}
        className="h-11 rounded-xl"
      />
      <ButtonElement
        variant="ghost"
        size="icon"
        onClick={swap}
        disabled={disabled}
        className="shrink-0 rounded-full"
        aria-label="Swap languages"
      >
        <ArrowLeftRight className="size-4" />
      </ButtonElement>
      <SelectElement
        label="Translate to"
        placeholder="Translate to"
        items={OUTPUT_LANGUAGES.map((option) => ({
          value: option.code,
          label: option.label,
        }))}
        value={outputLang}
        onValueChange={onOutputChange}
        disabled={disabled}
        className="h-11 rounded-xl"
      />
    </div>
  );
};

export default LanguagePicker;
