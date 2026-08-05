import { AnimatePresence, motion } from "motion/react";
import { Hourglass } from "lucide-react";
import { SPRING } from "@/lib/motion";

interface QuotaBannerProps {
  quotaExhausted: boolean;
  remainingChars: number | null;
}

const QuotaBanner = ({ quotaExhausted, remainingChars }: QuotaBannerProps) => {
  return (
    <AnimatePresence>
      {quotaExhausted ? (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={SPRING.panel}
          className="flex w-full max-w-2xl items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3"
        >
          <Hourglass className="size-5 shrink-0 text-destructive" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">
              Daily free limit reached
            </span>
            <span className="text-xs text-muted-foreground">
              Your free translation time resets at midnight UTC. Come back then.
            </span>
          </div>
        </motion.div>
      ) : remainingChars !== null && remainingChars < 2000 ? (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={SPRING.panel}
          className="flex w-full max-w-2xl items-center gap-3 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3"
        >
          <Hourglass className="size-5 shrink-0 text-warning" />
          <span className="text-sm text-foreground">
            You are close to the daily free limit. It resets at midnight UTC.
          </span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default QuotaBanner;
