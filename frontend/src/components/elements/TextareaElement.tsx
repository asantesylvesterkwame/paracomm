import * as React from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const TextareaElement = ({
  className,
  ...rest
}: React.ComponentProps<"textarea">) => {
  return <Textarea className={cn(className)} {...rest} />;
};

export default TextareaElement;
