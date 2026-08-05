import type * as React from "react";

export interface ButtonElementProps
  extends React.ComponentPropsWithoutRef<"button"> {
  variant?:
    | "link"
    | "destructive"
    | "default"
    | "outline"
    | "secondary"
    | "ghost"
    | null
    | undefined;
  size?: "icon" | "default" | "sm" | "lg";
  isLoading?: boolean;
}
