export interface CommandElementItem {
  id: string;
  label: string;
  description?: string;
  avatarUrl?: string | null;
  avatarName?: string | null;
}

export interface CommandElementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onValueChange: (value: string) => void;
  items: CommandElementItem[];
  onSelect: (id: string) => void;
  placeholder: string;
  emptyText: string;
  isLoading?: boolean;
}
