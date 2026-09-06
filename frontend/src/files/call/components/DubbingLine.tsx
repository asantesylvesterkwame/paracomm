import { motion } from "motion/react";
import { SPRING } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { IDubbingLine } from "../dubbing/dubbing.interface";

interface DubbingLineProps {
  line: IDubbingLine;
  targetLang: string;
}

const DubbingLine = ({ line, targetLang }: DubbingLineProps) => (
  <motion.li
    layout="position"
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    transition={SPRING.card}
    className={cn(
      "flex gap-3 border-s-2 ps-3",
      line.isFinal ? "border-primary" : "border-primary/50",
    )}
  >
    <span
      aria-hidden
      className="mt-1 shrink-0 text-[10px] font-semibold tracking-[0.14em] text-primary uppercase tabular-nums"
    >
      {targetLang.slice(0, 2)}
    </span>

    <span className="flex min-w-0 flex-col gap-0.5">
      <span className="max-w-[36ch] text-[clamp(1.125rem,2.2vw,1.75rem)] leading-tight font-medium tracking-tight text-balance text-foreground">
        {line.translation || line.original}
      </span>
      {Boolean(line.translation) && Boolean(line.original) && (
        <span className="text-[13px] leading-snug text-muted-foreground">
          {line.original}
        </span>
      )}
    </span>
  </motion.li>
);

export default DubbingLine;
