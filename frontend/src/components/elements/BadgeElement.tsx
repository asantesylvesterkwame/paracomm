import * as React from "react";
import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SPRING } from "@/lib/motion";

export * from "@/components/ui/badge";

interface BadgeElementProps {
  children: React.ReactNode;
  variant?: "default" | "secondary" | "outline" | "destructive";
  icon?: LucideIcon;
  className?: string;
  animate?: boolean;
}

const BadgeElement: React.FC<BadgeElementProps> = ({
  children,
  variant = "default",
  icon: Icon,
  className,
  animate = true,
}) => {
  const content = (
    <>
      {Icon && <Icon className="shrink-0" strokeWidth={2.4} />}
      {children}
    </>
  );

  if (!animate) {
    return (
      <Badge variant={variant} className={cn(className)}>
        {content}
      </Badge>
    );
  }

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={SPRING.snappy}
      className="inline-flex"
    >
      <Badge variant={variant} className={cn(className)}>
        {content}
      </Badge>
    </motion.span>
  );
};

export default BadgeElement;
