import { useCallback, useState } from "react";
import { handleApiAction, notify } from "@/utils";
import CallService from "./call.service";
import type { ICall, ICallCredentials } from "./call.interface";

interface UseCallOptions {
  onCredentials: (credentials: ICallCredentials) => void;
  onClosed: (call: ICall | null) => void;
}

const useCall = ({ onCredentials, onClosed }: UseCallOptions) => {
  const [isStarting, setIsStarting] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const start = useCallback(
    async (roomId: string) => {
      if (!roomId) {
        notify({
          type: "error",
          message: "Open a conversation first",
          description: "Pick who you want to call, then start the call.",
        });
        return;
      }
      await handleApiAction({
        action: () => CallService.startCall(roomId),
        onSuccess: (result) => {
          if (result?.data) onCredentials(result.data);
        },
        setLoading: setIsStarting,
        errorMessage: "We could not start that call",
      });
    },
    [onCredentials],
  );

  const accept = useCallback(
    async (callId: string) => {
      await handleApiAction({
        action: () => CallService.joinCall(callId),
        onSuccess: (result) => {
          if (result?.data) onCredentials(result.data);
        },
        onError: () => onClosed(null),
        setLoading: setIsAccepting,
        errorMessage: "We could not join that call",
      });
    },
    [onClosed, onCredentials],
  );

  const decline = useCallback(
    async (callId: string) => {
      await handleApiAction({
        action: () => CallService.declineCall(callId),
        onSuccess: (result) => onClosed(result?.data?.call ?? null),
        onError: () => onClosed(null),
        setLoading: setIsClosing,
        errorMessage: "We could not decline that call",
        isToastDisabled: true,
      });
    },
    [onClosed],
  );

  const end = useCallback(
    async (callId: string) => {
      await handleApiAction({
        action: () => CallService.endCall(callId),
        onSuccess: (result) => onClosed(result?.data?.call ?? null),
        onError: () => onClosed(null),
        setLoading: setIsClosing,
        errorMessage: "We could not end that call",
        isToastDisabled: true,
      });
    },
    [onClosed],
  );

  return { start, accept, decline, end, isStarting, isAccepting, isClosing };
};

export default useCall;
