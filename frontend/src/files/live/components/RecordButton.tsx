import { motion } from "motion/react";
import { Mic, Square } from "lucide-react";
import ButtonElement from "@/components/elements/ButtonElement";
import { SPRING, TAP } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface RecordButtonProps {
  isListening: boolean;
  disabled?: boolean;
  onStart: () => void;
  onStop: () => void;
}

const RecordButton = ({
  isListening,
  disabled,
  onStart,
  onStop,
}: RecordButtonProps) => {
  return (
    <div className="relative flex flex-col items-center gap-3">
      <motion.div whileTap={TAP} transition={SPRING.press} className="relative">
        {isListening && (
          <motion.span
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
            className="absolute inset-0 rounded-full bg-primary/40"
          />
        )}
        <ButtonElement
          onClick={isListening ? onStop : onStart}
          disabled={disabled}
          aria-label={isListening ? "Stop recording" : "Start recording"}
          variant={isListening ? "destructive" : "default"}
          className={cn(
            "relative size-20 rounded-full shadow-[0_16px_40px_-16px_rgba(0,100,255,0.65)]",
            isListening && "shadow-[0_16px_40px_-16px_rgba(224,48,30,0.6)]",
          )}
        >
          {isListening ? (
            <Square className="size-7 fill-current" strokeWidth={0} />
          ) : (
            <Mic className="size-8" strokeWidth={2.2} />
          )}
        </ButtonElement>
      </motion.div>
      <span className="text-xs font-medium tracking-wide text-muted-foreground">
        {isListening ? "Listening... tap to stop" : "Tap to record"}
      </span>
    </div>
  );
};

export default RecordButton;
