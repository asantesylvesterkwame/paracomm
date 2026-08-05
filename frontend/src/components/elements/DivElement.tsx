import * as React from "react";
import type { DivElementProps } from "@/interfaces/components/elements/divElement.interface";
import { cn } from "@/lib/utils";

const DivElement: React.FC<DivElementProps> = ({
  children,
  className,
  type,
  hideDiv,
  id,
  ref,
}) => {
  return (
    <div
      id={id}
      ref={ref}
      className={cn(
        `flex flex-col`,
        className,
        type === "container" && "w-full p-5 md:p-0 md:py-5 md:w-[80%] mx-auto",
        type === "inverted" && "bg-primary text-background items-center",
        hideDiv && "hidden"
      )}
    >
      {children}
    </div>
  );
};

export default DivElement;
