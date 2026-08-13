import { useState } from "react";
import { useLocation, useOutlet } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { SPRING } from "@/lib/motion";
import { Toaster } from "@/components/ui/sonner";
import { ClerkAppProvider } from "@/providers/clerk-provider";
import { AuthProvider } from "@/files/auth/auth.context";
import { RoomSocketProvider } from "@/context/RoomSocketContext";
import { RoomProvider } from "@/files/room/room.context";
import { MessageProvider } from "@/files/message/message.context";

const AnimatedOutlet = () => {
  const outlet = useOutlet();
  const [frozenOutlet] = useState(outlet);
  return frozenOutlet;
};

const RootLayout = () => {
  const location = useLocation();
  const sectionKey = location.pathname.split("/")[1] || "home";
  return (
    <ClerkAppProvider>
      <RoomSocketProvider>
        <AuthProvider>
          <RoomProvider>
            <MessageProvider>
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
              <Toaster />
            </MessageProvider>
          </RoomProvider>
        </AuthProvider>
      </RoomSocketProvider>
    </ClerkAppProvider>
  );
};

export default RootLayout;
