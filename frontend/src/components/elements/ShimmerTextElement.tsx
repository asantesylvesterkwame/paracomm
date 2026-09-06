import { cn } from "@/lib/utils";
import type { ShimmerTextElementProps } from "@/interfaces/components/elements/shimmerTextElement.interface";

const ShimmerTextElement = ({
  children,
  className,
}: ShimmerTextElementProps) => {
  return (
    <span
      className={cn(
        "animate-shimmer bg-[linear-gradient(100deg,var(--muted-foreground)_25%,var(--foreground)_50%,var(--muted-foreground)_75%)] bg-[length:200%_100%] bg-clip-text text-transparent",
        className,
      )}
    >
      {children}
    </span>
  );
};

export default ShimmerTextElement;
