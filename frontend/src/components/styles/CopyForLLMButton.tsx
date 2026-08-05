import * as React from "react";
import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import ButtonElement from "@/components/elements/ButtonElement";
import { STYLE_GUIDE_MARKDOWN } from "@/constants/styleGuide";
import { notify } from "@/utils";

const CopyForLLMButton: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(STYLE_GUIDE_MARKDOWN);
      setCopied(true);
      notify({
        type: "success",
        message: "Copied design system spec for LLMs",
        description: `${STYLE_GUIDE_MARKDOWN.length.toLocaleString()} characters ready to paste`,
      });
      setTimeout(() => setCopied(false), 2200);
    } catch {
      notify({ type: "error", message: "Clipboard unavailable in this context" });
    }
  };

  return (
    <ButtonElement
      variant="default"
      type="button"
      onClick={handleCopy}
      className="!h-10 !rounded-full !px-4 !text-[13px] !font-medium !shadow-[0_8px_20px_-10px_rgba(0,100,255,0.55)] hover:!shadow-[0_10px_24px_-10px_rgba(0,100,255,0.7)]"
    >
      {copied ? (
        <>
          <Check className="size-4" />
          Copied
        </>
      ) : (
        <>
          <Sparkles className="size-4" />
          Copy for LLMs
        </>
      )}
    </ButtonElement>
  );
};

export default CopyForLLMButton;
