import * as React from "react";
import DivElement from "@/components/elements/DivElement";
import type { Gradient } from "@/constants/styleGuide";
import { cn } from "@/lib/utils";

type GradientSwatchProps = {
  gradient: Gradient;
};

const GradientSwatch: React.FC<GradientSwatchProps> = ({ gradient }) => {
  return (
    <DivElement className="gap-3">
      <div
        className={cn(
          "h-28 rounded-2xl",
          gradient.swatchClass,
          gradient.shadowClass
        )}
      />
      <DivElement className="gap-1">
        <span className="text-sm font-semibold capitalize text-foreground">
          {gradient.name}
        </span>
        <span className="text-[11px] text-muted-foreground">
          {gradient.hexStops}
        </span>
        <code className="text-[11px] text-muted-foreground/70 break-all">
          {gradient.value}
        </code>
      </DivElement>
    </DivElement>
  );
};

export default GradientSwatch;
