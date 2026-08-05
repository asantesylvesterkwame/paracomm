export interface OtpElementprops {
  slots: number[];
  onChange: (value: string) => void;
  id: string;
  groupClassName?: string;
  slotClassName?: string;
}
