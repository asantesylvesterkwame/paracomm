import * as React from "react";
import { motion } from "motion/react";
import { Switch } from "../ui/switch";
import { cn } from "@/lib/utils";
import { TAP } from "@/lib/motion";
import type { SwitchElementProps } from "@/interfaces/components/elements/switchElement.interface";

const SwitchElement: React.FC<SwitchElementProps> = ({
  checked,
  onCheckedChange,
  label,
  description,
  disabled,
  size = "default",
  className,
}) => {
  if (!label && !description) {
    return (
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        size={size}
        className={className}
      />
    );
  }

  return (
    <motion.div
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled}
      whileTap={disabled ? undefined : TAP}
      onClick={() => !disabled && onCheckedChange(!checked)}
      className={cn(
        "flex cursor-pointer flex-row items-center gap-3 rounded-2xl border px-3.5 py-2.5 transition-colors",
        checked
          ? "border-primary/40 bg-primary/5"
          : "border-transparent hover:bg-secondary/60",
        disabled && "cursor-not-allowed opacity-60",
        className
      )}
    >
      <div className="flex min-w-0 flex-col">
        {label && (
          <span className="text-sm font-medium text-foreground">{label}</span>
        )}
        {description && (
          <span className="text-xs text-muted-foreground">{description}</span>
        )}
      </div>
      <Switch
        checked={checked}
        disabled={disabled}
        size={size}
        className="pointer-events-none ms-auto shrink-0"
      />
    </motion.div>
  );
};

export default SwitchElement;
