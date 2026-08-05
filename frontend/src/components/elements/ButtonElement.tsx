import * as React from "react";
import { Button } from "../ui/button";
import type { ButtonElementProps } from "@/interfaces/components/elements/buttonElement.interface";
import { cn } from "@/lib/utils";
import LoadingElement from "./LoadingElement";

const ButtonElement: React.FC<ButtonElementProps> = ({
  children,
  variant,
  className,
  onClick,
  disabled,
  size,
  type,
  isLoading,
  ...rest
}) => {
  return (
    <Button
      disabled={disabled}
      onClick={onClick}
      className={cn("cursor-pointer font-medium", className)}
      variant={variant}
      size={size}
      type={type}
      {...rest}
    >
      {disabled && isLoading ? <LoadingElement /> : children}
    </Button>
  );
};

export default ButtonElement;
