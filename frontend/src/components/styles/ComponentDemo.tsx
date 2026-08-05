import * as React from "react";
import DivElement from "@/components/elements/DivElement";
import CodeBlock from "./CodeBlock";
import { cn } from "@/lib/utils";

type ComponentDemoProps = {
  name: string;
  description?: string;
  code?: string;
  children: React.ReactNode;
  className?: string;
  previewClassName?: string;
};

const ComponentDemo: React.FC<ComponentDemoProps> = ({
  name,
  description,
  code,
  children,
  className,
  previewClassName,
}) => {
  return (
    <DivElement
      className={cn(
        "overflow-hidden rounded-2xl border border-border/60 bg-card",
        className
      )}
    >
      <DivElement className="gap-1 border-b border-border/60 px-5 py-4">
        <span className="text-sm font-semibold text-foreground">{name}</span>
        {description && (
          <span className="text-[12px] text-muted-foreground leading-relaxed">
            {description}
          </span>
        )}
      </DivElement>
      <DivElement
        className={cn(
          "items-center justify-center gap-4 bg-secondary/30 p-8",
          previewClassName
        )}
      >
        {children}
      </DivElement>
      {code && (
        <DivElement className="border-t border-border/60 bg-background/40">
          <CodeBlock
            code={code}
            label={name}
            className="!border-0 !rounded-none"
          />
        </DivElement>
      )}
    </DivElement>
  );
};

export default ComponentDemo;
