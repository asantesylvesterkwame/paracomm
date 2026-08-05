import * as React from "react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../ui/input-otp";
import type { OtpElementprops } from "@/interfaces/components/elements/otpElement.interface";

const OtpElement: React.FC<OtpElementprops> = ({
  id,
  slots,
  onChange,
  groupClassName,
  slotClassName,
}) => {
  return (
    <InputOTP onChange={onChange} maxLength={slots.length}>
      <InputOTPGroup className={groupClassName}>
        {slots.map((slot, index) => (
          <InputOTPSlot
            id={id}
            key={slot}
            index={index}
            className={slotClassName}
          />
        ))}
      </InputOTPGroup>
    </InputOTP>
  );
};

export default OtpElement;
