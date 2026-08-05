import * as React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const LabelElement: React.FC<React.ComponentPropsWithoutRef<typeof Label>> = ({
  className,
  ...rest
}) => {
  return <Label className={cn(className)} {...rest} />;
};

export default LabelElement;
