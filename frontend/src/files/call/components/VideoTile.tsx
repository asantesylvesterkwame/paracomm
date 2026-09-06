import { DailyVideo, useVideoTrack } from "@daily-co/daily-react";
import { MicOff } from "lucide-react";
import AvatarElement from "@/components/elements/AvatarElement";
import { cn } from "@/lib/utils";

interface VideoTileProps {
  sessionId: string | undefined;
  name: string;
  avatarUrl?: string | null;
  isMirrored?: boolean;
  isMuted?: boolean;
  isCompact?: boolean;
  className?: string;
}

const VideoTile = ({
  sessionId,
  name,
  avatarUrl,
  isMirrored,
  isMuted,
  isCompact,
  className,
}: VideoTileProps) => {
  const videoState = useVideoTrack(sessionId ?? "");
  const isCameraOff = !sessionId || videoState.isOff;

  return (
    <div
      className={cn(
        "relative isolate overflow-hidden bg-secondary",
        className,
      )}
    >
      {sessionId && !isCameraOff && (
        <DailyVideo
          automirror={isMirrored}
          sessionId={sessionId}
          type="video"
          fit="cover"
          className="size-full object-cover"
        />
      )}

      {isCameraOff && (
        <div className="flex size-full flex-col items-center justify-center gap-3">
          <AvatarElement
            src={avatarUrl}
            name={name}
            className={isCompact ? "size-10" : "size-20"}
          />
          {!isCompact && (
            <span className="text-sm font-medium text-muted-foreground">
              {name}
            </span>
          )}
        </div>
      )}

      {isMuted && (
        <span
          className={cn(
            "absolute flex items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur",
            isCompact ? "end-1.5 bottom-1.5 size-6" : "end-3 bottom-3 size-8",
          )}
        >
          <MicOff aria-hidden className={isCompact ? "size-3" : "size-4"} />
          <span className="sr-only">{name} is muted</span>
        </span>
      )}
    </div>
  );
};

export default VideoTile;
