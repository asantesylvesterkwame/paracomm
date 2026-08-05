import type { ReactNode } from "react";

export interface SheetElementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  side?: "top" | "right" | "bottom" | "left";
  children: ReactNode;
  className?: string;
}
