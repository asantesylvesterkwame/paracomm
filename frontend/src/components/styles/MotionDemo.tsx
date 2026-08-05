import * as React from "react";
import { useState } from "react";
import { motion } from "motion/react";
import DivElement from "@/components/elements/DivElement";
import ButtonElement from "@/components/elements/ButtonElement";
import { RotateCw } from "lucide-react";
import type { MotionPreset } from "@/constants/styleGuide";

type MotionDemoProps = {
  preset: MotionPreset;
};

const transitionFor = (preset: MotionPreset) => {
  if (preset.name === "Landing ease") {
    return {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    };
  }
  const map: Record<string, number> = {
    "Card entry": 24,
    "Panel content": 22,
    "Gradient card": 20,
  };
  return { type: "spring" as const, stiffness: 260, damping: map[preset.name] };
};

const MotionDemo: React.FC<MotionDemoProps> = ({ preset }) => {
  const [key, setKey] = useState(0);

  return (
    <DivElement className="gap-4 rounded-2xl border border-border/60 bg-card p-5">
      <DivElement className="flex-row items-start justify-between gap-3">
        <DivElement className="gap-1">
          <span className="text-sm font-semibold text-foreground">
            {preset.name}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {preset.usage}
          </span>
        </DivElement>
        <ButtonElement
          variant="ghost"
          type="button"
          className="!size-8 !rounded-full !p-0"
          onClick={() => setKey((k) => k + 1)}
        >
          <RotateCw className="size-3.5" />
        </ButtonElement>
      </DivElement>
      <DivElement className="relative h-20 items-center justify-center rounded-xl bg-secondary/40">
        <motion.div
          key={key}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={transitionFor(preset)}
          className="size-12 rounded-2xl bg-[linear-gradient(45deg,#5138ec,#b561f9)]"
        />
      </DivElement>
      <code className="text-[10px] text-muted-foreground/80 leading-relaxed">
        {preset.transition}
      </code>
    </DivElement>
  );
};

export default MotionDemo;
