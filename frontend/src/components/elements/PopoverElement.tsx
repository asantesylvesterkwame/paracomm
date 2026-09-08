import * as React from "react";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { PopoverElementProps } from "@/interfaces/components/elements/popoverElement.interface";

const PopoverElement: React.FC<PopoverElementProps> = ({
  trigger,
  children,
  open,
  onOpenChange,
  title,
  description,
  side = "bottom",
  align = "start",
  contentClassName,
}) => {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger render={trigger} />
      <PopoverContent side={side} align={align} className={cn(contentClassName)}>
        {(title || description) && (
          <PopoverHeader>
            {title && <PopoverTitle>{title}</PopoverTitle>}
            {description && (
              <PopoverDescription>{description}</PopoverDescription>
            )}
          </PopoverHeader>
        )}
        {children}
      </PopoverContent>
    </Popover>
  );
};

export default PopoverElement;
