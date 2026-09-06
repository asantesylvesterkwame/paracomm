import { Suspense, lazy } from "react";
import { AnimatePresence } from "motion/react";
import { useCallContext } from "../call.context";
import IncomingCallDialog from "./IncomingCallDialog";

const CallSession = lazy(() => import("./CallSession"));

const CallOverlay = () => {
  const {
    phase,
    credentials,
    incoming,
    isMinimized,
    isAccepting,
    isCaptionsOn,
    isDubbingOn,
    acceptCall,
    declineCall,
    endCall,
    setIsMinimized,
    setIsCaptionsOn,
    setIsDubbingOn,
  } = useCallContext();

  return (
    <AnimatePresence>
      {phase === "incoming" && incoming && (
        <IncomingCallDialog
          key="incoming"
          caller={incoming.caller}
          isAccepting={isAccepting}
          onAccept={() => void acceptCall()}
          onDecline={() => void declineCall()}
        />
      )}
      {phase === "active" && credentials && (
        <Suspense key={credentials.call.id} fallback={null}>
          <CallSession
            credentials={credentials}
            isMinimized={isMinimized}
            isCaptionsOn={isCaptionsOn}
            isDubbingOn={isDubbingOn}
            onMinimize={setIsMinimized}
            onToggleCaptions={setIsCaptionsOn}
            onToggleDubbing={setIsDubbingOn}
            onLeave={() => void endCall()}
          />
        </Suspense>
      )}
    </AnimatePresence>
  );
};

export default CallOverlay;
