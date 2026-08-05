import * as React from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const TextareaElement: React.FC<React.ComponentPropsWithoutRef<"textarea">> = ({
  className,
  ...rest
}) => {
  return <Textarea className={cn(className)} {...rest} />;
};

export default TextareaElement;
