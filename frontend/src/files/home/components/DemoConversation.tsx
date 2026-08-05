import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Mic } from "lucide-react";
import SkeletonElement from "@/components/elements/SkeletonElement";
import { SPRING } from "@/lib/motion";

const SCRIPT = [
  {
    speaker: "Ama",
    lang: "Twi",
    source: "Ɛte sɛn? Wo ho ye anaa?",
    translated: "How are you? Are you well?",
  },
  {
    speaker: "Lucas",
    lang: "Portuguese",
    source: "Tudo bem! Que bom falar com você.",
    translated: "All good! So nice to talk with you.",
  },
  {
    speaker: "Yuki",
    lang: "Japanese",
    source: "今日は素晴らしい一日ですね。",
    translated: "What a wonderful day it is today.",
  },
];

const STEP_MS = 2600;

const DemoConversation = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(
      () => setStep((current) => (current + 1) % (SCRIPT.length * 2)),
      STEP_MS,
    );
    return () => clearInterval(timer);
  }, []);

  const messageIndex = Math.floor(step / 2);
  const isTranslating = step % 2 === 0;
  const message = SCRIPT[messageIndex];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={SPRING.panel}
      className="relative w-full max-w-md rounded-3xl border border-border/60 bg-card/95 p-5 shadow-[0_24px_60px_-30px_rgba(0,100,255,0.35)] backdrop-blur-xl"
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="text-eyebrow">Live room</span>
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <motion.span
            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            className="size-2 rounded-full bg-success"
          />
          Listening
        </span>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={messageIndex}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={SPRING.card}
          className="flex flex-col gap-3"
        >
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Mic className="size-4" />
            </span>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">
                {message.speaker} · {message.lang}
              </span>
              <p className="rounded-2xl rounded-tl-md bg-secondary px-4 py-2.5 text-sm text-foreground">
                {message.source}
              </p>
            </div>
          </div>
          <div className="ml-12 flex flex-col gap-1">
            <span className="text-xs font-medium text-primary">
              English translation
            </span>
            {isTranslating ? (
              <SkeletonElement className="h-9 w-4/5 rounded-2xl rounded-tl-md" />
            ) : (
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={SPRING.card}
                className="rounded-2xl rounded-tl-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-[0_8px_20px_-10px_rgba(0,100,255,0.55)]"
              >
                {message.translated}
              </motion.p>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default DemoConversation;
