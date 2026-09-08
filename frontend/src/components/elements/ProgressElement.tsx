import * as React from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export * from "@/components/ui/progress";

interface ProgressElementProps {
  value: number;
  className?: string;
  indicatorClassName?: string;
  trackClassName?: string;
  label?: string;
}

const ProgressElement: React.FC<ProgressElementProps> = ({
  value,
  className,
  indicatorClassName,
  trackClassName,
  label,
}) => (
  <Progress
    value={value}
    aria-label={label}
    className={cn(className)}
    indicatorClassName={indicatorClassName}
    trackClassName={trackClassName}
  />
);

export default ProgressElement;
