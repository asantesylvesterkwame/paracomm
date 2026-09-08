import { useEffect, useRef } from "react";
import type { ComponentRef } from "react";
import {
  DailyAudio,
  useActiveSpeakerId,
  useAudioTrack,
  useParticipantIds,
} from "@daily-co/daily-react";
import { useAuthContext } from "@/files/auth/auth.context";
import { createLogger } from "@/utils/logger";
import useLiveDubbing from "../dubbing/useLiveDubbing";
import useCallLanguageSync from "../hooks/useCallLanguageSync";
import { useCallContext } from "../call.context";
import CallStage from "./CallStage";
import type { ICallCredentials } from "../call.interface";

const logger = createLogger("call-runtime");

interface CallRuntimeProps {
  credentials: ICallCredentials;
  isMinimized: boolean;
  isCaptionsOn: boolean;
  isDubbingOn: boolean;
  onMinimize: (value: boolean) => void;
  onToggleCaptions: (value: boolean) => void;
  onToggleDubbing: (value: boolean) => void;
  onLeave: () => void;
}

const CallRuntime = ({
  credentials,
  isMinimized,
  isCaptionsOn,
  isDubbingOn,
  onMinimize,
  onToggleCaptions,
  onToggleDubbing,
  onLeave,
}: CallRuntimeProps) => {
  const { profile } = useAuthContext();
  const { updateOtherUserLang } = useCallContext();
  const audioRef = useRef<ComponentRef<typeof DailyAudio>>(null);
  const remoteIds = useParticipantIds({ filter: "remote" });
  const remoteId = remoteIds[0];
  const remoteAudio = useAudioTrack(remoteId ?? "");
  const activeSpeakerId = useActiveSpeakerId();

  const myLang = profile?.preferredLang ?? "en";

  useCallLanguageSync({ myLang, onRemoteLang: updateOtherUserLang });

  useEffect(() => {
    logger.log("remote audio", {
      remoteId,
      remoteCount: remoteIds.length,
      hasPersistentTrack: Boolean(remoteAudio.persistentTrack),
      trackState: remoteAudio.persistentTrack?.readyState,
      isOff: remoteAudio.isOff,
      state: remoteAudio.state,
      subscribed: remoteAudio.subscribed,
      activeSpeakerId,
      isDubbingOn,
      myLang,
      otherUserLang: credentials.otherUser.preferredLang,
    });
  }, [
    activeSpeakerId,
    credentials.otherUser.preferredLang,
    isDubbingOn,
    myLang,
    remoteAudio.isOff,
    remoteAudio.persistentTrack,
    remoteAudio.state,
    remoteAudio.subscribed,
    remoteId,
    remoteIds.length,
  ]);

  const dubbing = useLiveDubbing({
    callId: credentials.call.id,
    isEnabled: isDubbingOn && Boolean(remoteId),
    myLang,
    otherUserLang: credentials.otherUser.preferredLang,
    remoteTrack: remoteAudio.persistentTrack ?? null,
    isRemoteSpeaking: !activeSpeakerId || activeSpeakerId === remoteId,
  });

  const isDubbingLive =
    dubbing.state === "listening" ||
    dubbing.state === "speaking" ||
    dubbing.state === "switching";

  useEffect(() => {
    logger.log("dubbing state", {
      state: dubbing.state,
      isDubbingLive,
      unavailableReason: dubbing.unavailableReason,
    });
  }, [dubbing.state, dubbing.unavailableReason, isDubbingLive]);

  useEffect(() => {
    if (!remoteId) return;
    const apply = (isMuted: boolean) => {
      const element = audioRef.current?.getAudioBySessionId(remoteId);
      if (element) element.muted = isMuted;
    };
    apply(isDubbingLive);
    const timer = setInterval(() => apply(isDubbingLive), 250);
    return () => {
      clearInterval(timer);
      apply(false);
    };
  }, [isDubbingLive, remoteId]);

  return (
    <>
      <CallStage
        callId={credentials.call.id}
        otherUser={credentials.otherUser}
        isMinimized={isMinimized}
        isCaptionsOn={isCaptionsOn}
        isDubbingOn={isDubbingOn}
        dubbing={dubbing}
        onMinimize={onMinimize}
        onToggleCaptions={onToggleCaptions}
        onToggleDubbing={onToggleDubbing}
        onLeave={onLeave}
      />
      <DailyAudio ref={audioRef} />
    </>
  );
};

export default CallRuntime;
