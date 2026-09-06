import {
  AudioLines,
  Captions,
  Mic,
  MicOff,
  PhoneOff,
  Video,
  VideoOff,
} from "lucide-react";
import ButtonElement from "@/components/elements/ButtonElement";
import ToggleElement from "@/components/elements/ToggleElement";
import { CALL_COPY } from "../call.constants";

interface CallControlsProps {
  isMicMuted: boolean;
  isCameraOff: boolean;
  isCaptionsOn: boolean;
  isCaptionsSupported: boolean;
  isDubbingOn: boolean;
  dubbingUnavailableReason: string | null;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleCaptions: (value: boolean) => void;
  onToggleDubbing: (value: boolean) => void;
  onLeave: () => void;
}

const CallControls = ({
  isMicMuted,
  isCameraOff,
  isCaptionsOn,
  isCaptionsSupported,
  isDubbingOn,
  dubbingUnavailableReason,
  onToggleMic,
  onToggleCamera,
  onToggleCaptions,
  onToggleDubbing,
  onLeave,
}: CallControlsProps) => {
  return (
    <div className="flex items-center gap-1.5 rounded-4xl bg-background/70 p-1.5 ring-1 ring-border backdrop-blur-xl sm:gap-2 sm:p-2">
      <ToggleElement
        pressed={isMicMuted}
        onPressedChange={onToggleMic}
        variant={isMicMuted ? "danger" : "surface"}
        label={isMicMuted ? CALL_COPY.UNMUTE : CALL_COPY.MUTE}
      >
        {isMicMuted ? <MicOff /> : <Mic />}
      </ToggleElement>

      <ToggleElement
        pressed={isCameraOff}
        onPressedChange={onToggleCamera}
        variant={isCameraOff ? "danger" : "surface"}
        label={isCameraOff ? CALL_COPY.CAMERA_ON : CALL_COPY.CAMERA_OFF}
      >
        {isCameraOff ? <VideoOff /> : <Video />}
      </ToggleElement>

      <ToggleElement
        pressed={isCaptionsOn}
        onPressedChange={onToggleCaptions}
        disabled={!isCaptionsSupported}
        label={isCaptionsOn ? CALL_COPY.CAPTIONS_OFF : CALL_COPY.CAPTIONS_ON}
      >
        <Captions />
      </ToggleElement>

      <ToggleElement
        pressed={isDubbingOn}
        onPressedChange={onToggleDubbing}
        disabled={Boolean(dubbingUnavailableReason)}
        label={
          dubbingUnavailableReason ??
          (isDubbingOn ? CALL_COPY.DUBBING_OFF : CALL_COPY.DUBBING_ON)
        }
      >
        <AudioLines />
      </ToggleElement>

      <ButtonElement
        variant="destructive"
        onClick={onLeave}
        aria-label={CALL_COPY.HANG_UP}
        className="ms-1 h-12 gap-2 rounded-4xl px-3.5 sm:px-5"
      >
        <PhoneOff className="size-5" />
        <span className="hidden sm:inline">{CALL_COPY.HANG_UP}</span>
      </ButtonElement>
    </div>
  );
};

export default CallControls;
