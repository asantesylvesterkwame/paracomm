export interface SelectItemOption {
  value: string;
  label: string;
}

export interface SelectElementProps {
  placeholder: string;
  label: string;
  items: string[] | SelectItemOption[];
  className?: string;
  onValueChange: (value: string) => void;
  value?: string;
  disabled?: boolean;
}
