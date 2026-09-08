import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Languages, RotateCw, X } from "lucide-react";
import { Bubble, BubbleContent } from "@/components/elements/BubbleElement";
import ButtonElement from "@/components/elements/ButtonElement";
import ShimmerTextElement from "@/components/elements/ShimmerTextElement";
import useDelayedFlag from "@/hooks/useDelayedFlag";
import { SPRING } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { languageLabelOf } from "@/constants/languages.constants";
import { TRANSLATING_HINT_DELAY_MS } from "../message.constants";
import { isTempMessage } from "../message.utils";
import VoiceNoteService from "../voice-note/voice-note.service";
import { VOICE_COPY, originalIn } from "../voice-note/voice-note.constants";
import {
  doneDubsOf,
  dubFor,
  isOriginalInLang,
  pendingRecordingStore,
  playbackKeyOf,
} from "../voice-note/voice-note.utils";
import DubStatus from "./DubStatus";
import MessageStatus from "./MessageStatus";
import RedubPicker from "./RedubPicker";
import VoiceNotePlayer from "./VoiceNotePlayer";
import type { IClientMessage } from "../message.interface";
import type { IDubRequestTarget } from "../voice-note/voice-note.interface";

interface VoiceNoteBubbleProps {
  message: IClientMessage;
  isOwn: boolean;
  isSeen: boolean;
  myLang: string;
  requestingDubFor: IDubRequestTarget | null;
  onRetrySend: (id: string) => void;
  onDismiss: (id: string) => void;
  onRequestDub: (messageId: string, lang: string) => void;
}

const chipClass = (isActive: boolean) =>
  cn(
    "h-6 rounded-full px-2.5 text-[11px] font-medium ring-1 ring-inset transition-colors",
    isActive
      ? "bg-primary/12 text-primary ring-primary/25 hover:bg-primary/16 hover:text-primary"
      : "bg-transparent text-muted-foreground ring-border hover:text-foreground",
  );

