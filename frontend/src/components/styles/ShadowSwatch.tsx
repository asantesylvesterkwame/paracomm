import * as React from "react";
import DivElement from "@/components/elements/DivElement";
import { cn } from "@/lib/utils";

type ShadowSwatchProps = {
  name: string;
  usage: string;
  classLight: string;
  classDark: string;
  shadowClass?: string;
};

const ShadowSwatch: React.FC<ShadowSwatchProps> = ({
  name,
  usage,
  classLight,
  classDark,
  shadowClass,
}) => {
  return (
    <DivElement className="gap-3">
      <div
        className={cn(
          "h-24 rounded-2xl border border-border/60 bg-card",
          shadowClass
        )}
      />
      <DivElement className="gap-1">
        <span className="text-sm font-semibold text-foreground">{name}</span>
        <span className="text-[11px] text-muted-foreground">{usage}</span>
        <code className="text-[10px] text-muted-foreground/80 break-all leading-relaxed">
          light: {classLight}
        </code>
        <code className="text-[10px] text-muted-foreground/80 break-all leading-relaxed">
          dark: {classDark}
        </code>
      </DivElement>
    </DivElement>
  );
};

export default ShadowSwatch;
