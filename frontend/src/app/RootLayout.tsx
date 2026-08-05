import { useState } from "react";
import { useLocation, useOutlet } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { SPRING } from "@/lib/motion";
import { Toaster } from "@/components/ui/sonner";

const AnimatedOutlet = () => {
  const outlet = useOutlet();
  const [frozenOutlet] = useState(outlet);
  return frozenOutlet;
};

const RootLayout = () => {
  const location = useLocation();
  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
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
    </>
  );
};

export default RootLayout;
