import { useEffect, useRef } from "react";
import { DailyProvider, useCallObject } from "@daily-co/daily-react";
import { notify } from "@/utils";
import { useAuthContext } from "@/files/auth/auth.context";
import CallStage from "./CallStage";
import type { ICallCredentials } from "../call.interface";

interface CallSessionProps {
  credentials: ICallCredentials;
  isMinimized: boolean;
  isCaptionsOn: boolean;
  onMinimize: (value: boolean) => void;
  onToggleCaptions: (value: boolean) => void;
  onLeave: () => void;
}

const CallSession = ({
  credentials,
  isMinimized,
  isCaptionsOn,
  onMinimize,
  onToggleCaptions,
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
      <CallStage
        callId={credentials.call.id}
        otherUser={credentials.otherUser}
        isMinimized={isMinimized}
        isCaptionsOn={isCaptionsOn}
        onMinimize={onMinimize}
        onToggleCaptions={onToggleCaptions}
        onLeave={onLeave}
      />
    </DailyProvider>
  );
};

export default CallSession;
