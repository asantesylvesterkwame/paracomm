import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  DailyAudio,
  useAudioTrack,
  useDaily,
  useLocalSessionId,
  useMeetingState,
  useParticipantIds,
  useVideoTrack,
} from "@daily-co/daily-react";
import { Minimize2 } from "lucide-react";
import ButtonElement from "@/components/elements/ButtonElement";
import ShimmerTextElement from "@/components/elements/ShimmerTextElement";
import { SPRING } from "@/lib/motion";
import { formatDuration } from "@/utils/text";
import { languageLabelOf } from "@/constants/languages.constants";
import { useAuthContext } from "@/files/auth/auth.context";
import { CALL_COPY } from "../call.constants";
import useCallCaptions from "../useCallCaptions";
import CallControls from "./CallControls";
import CallPill from "./CallPill";
import SubtitleTrack from "./SubtitleTrack";
import VideoTile from "./VideoTile";
import type { IUser } from "@/files/user/user.interface";

interface CallStageProps {
  callId: string;
  otherUser: IUser;
  isMinimized: boolean;
  isCaptionsOn: boolean;
  onMinimize: (value: boolean) => void;
  onToggleCaptions: (value: boolean) => void;
  onLeave: () => void;
}

const CallStage = ({
  callId,
  otherUser,
  isMinimized,
  isCaptionsOn,
  onMinimize,
  onToggleCaptions,
  onLeave,
}: CallStageProps) => {
  const daily = useDaily();
  const { profile } = useAuthContext();
  const localSessionId = useLocalSessionId();
  const meetingState = useMeetingState();
  const remoteIds = useParticipantIds({ filter: "remote" });
  const localAudio = useAudioTrack(localSessionId ?? "");
  const localVideo = useVideoTrack(localSessionId ?? "");
  const remoteId = remoteIds[0];
  const remoteAudio = useAudioTrack(remoteId ?? "");

  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const isMicMuted = localAudio.isOff;
  const isCameraOff = localVideo.isOff;
  const hasRemote = Boolean(remoteId);

  const otherName =
    otherUser.displayName ?? otherUser.username ?? "Your contact";
  const myName = profile?.displayName ?? profile?.username ?? "You";

  const {
    captions,
    interim,
    remoteInterim,
    isSupported: isCaptionsSupported,
  } = useCallCaptions({
    callId,
    isEnabled: isCaptionsOn && hasRemote,
    isMicMuted,
    otherUserLang: otherUser.preferredLang,
  });

  useEffect(() => {
    if (!hasRemote) return;
    const timer = setInterval(
      () => setElapsedSeconds((previous) => previous + 1),
      1000,
    );
    return () => clearInterval(timer);
  }, [hasRemote]);

  const toggleMic = useCallback(() => {
    daily?.setLocalAudio(isMicMuted);
  }, [daily, isMicMuted]);

  const toggleCamera = useCallback(() => {
    daily?.setLocalVideo(isCameraOff);
  }, [daily, isCameraOff]);

  const statusLine = useMemo(() => {
    if (meetingState === "joining-meeting") return CALL_COPY.RECONNECTING;
    if (!hasRemote) return `${CALL_COPY.WAITING}`;
    return null;
  }, [hasRemote, meetingState]);

  if (isMinimized) {
    return (
      <div className="dark">
        <CallPill
          otherUser={otherUser}
          elapsedSeconds={elapsedSeconds}
          onExpand={() => onMinimize(false)}
          onLeave={onLeave}
        />
        <DailyAudio />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={SPRING.panel}
      role="dialog"
      aria-modal="true"
      aria-label={`Video call with ${otherName}`}
      className="dark fixed inset-0 z-50 flex flex-col bg-background text-foreground"
    >
      <header className="absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-4">
        <span className="flex flex-col gap-1 rounded-2xl bg-background/60 px-3 py-2 backdrop-blur-xl">
          <span className="text-sm font-medium">{otherName}</span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {languageLabelOf(otherUser.preferredLang)} to{" "}
            {languageLabelOf(profile?.preferredLang ?? "en")} ·{" "}
            {formatDuration(elapsedSeconds)}
          </span>
        </span>
        <ButtonElement
          variant="ghost"
          size="icon"
          onClick={() => onMinimize(true)}
          aria-label={CALL_COPY.MINIMIZE}
          className="size-10 rounded-full bg-background/60 backdrop-blur-xl"
        >
          <Minimize2 className="size-4" />
        </ButtonElement>
      </header>

      <VideoTile
        sessionId={remoteId}
        name={otherName}
        avatarUrl={otherUser.avatarUrl}
        isMuted={hasRemote && remoteAudio.isOff}
        className="absolute inset-0 size-full"
      />

      <AnimatePresence>
        {statusLine && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-x-0 top-1/2 z-10 text-center text-sm"
          >
            <ShimmerTextElement>{statusLine}</ShimmerTextElement>
          </motion.p>
        )}
      </AnimatePresence>

      <VideoTile
        sessionId={localSessionId ?? undefined}
        name={myName}
        avatarUrl={profile?.avatarUrl}
        isMirrored
        isMuted={isMicMuted}
        isCompact
        className="absolute end-4 top-20 z-20 aspect-3/4 w-24 rounded-2xl ring-1 ring-border sm:w-36 md:aspect-video md:w-48"
      />

      <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-4 bg-linear-to-t from-background/90 to-transparent px-4 pt-16 pb-6">
        <SubtitleTrack
          captions={captions}
          interim={interim}
          remoteInterim={remoteInterim}
          isEnabled={isCaptionsOn}
          isSupported={isCaptionsSupported}
          isMicMuted={isMicMuted}
        />
        <CallControls
          isMicMuted={isMicMuted}
          isCameraOff={isCameraOff}
          isCaptionsOn={isCaptionsOn}
          isCaptionsSupported={isCaptionsSupported}
          onToggleMic={toggleMic}
          onToggleCamera={toggleCamera}
          onToggleCaptions={onToggleCaptions}
          onLeave={onLeave}
        />
      </div>

      <DailyAudio />
    </motion.div>
  );
};

export default CallStage;
