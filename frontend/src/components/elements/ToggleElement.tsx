import * as React from "react";
import { Toggle } from "../ui/toggle";
import TooltipElement from "./TooltipElement";
import { cn } from "@/lib/utils";
import type { ToggleElementProps } from "@/interfaces/components/elements/toggleElement.interface";

const ToggleElement: React.FC<ToggleElementProps> = ({
  pressed,
  onPressedChange,
  label,
  children,
  variant = "surface",
  size = "control",
  disabled,
  className,
}) => {
  return (
    <TooltipElement content={label}>
      <Toggle
        pressed={pressed}
        onPressedChange={onPressedChange}
        disabled={disabled}
        variant={variant}
        size={size}
        aria-label={label}
        className={cn(
          "cursor-pointer transition-transform duration-150 active:scale-95 motion-reduce:active:scale-100",
          className,
        )}
      >
        {children}
      </Toggle>
    </TooltipElement>
  );
};

export default ToggleElement;
