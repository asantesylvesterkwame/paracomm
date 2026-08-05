import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { SPRING } from "@/lib/motion";

const GREETINGS = [
  "Hello",
  "Hola",
  "Bonjour",
  "Akwaaba",
  "Habari",
  "こんにちは",
  "مرحبا",
  "Olá",
  "안녕하세요",
  "Sannu",
];

const GreetingCycler = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(
      () => setIndex((current) => (current + 1) % GREETINGS.length),
      1800,
    );
    return () => clearInterval(timer);
  }, []);

  return (
    <span className="relative inline-flex h-[1.15em] min-w-[3.2em] items-baseline justify-center overflow-hidden whitespace-nowrap align-baseline">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={GREETINGS[index]}
          initial={{ y: "70%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-70%", opacity: 0 }}
          transition={SPRING.snappy}
          className="whitespace-nowrap text-primary"
        >
          {GREETINGS[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

export default GreetingCycler;
