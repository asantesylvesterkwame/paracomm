import * as React from "react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { TooltipElementProps } from "@/interfaces/components/elements/tooltipElement.interface";

const TooltipElement: React.FC<TooltipElementProps> = ({
  content,
  children,
  side = "top",
  className,
}) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger render={<span className="inline-flex" />}>
          {children}
        </TooltipTrigger>
        <TooltipContent side={side} className={cn(className)}>
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default TooltipElement;
