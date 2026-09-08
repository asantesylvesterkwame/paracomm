import type { ReactElement, ReactNode } from "react";

export interface PopoverElementProps {
  trigger: ReactElement;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  description?: string;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  contentClassName?: string;
}
