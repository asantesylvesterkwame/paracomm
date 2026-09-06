import { useEffect, useRef } from "react";
import { DailyProvider, useCallObject } from "@daily-co/daily-react";
import { notify } from "@/utils";
import { useAuthContext } from "@/files/auth/auth.context";
import CallRuntime from "./CallRuntime";
import type { ICallCredentials } from "../call.interface";

interface CallSessionProps {
  credentials: ICallCredentials;
  isMinimized: boolean;
  isCaptionsOn: boolean;
  isDubbingOn: boolean;
  onMinimize: (value: boolean) => void;
  onToggleCaptions: (value: boolean) => void;
  onToggleDubbing: (value: boolean) => void;
  onLeave: () => void;
}

const CallSession = ({
  credentials,
  isMinimized,
  isCaptionsOn,
  isDubbingOn,
  onMinimize,
  onToggleCaptions,
  onToggleDubbing,
  onLeave,
}: CallSessionProps) => {
  const { profile } = useAuthContext();
  const callObject = useCallObject({ options: {} });
  const hasJoinedRef = useRef(false);

  useEffect(() => {
    if (!callObject || hasJoinedRef.current) return;
    hasJoinedRef.current = true;
    callObject
      .join({
        url: credentials.roomUrl,
        token: credentials.token,
        userName: profile?.displayName ?? profile?.username ?? "Paracomm user",
      })
      .catch(() => {
        notify({
          type: "error",
          message: "We could not connect that call",
          description:
            "Check your camera and microphone permissions, then try again.",
        });
        onLeave();
      });
  }, [callObject, credentials.roomUrl, credentials.token, onLeave, profile]);

  useEffect(() => {
    return () => {
      callObject?.leave().catch(() => undefined);
    };
  }, [callObject]);

  if (!callObject) return null;

  return (
    <DailyProvider callObject={callObject}>
      <CallRuntime
        credentials={credentials}
        isMinimized={isMinimized}
        isCaptionsOn={isCaptionsOn}
        isDubbingOn={isDubbingOn}
        onMinimize={onMinimize}
        onToggleCaptions={onToggleCaptions}
        onToggleDubbing={onToggleDubbing}
        onLeave={onLeave}
      />
    </DailyProvider>
  );
};

export default CallSession;
