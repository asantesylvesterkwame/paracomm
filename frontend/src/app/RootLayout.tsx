import { useRef } from "react";
import { useLocation, useOutlet } from "react-router-dom";
import { AnimatePresence, motion, useIsPresent } from "motion/react";
import { SPRING } from "@/lib/motion";
import { Toaster } from "@/components/ui/sonner";
import { ClerkAppProvider } from "@/providers/clerk-provider";
import { AuthProvider } from "@/files/auth/auth.context";
import { RoomSocketProvider } from "@/context/RoomSocketContext";
import { UserSocketProvider } from "@/context/UserSocketContext";
import { RoomProvider } from "@/files/room/room.context";
import { MessageProvider } from "@/files/message/message.context";
import { CallProvider } from "@/files/call/call.context";
import CallOverlay from "@/files/call/components/CallOverlay";

const AnimatedOutlet = () => {
  const outlet = useOutlet();
  const isPresent = useIsPresent();
  const snapshotRef = useRef(outlet);

  if (isPresent) snapshotRef.current = outlet;

  return snapshotRef.current;
};

const RootLayout = () => {
  const location = useLocation();
  const sectionKey = location.pathname.split("/")[1] || "home";
  return (
    <ClerkAppProvider>
      <RoomSocketProvider>
        <AuthProvider>
          <UserSocketProvider>
            <RoomProvider>
              <MessageProvider>
                <CallProvider>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={sectionKey}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={SPRING.card}
                      className="min-h-dvh"
                    >
                      <AnimatedOutlet />
                    </motion.div>
                  </AnimatePresence>
                  <CallOverlay />
                  <Toaster />
                </CallProvider>
              </MessageProvider>
            </RoomProvider>
          </UserSocketProvider>
        </AuthProvider>
      </RoomSocketProvider>
    </ClerkAppProvider>
  );
};

export default RootLayout;
