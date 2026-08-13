import type { ReactNode } from "react";

export interface TooltipElementProps {
  content: ReactNode;
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
}
