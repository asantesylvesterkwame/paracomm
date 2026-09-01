import { motion } from "motion/react";
import { PhoneMissed, Video } from "lucide-react";
import { SPRING } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { formatTimeAgo } from "@/utils";

interface CallEntryProps {
  label: string;
  createdAt: string;
  isOwn: boolean;
}

const CallEntry = ({ label, createdAt, isOwn }: CallEntryProps) => {
  const isMissed = label.toLowerCase().startsWith("missed");
  const Icon = isMissed ? PhoneMissed : Video;

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING.card}
      className="flex justify-center py-1"
    >
      <span
        className={cn(
          "flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-xs",
          isMissed ? "text-destructive" : "text-muted-foreground",
        )}
      >
        <Icon aria-hidden className="size-3.5" />
        {isOwn && !isMissed ? `You started a ${label.toLowerCase()}` : label}
        <span className="text-muted-foreground/70">
          {formatTimeAgo(createdAt)}
        </span>
      </span>
    </motion.div>
  );
};

export default CallEntry;
