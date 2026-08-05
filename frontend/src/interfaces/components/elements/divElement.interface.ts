import type * as React from "react";

export interface DivElementProps {
  id?: string;
  ref?: React.Ref<HTMLDivElement>;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  height?: string | number;
  backgroundColor?: string;
  scrollView?: boolean;
  touchableOpacity?: boolean;
  paddingBottom?: boolean;
  draggable?: boolean;
  onDragStart?: (event: React.DragEvent) => void;
  onDragOver?: (event: React.DragEvent) => void;
  onDrop?: (event: React.DragEvent) => void;
  onClick?: (event: React.MouseEvent) => void;
  animated?: boolean;
  delay?: number;
  autoSequence?: boolean;
  sequenceIndex?: number;
  className?: string;
  type?: "container" | "regular" | "inverted";
  hideDiv?: boolean;
}
