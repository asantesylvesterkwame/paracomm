import { AnimatePresence, motion } from "motion/react";
import { CloudOff, RefreshCw } from "lucide-react";
import { SPRING } from "@/lib/motion";
import useOnlineStatus from "@/hooks/useOnlineStatus";

interface ConnectionBannerProps {
  isSocketConnected: boolean;
  queuedCount: number;
}

const countCopy = (count: number) =>
  count === 1 ? "1 message" : `${count} messages`;

const bannerCopy = ({
  isOffline,
  isReconnecting,
  queuedCount,
}: {
  isOffline: boolean;
  isReconnecting: boolean;
  queuedCount: number;
}) => {
  if (isOffline) {
    return queuedCount > 0
      ? `You are offline. ${countCopy(queuedCount)} will send when you are back.`
      : "You are offline. Anything you write will send when you are back.";
  }
  if (isReconnecting) {
    return queuedCount > 0
      ? `Reconnecting. ${countCopy(queuedCount)} waiting to send.`
      : "Reconnecting to this conversation.";
  }
  return `Sending ${countCopy(queuedCount)}.`;
};

const ConnectionBanner = ({
  isSocketConnected,
  queuedCount,
}: ConnectionBannerProps) => {
  const isOnline = useOnlineStatus();
  const isOffline = !isOnline;
  const isReconnecting = isOnline && !isSocketConnected;
  const isVisible = isOffline || isReconnecting || queuedCount > 0;

  return (
    <AnimatePresence initial={false}>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={SPRING.card}
          className="overflow-hidden"
        >
          <div className="flex items-center gap-2 border-b border-border/60 bg-warning/10 px-4 py-2 text-xs text-warning">
            {isOffline ? (
              <CloudOff className="size-3.5 shrink-0" />
            ) : (
              <RefreshCw className="size-3.5 shrink-0 animate-spin" />
            )}
            <span>
              {bannerCopy({ isOffline, isReconnecting, queuedCount })}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConnectionBanner;
