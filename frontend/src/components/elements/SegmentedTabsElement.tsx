import * as React from "react";
import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { SPRING } from "@/lib/motion";

export interface SegmentedTab {
  value: string;
  label: string;
  icon?: LucideIcon;
}

interface SegmentedTabsElementProps {
  tabs: SegmentedTab[];
  value: string;
  onChange: (value: string) => void;
  layoutId?: string;
  className?: string;
  stretch?: boolean;
  compact?: boolean;
  labelMode?: "responsive" | "always";
}

const SegmentedTabsElement: React.FC<SegmentedTabsElementProps> = ({
  tabs,
  value,
  onChange,
  layoutId = "segmented-indicator",
  className,
  stretch = false,
  compact = false,
  labelMode = "responsive",
}) => {
  return (
    <div
      className={cn(
        "flex flex-row items-center gap-1 rounded-full border border-border/60 bg-secondary/60 p-1 backdrop-blur-xl",
        stretch && "w-full",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.value === value;
        const Icon = tab.icon;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={cn(
              "relative flex cursor-pointer flex-row items-center gap-2 rounded-full font-medium whitespace-nowrap transition-colors",
              compact ? "gap-1 px-2.5 py-1.5 text-xs" : "px-4 py-2 text-sm",
              stretch &&
                (compact
                  ? "flex-1 justify-center px-1.5"
                  : "flex-1 justify-center px-2 sm:px-4"),
              isActive
                ? "text-primary-foreground"
                : "text-foreground/60 hover:text-foreground"
            )}
          >
            {isActive && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-full bg-primary shadow-[0_8px_20px_-10px_rgba(0,100,255,0.55)]"
                transition={SPRING.card}
              />
            )}
            {Icon && (
              <Icon
                className={cn(
                  "relative z-10 size-4 shrink-0",
                  labelMode === "always" && "hidden sm:inline"
                )}
                strokeWidth={2.2}
              />
            )}
            <span
              className={cn(
                "relative z-10",
                labelMode === "always"
                  ? cn("inline", compact ? "text-xs" : "text-xs sm:text-sm")
                  : "hidden sm:inline"
              )}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default SegmentedTabsElement;
