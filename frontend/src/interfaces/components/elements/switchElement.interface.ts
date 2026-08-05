import type { ReactNode } from "react";

export interface SwitchElementProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  size?: "sm" | "default";
  className?: string;
}
