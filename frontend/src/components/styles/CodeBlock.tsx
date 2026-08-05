import * as React from "react";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import DivElement from "@/components/elements/DivElement";
import ButtonElement from "@/components/elements/ButtonElement";
import { cn } from "@/lib/utils";
import { notify } from "@/utils";

type CodeBlockProps = {
  code: string;
  label?: string;
  className?: string;
};

const CodeBlock: React.FC<CodeBlockProps> = ({ code, label, className }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      notify({
        type: "success",
        message: label ? `Copied ${label}` : "Copied snippet",
      });
      setTimeout(() => setCopied(false), 1600);
    } catch {
      notify({ type: "error", message: "Clipboard unavailable" });
    }
  };

  return (
    <DivElement
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/60 bg-card/60",
        className
      )}
    >
      <ButtonElement
        variant="ghost"
        type="button"
        className="!absolute !right-2 !top-2 !z-10 !size-8 !rounded-full !p-0"
        onClick={handleCopy}
      >
        {copied ? (
          <Check className="size-3.5 text-primary" />
        ) : (
          <Copy className="size-3.5" />
        )}
      </ButtonElement>
      <pre className="overflow-x-auto px-4 py-3 pr-10 text-[12px] leading-relaxed text-foreground">
        <code>{code}</code>
      </pre>
    </DivElement>
  );
};

export default CodeBlock;
