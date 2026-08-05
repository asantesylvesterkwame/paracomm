import * as React from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import type {
  SelectElementProps,
  SelectItemOption,
} from "@/interfaces/components/elements/selectElement.interface";
import { cn } from "@/lib/utils";

const normalizeItems = (items: string[] | SelectItemOption[]): SelectItemOption[] =>
  items.map((item) =>
    typeof item === "string" ? { value: item, label: item } : item,
  );

const SelectElement: React.FC<SelectElementProps> = ({
  placeholder,
  label,
  items,
  className,
  onValueChange,
  value,
  disabled,
}) => {
  const normalized = normalizeItems(items);
  const selected = normalized.find((item) => item.value === value);
  return (
    <Select
      value={value}
      disabled={disabled}
      onValueChange={(next) => {
        if (next !== null) onValueChange(next);
      }}
    >
      <SelectTrigger className={cn("w-full", className)}>
        <SelectValue placeholder={placeholder}>{selected?.label}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>{label}</SelectLabel>
          {normalized.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

export default SelectElement;
