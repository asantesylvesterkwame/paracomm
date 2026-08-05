import * as React from "react";
import DivElement from "@/components/elements/DivElement";
import type { RadiusToken } from "@/constants/styleGuide";
import { cn } from "@/lib/utils";

type RadiusSwatchProps = {
  token: RadiusToken;
};

const RadiusSwatch: React.FC<RadiusSwatchProps> = ({ token }) => {
  return (
    <DivElement className="items-center gap-3">
      <div
        className={cn(
          "size-20 border border-border/60 bg-gradient-to-br from-primary/15 to-primary/5",
          token.utility
        )}
      />
      <DivElement className="items-center gap-1">
        <code className="text-[12px] font-medium text-foreground">
          {token.utility}
        </code>
        <span className="text-[10px] text-muted-foreground text-center">
          {token.value}
        </span>
      </DivElement>
    </DivElement>
  );
};

export default RadiusSwatch;
