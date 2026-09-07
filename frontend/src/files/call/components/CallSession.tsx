import { useCallback } from "react";
import { DailyProvider } from "@daily-co/daily-react";
import { notify } from "@/utils";
import { useAuthContext } from "@/files/auth/auth.context";
import useDailyCallObject from "../hooks/useDailyCallObject";
import { callJoinErrorDescription } from "../call.utils";
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

  const handleJoinError = useCallback(
    (error: unknown) => {
      notify({
        type: "error",
        message: "We could not connect that call",
        description: callJoinErrorDescription(error),
      });
      onLeave();
    },
    [onLeave],
  );

  const callObject = useDailyCallObject({
    roomUrl: credentials.roomUrl,
    token: credentials.token,
    userName: profile?.displayName ?? profile?.username ?? "Paracomm user",
    onJoinError: handleJoinError,
  });

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
