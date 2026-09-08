import { useCallback, useEffect, useRef, useState } from "react";
import { handleApiAction, notify } from "@/utils";
import { createLogger, describeError } from "@/utils/logger";
import useVoiceRecorder, { type RecorderError } from "@/hooks/useVoiceRecorder";
import { useMessageContext } from "../message.context";
import VoiceNoteService from "./voice-note.service";
import {
  MAX_VOICE_NOTE_MS,
  MIN_VOICE_NOTE_MS,
  VOICE_COPY,
} from "./voice-note.constants";
import { prepareRecording } from "./voice-note.utils";
import type {
  IDubRequestTarget,
  IRecording,
  IVoiceRecorderControls,
} from "./voice-note.interface";

interface UseVoiceNoteOptions {
  roomId?: string;
  onRecording: (recording: IRecording) => void;
}

const logger = createLogger("voice-note");

const RECORDER_ERROR_COPY: Record<RecorderError, string> = {
  unsupported: VOICE_COPY.UNSUPPORTED,
  permission: VOICE_COPY.PERMISSION_DENIED,
  too_short: VOICE_COPY.TOO_SHORT,
  failed: VOICE_COPY.RECORDING_FAILED,
};

const useVoiceNote = ({ roomId, onRecording }: UseVoiceNoteOptions) => {
  const { reconcileMessage } = useMessageContext();
  const [requestingDubFor, setRequestingDubFor] =
    useState<IDubRequestTarget | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const onRecordingRef = useRef(onRecording);

  useEffect(() => {
    onRecordingRef.current = onRecording;
  }, [onRecording]);

  const handleComplete = useCallback(async (recording: IRecording) => {
    setIsPreparing(true);
    try {
      const prepared = await prepareRecording(recording);
      onRecordingRef.current(prepared);
    } catch (error) {
      logger.error("recording could not be prepared", describeError(error));
      notify({ type: "error", message: VOICE_COPY.RECORDING_FAILED });
    } finally {
      setIsPreparing(false);
    }
  }, []);

  const handleError = useCallback((reason: RecorderError) => {
    notify({
      type: reason === "too_short" ? "info" : "error",
      message: RECORDER_ERROR_COPY[reason],
    });
  }, []);

  const recorderState = useVoiceRecorder({
    maxDurationMs: MAX_VOICE_NOTE_MS,
    minDurationMs: MIN_VOICE_NOTE_MS,
    onComplete: handleComplete,
    onError: handleError,
  });

  const recorder: IVoiceRecorderControls = {
    ...recorderState,
    status:
      isPreparing && recorderState.status === "idle"
        ? "stopping"
        : recorderState.status,
  };

  const requestDub = useCallback(
    (messageId: string, lang: string) => {
      if (!roomId) return;
      setRequestingDubFor({ messageId, lang });
      void handleApiAction({
        action: () => VoiceNoteService.requestDub(roomId, messageId, { lang }),
        onSuccess: (result) => {
          if (result?.data) reconcileMessage(roomId, result.data);
        },
        setLoading: (isLoading) => {
          if (!isLoading) setRequestingDubFor(null);
        },
        errorMessage: VOICE_COPY.DUB_FAILED,
      });
    },
    [reconcileMessage, roomId],
  );

  return { recorder, requestDub, requestingDubFor };
};

export default useVoiceNote;
