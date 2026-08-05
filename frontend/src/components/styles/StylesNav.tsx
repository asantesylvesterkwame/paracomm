import * as React from "react";
import DivElement from "@/components/elements/DivElement";
import { cn } from "@/lib/utils";

type NavItem = { id: string; label: string };

type StylesNavProps = {
  items: NavItem[];
  active: string;
};

const StylesNav: React.FC<StylesNavProps> = ({ items, active }) => {
  return (
    <DivElement className="sticky top-24 hidden h-fit w-56 shrink-0 gap-1 lg:flex">
      <span className="text-eyebrow mb-2 px-3">On this page</span>
      <nav className="flex flex-col">
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={cn(
              "rounded-xl px-3 py-2 text-sm transition-colors",
              active === item.id
                ? "bg-secondary text-foreground font-medium"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
            )}
          >
            {item.label}
          </a>
        ))}
      </nav>
    </DivElement>
  );
};

export default StylesNav;
