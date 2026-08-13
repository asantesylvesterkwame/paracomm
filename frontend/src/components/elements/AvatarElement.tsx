import * as React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { AvatarElementProps } from "@/interfaces/components/elements/avatarElement.interface";

const sizeClasses = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-12 text-base",
} as const;

const initialsOf = (name?: string | null) =>
  (name ?? "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

const AvatarElement: React.FC<AvatarElementProps> = ({
  src,
  name,
  size = "md",
  className,
}) => {
  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {src && <AvatarImage src={src} alt={name ?? "User avatar"} />}
      <AvatarFallback className="bg-primary/10 font-medium text-primary">
        {initialsOf(name)}
      </AvatarFallback>
    </Avatar>
  );
};

export default AvatarElement;
