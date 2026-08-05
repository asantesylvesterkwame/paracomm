import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";
import { cn } from "@/lib/utils";
import type { SheetElementProps } from "@/interfaces/components/elements/sheetElement.interface";

const SheetElement: React.FC<SheetElementProps> = ({
  open,
  onOpenChange,
  title,
  description,
  side = "right",
  children,
  className,
}) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        className={cn("w-[86%] gap-0 sm:max-w-sm", className)}
      >
        <SheetHeader className="border-b border-border/60">
          <SheetTitle className="text-headline text-lg">{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </SheetContent>
    </Sheet>
  );
};

export default SheetElement;
