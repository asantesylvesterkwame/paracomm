import type {
  ChangeEventHandler,
  HTMLAttributes,
  HTMLInputTypeAttribute,
  MouseEventHandler,
  ReactNode,
} from "react";
import type { ButtonElementProps } from "./buttonElement.interface";

export interface InputElementProps {
  placeholder?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  className?: string;
  inputClassName?: string;
  isButtoned?: boolean;
  buttonContent?: ReactNode;
  buttonType?: ButtonElementProps["variant"];
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  id?: string;
  type?: HTMLInputTypeAttribute;
  required?: boolean;
  value?: string;
  autoComplete?: string;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
}
