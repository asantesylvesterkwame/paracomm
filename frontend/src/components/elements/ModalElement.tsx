import * as React from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import type { ImageElementProps } from "@/interfaces/components/elements/imageElement.interface";

interface ModalElementProps extends ImageElementProps {
  children: React.ReactNode;
}

const ModalElement: React.FC<ModalElementProps> = ({
  children,
  source,
  alt,
}) => {
  return (
    <Dialog>
      <DialogTrigger
        nativeButton={false}
        render={<span role="button" tabIndex={0} className="contents cursor-pointer" />}
      >
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 bg-transparent border-none ring-0">
        <img
          src={source}
          alt={alt}
          className="w-full h-full object-contain rounded-lg"
        />
      </DialogContent>
    </Dialog>
  );
};

export default ModalElement;
