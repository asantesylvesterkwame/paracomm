import { Video } from "lucide-react";
import ButtonElement from "@/components/elements/ButtonElement";
import TooltipElement from "@/components/elements/TooltipElement";
import { CALL_COPY } from "@/files/call/call.constants";
import { useCallContext } from "@/files/call/call.context";

interface CallButtonProps {
  roomId: string | undefined;
}

const CallButton = ({ roomId }: CallButtonProps) => {
  const { startCall, isStarting, phase } = useCallContext();

  return (
    <TooltipElement content={CALL_COPY.START}>
      <ButtonElement
        variant="ghost"
        size="icon"
        disabled={!roomId || isStarting || phase !== "idle"}
        isLoading={isStarting}
        onClick={() => roomId && void startCall(roomId)}
        aria-label={CALL_COPY.START}
        className="size-9 rounded-xl text-muted-foreground hover:text-foreground"
      >
        <Video className="size-5" />
      </ButtonElement>
    </TooltipElement>
  );
};

export default CallButton;
