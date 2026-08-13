import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { ScrollAreaElementProps } from "@/interfaces/components/elements/scrollAreaElement.interface";

const ScrollAreaElement: React.FC<ScrollAreaElementProps> = ({
  children,
  className,
}) => {
  return <ScrollArea className={cn(className)}>{children}</ScrollArea>;
};

export default ScrollAreaElement;
