import * as React from "react";
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
} from "@/components/ui/command";
import AvatarElement from "./AvatarElement";
import LoadingElement from "./LoadingElement";
import type { CommandElementProps } from "@/interfaces/components/elements/commandElement.interface";

const CommandElement: React.FC<CommandElementProps> = ({
  open,
  onOpenChange,
  value,
  onValueChange,
  items,
  onSelect,
  placeholder,
  emptyText,
  isLoading = false,
}) => {
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <Command shouldFilter={false}>
        <CommandInput
          placeholder={placeholder}
          value={value}
          onValueChange={onValueChange}
        />
        <CommandList>
        {isLoading && (
          <div className="flex items-center justify-center py-6">
            <LoadingElement />
          </div>
        )}
        {!isLoading && items.length === 0 && (
          <CommandEmpty>{emptyText}</CommandEmpty>
        )}
        {!isLoading &&
          items.map((item) => (
            <CommandItem
              key={item.id}
              value={item.id}
              onSelect={() => onSelect(item.id)}
              className="gap-3"
            >
              <AvatarElement
                src={item.avatarUrl}
                name={item.avatarName ?? item.label}
                size="sm"
              />
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-medium">{item.label}</span>
                {item.description && (
                  <span className="truncate text-xs text-muted-foreground">
                    {item.description}
                  </span>
                )}
              </span>
            </CommandItem>
          ))}
        </CommandList>
      </Command>
    </CommandDialog>
  );
};

export default CommandElement;
