import * as React from "react";
import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import ButtonElement from "@/components/elements/ButtonElement";
import { fadeScale, SPRING } from "@/lib/motion";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <motion.div
      variants={fadeScale}
      initial="hidden"
      animate="show"
      transition={SPRING.panel}
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border/70 bg-secondary/30 px-6 py-14 text-center",
        className
      )}
    >
      <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="size-6" strokeWidth={2} />
      </span>
      <h3 className="text-headline text-lg">{title}</h3>
      {description && (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {actionLabel && onAction && (
        <ButtonElement
          onClick={onAction}
          className="mt-1 h-10 rounded-xl px-5 shadow-[0_8px_20px_-10px_rgba(0,100,255,0.55)]"
        >
          {actionLabel}
        </ButtonElement>
      )}
    </motion.div>
  );
};

export default EmptyState;
