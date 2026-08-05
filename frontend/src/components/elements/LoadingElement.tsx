import * as React from "react";
import { Spinner } from "@/components/ui/spinner";
import type { LoadingElementProps } from "@/interfaces/components/elements/loadingElement.interface";
import { cn } from "@/lib/utils";

const LoadingElement: React.FC<LoadingElementProps> = ({ className }) => {
  return <Spinner className={cn("size-6 text-primary", className)} />;
};

export default LoadingElement;
