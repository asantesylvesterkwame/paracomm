import { motion } from "motion/react";
import { SPRING } from "@/lib/motion";

const TypingIndicator = ({ name }: { name: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 6 }}
    transition={SPRING.card}
    className="flex items-center gap-2 px-1 text-xs text-muted-foreground"
  >
    <span className="flex gap-1">
      {[0, 1, 2].map((dot) => (
        <motion.span
          key={dot}
          animate={{ y: [0, -3, 0] }}
          transition={{
            duration: 0.9,
            repeat: Infinity,
            delay: dot * 0.15,
          }}
          className="size-1.5 rounded-full bg-muted-foreground/70"
        />
      ))}
    </span>
    {name} is typing
  </motion.div>
);

export default TypingIndicator;