const VoiceNoteBubble = ({
  message,
  isOwn,
  isSeen,
  myLang,
  requestingDubFor,
  onRetrySend,
  onDismiss,
  onRequestDub,
}: VoiceNoteBubbleProps) => {
  const voiceNote = message.voiceNote ?? null;
  const [activeLang, setActiveLang] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const hasChosenRef = useRef(false);

  const doneDubs = useMemo(() => doneDubsOf(voiceNote), [voiceNote]);
  const myDub = dubFor(voiceNote, myLang);
  const isOriginalMine = isOriginalInLang(voiceNote, myLang);
  const isTemp = isTempMessage(message.id);
  const isTranscribing = voiceNote?.transcriptionStatus === "pending";
  const isTranscriptionFailed = voiceNote?.transcriptionStatus === "failed";
  const showListening = useDelayedFlag(
    Boolean(voiceNote) && isTranscribing && !isTemp,
    TRANSLATING_HINT_DELAY_MS,
  );
  const isRecordingLost =
    message.clientStatus === "failed" &&
    message.clientError === "fatal" &&
    !pendingRecordingStore.has(message.clientId);

  useEffect(() => {
    if (hasChosenRef.current || isOwn) return;
    if (myDub?.status === "done" && activeLang !== myLang) {
      setActiveLang(myLang);
    }
  }, [activeLang, isOwn, myDub?.status, myLang]);

  useEffect(() => {
    if (activeLang && !doneDubs.some((dub) => dub.lang === activeLang)) {
      setActiveLang(null);
    }
  }, [activeLang, doneDubs]);

  const choose = useCallback((lang: string | null) => {
    hasChosenRef.current = true;
    setActiveLang(lang);
    setShowOriginal(false);
  }, []);

  const activeDub = dubFor(voiceNote, activeLang);
  const captionText = activeDub?.text ?? voiceNote?.transcript ?? null;
  const originalText = voiceNote?.transcript ?? null;
  const canRevealOriginal = Boolean(activeDub?.text && originalText);
  const playbackKey = voiceNote ? playbackKeyOf(voiceNote.id, activeLang) : null;
  const durationMs = activeDub?.durationMs ?? voiceNote?.durationMs ?? 0;
  const canPlay = Boolean(voiceNote) && (!isTemp || Boolean(message.localAudioUrl));

  const load = useCallback(() => {
    if (!voiceNote) return Promise.reject(new Error("missing voice note"));
    if (activeLang === null && message.localAudioUrl) {
      return Promise.resolve(message.localAudioUrl);
    }
    return VoiceNoteService.fetchMedia(
      message.roomId,
      voiceNote.id,
      activeLang ?? undefined,
    );
  }, [activeLang, message.localAudioUrl, message.roomId, voiceNote]);

  const watchedDubs = useMemo(() => {
    if (!voiceNote) return [];
    return voiceNote.dubs.filter((dub) => dub.status !== "done");
  }, [voiceNote]);

  const originalChipLabel = voiceNote?.transcriptLang
    ? originalIn(languageLabelOf(voiceNote.transcriptLang))
    : VOICE_COPY.ORIGINAL;

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={SPRING.card}
      className={cn("flex flex-col gap-1.5", isOwn ? "items-end" : "items-start")}
    >
      <Bubble
        variant={isOwn ? "default" : "secondary"}
        align={isOwn ? "end" : "start"}
        className={cn(
          "transition-opacity",
          message.clientStatus === "sending" && "opacity-70",
          message.clientStatus === "failed" && "opacity-60",
        )}
      >
        <BubbleContent className="flex flex-col gap-2 px-3 py-2.5">
          <VoiceNotePlayer
            playbackKey={playbackKey}
            durationMs={durationMs}
            load={load}
            isOwn={isOwn}
            isDisabled={!canPlay}
          />
          <AnimatePresence mode="wait" initial={false}>
            {captionText && (
              <motion.p
                key={captionText}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={SPRING.snappy}
                className={cn(
                  "max-w-[36ch] text-sm leading-relaxed",
                  isOwn ? "text-primary-foreground/90" : "text-foreground",
                )}
              >
                {captionText}
              </motion.p>
            )}
          </AnimatePresence>
          {canRevealOriginal && (
            <ButtonElement
              variant="ghost"
              size="sm"
              onClick={() => setShowOriginal((value) => !value)}
              aria-expanded={showOriginal}
              className={cn(
                "-mx-1 h-6 w-fit gap-1 rounded-lg px-1.5 text-[11px] font-normal",
                isOwn
                  ? "text-primary-foreground/75 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Languages className="size-3" />
              {showOriginal ? VOICE_COPY.HIDE_ORIGINAL : VOICE_COPY.SHOW_ORIGINAL}
            </ButtonElement>
          )}
          <AnimatePresence initial={false}>
            {showOriginal && canRevealOriginal && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={SPRING.card}
                className={cn(
                  "max-w-[36ch] overflow-hidden text-xs leading-snug",
                  isOwn ? "text-primary-foreground/75" : "text-muted-foreground",
                )}
              >
                {originalText}
              </motion.p>
            )}
          </AnimatePresence>
        </BubbleContent>
      </Bubble>

      <AnimatePresence initial={false}>
        {showListening && (
          <motion.span
            key="listening"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={SPRING.card}
            className="flex items-center gap-1.5 px-1 text-[11px]"
          >
            <Languages className="size-3 text-muted-foreground" />
            <ShimmerTextElement>{VOICE_COPY.TRANSCRIBING}</ShimmerTextElement>
          </motion.span>
        )}
        {isTranscriptionFailed && !isTemp && (
          <motion.span
            key="transcription-failed"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={SPRING.card}
          >
            <ButtonElement
              variant="ghost"
              size="sm"
              onClick={() => onRequestDub(message.id, myLang)}
              className="h-6 gap-1 rounded-lg px-2 text-[11px] text-destructive hover:text-destructive"
            >
              <RotateCw className="size-3" />
              {voiceNote?.transcriptionError === "empty"
                ? VOICE_COPY.NO_SPEECH
                : VOICE_COPY.TRANSCRIPTION_FAILED}
            </ButtonElement>
          </motion.span>
        )}
        {voiceNote && voiceNote.transcriptionStatus === "done" && (
          <motion.span
            key="rail"
            layout="position"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={SPRING.card}
            className={cn(
              "flex max-w-[80%] flex-wrap items-center gap-1.5 px-0.5",
              isOwn ? "justify-end" : "justify-start",
            )}
          >
            <ButtonElement
              variant="ghost"
              size="sm"
              onClick={() => choose(null)}
              aria-pressed={activeLang === null}
              className={chipClass(activeLang === null)}
            >
              {originalChipLabel}
              {isOriginalMine && !isOwn && (
                <span className="sr-only">{VOICE_COPY.IN_YOUR_LANGUAGE}</span>
              )}
            </ButtonElement>
            <AnimatePresence initial={false}>
              {doneDubs.map((dub) => (
                <motion.span
                  key={dub.lang}
                  layout="position"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={SPRING.snappy}
                >
                  <ButtonElement
                    variant="ghost"
                    size="sm"
                    onClick={() => choose(dub.lang)}
                    aria-pressed={activeLang === dub.lang}
                    className={chipClass(activeLang === dub.lang)}
                  >
                    {languageLabelOf(dub.lang)}
                  </ButtonElement>
                </motion.span>
              ))}
              {watchedDubs.map((dub) => (
                <DubStatus
                  key={`status-${dub.lang}`}
                  dub={dub}
                  isRequesting={
                    requestingDubFor?.messageId === message.id &&
                    requestingDubFor.lang === dub.lang
                  }
                  onRetry={(lang) => onRequestDub(message.id, lang)}
                />
              ))}
            </AnimatePresence>
            {!isTemp && (
              <RedubPicker
                voiceNote={voiceNote}
                messageId={message.id}
                activeLang={activeLang}
                requestingDubFor={requestingDubFor}
                onChoose={choose}
                onRequestDub={(lang) => onRequestDub(message.id, lang)}
              />
            )}
          </motion.span>
        )}
      </AnimatePresence>

      <span className="flex items-center gap-2">
        {isRecordingLost ? (
          <ButtonElement
            variant="ghost"
            size="sm"
            onClick={() => onDismiss(message.id)}
            className="h-6 gap-1.5 rounded-lg px-2 text-[11px] text-destructive hover:text-destructive"
          >
            <X className="size-3" />
            {VOICE_COPY.RECORDING_LOST}
          </ButtonElement>
        ) : (
          <MessageStatus
            message={message}
            isOwn={isOwn}
            isSeen={isSeen}
            onRetrySend={onRetrySend}
          />
        )}
      </span>
    </motion.div>
  );
};

export default VoiceNoteBubble;
