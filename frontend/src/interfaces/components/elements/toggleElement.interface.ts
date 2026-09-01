import type { ReactNode } from "react";

export interface ToggleElementProps {
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
  label: string;
  children: ReactNode;
  variant?: "default" | "outline" | "surface" | "danger";
  size?: "default" | "sm" | "lg" | "control";
  disabled?: boolean;
  className?: string;
}
