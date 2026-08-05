import * as React from "react";
import { Input } from "../ui/input";
import type { InputElementProps } from "@/interfaces/components/elements/inputElement.interface";
import { cn } from "@/lib/utils";
import DivElement from "./DivElement";
import ButtonElement from "./ButtonElement";

const InputElement: React.FC<InputElementProps> = ({
  placeholder,
  onChange,
  className,
  inputClassName,
  isButtoned,
  buttonType,
  buttonContent,
  onClick,
  disabled,
  id,
  type,
  required,
  value,
  autoComplete,
  inputMode,
}) => {
  return (
    <DivElement
      className={cn("flex-row w-full items-center space-x-2", className)}
    >
      <Input
        id={id}
        type={type}
        disabled={disabled}
        className={cn(
          "light:border-none bg-accent backdrop-filter backdrop-blur-md",
          inputClassName
        )}
        placeholder={placeholder}
        onChange={onChange}
        required={required}
        value={value}
        autoComplete={autoComplete}
        inputMode={inputMode}
      />
      {isButtoned && (
        <ButtonElement
          disabled={disabled}
          onClick={onClick}
          variant={buttonType}
        >
          {buttonContent}
        </ButtonElement>
      )}
    </DivElement>
  );
};

export default InputElement;
