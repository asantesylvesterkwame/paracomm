import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { MicOff, MonitorSmartphone } from "lucide-react";
import Logo from "@/components/common/Logo";
import { ModeToggle } from "@/components/common/ModeToggle";
import EmptyState from "@/components/common/EmptyState";
import { fadeUp, staggerParent } from "@/lib/motion";
import { ROUTES } from "@/constants/routes.constants";
import useLive from "../useLive";
import LanguagePicker from "../components/LanguagePicker";
import RecordButton from "../components/RecordButton";
import TranscriptPanel from "../components/TranscriptPanel";
import QuotaBanner from "../components/QuotaBanner";

const Live = () => {
  const {
    status,
    inputLang,
    setInputLang,
    outputLang,
    setOutputLang,
    utterances,
    interimTranscript,
    quotaExhausted,
    remainingChars,
    startRecording,
    stopRecording,
    retryUtterance,
  } = useLive();

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-5xl flex-row items-center justify-between gap-4 px-6 py-4">
          <Logo />
          <div className="flex flex-row items-center gap-3">
            <Link
              to={ROUTES.HOME}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Home
            </Link>
            <ModeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center gap-8 px-6 py-10">
        {status === "unsupported" ? (
          <EmptyState
            icon={MonitorSmartphone}
            title="This browser cannot listen"
            description="Speech recognition is not available here. Open Paracomm in Chrome or Edge to translate live."
            className="w-full max-w-2xl"
          />
        ) : status === "micDenied" ? (
          <EmptyState
            icon={MicOff}
            title="Microphone access needed"
            description="Allow microphone access in your browser settings, then reload this page to start translating."
            className="w-full max-w-2xl"
          />
        ) : (
          <motion.div
            variants={staggerParent(0.08)}
            initial="hidden"
            animate="show"
            className="flex w-full flex-col items-center gap-8"
          >
            <motion.div variants={fadeUp} className="flex flex-col items-center gap-2 text-center">
              <span className="text-eyebrow">Live translation</span>
              <h1 className="text-headline text-3xl md:text-4xl">
                Speak once, be understood everywhere.
              </h1>
            </motion.div>
            <motion.div variants={fadeUp} className="flex w-full justify-center">
              <LanguagePicker
                inputLang={inputLang}
                outputLang={outputLang}
                onInputChange={setInputLang}
                onOutputChange={setOutputLang}
                disabled={status === "listening"}
              />
            </motion.div>
            <QuotaBanner
              quotaExhausted={quotaExhausted}
              remainingChars={remainingChars}
            />
            <motion.div variants={fadeUp}>
              <RecordButton
                isListening={status === "listening"}
                disabled={quotaExhausted}
                onStart={startRecording}
                onStop={stopRecording}
              />
            </motion.div>
            <motion.div variants={fadeUp} className="w-full">
              <TranscriptPanel
                status={status}
                utterances={utterances}
                interimTranscript={interimTranscript}
                inputLang={inputLang}
                outputLang={outputLang}
                onRetry={retryUtterance}
              />
            </motion.div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default Live;
