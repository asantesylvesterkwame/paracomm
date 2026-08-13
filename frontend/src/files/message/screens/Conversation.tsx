import { useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, MessagesSquare } from "lucide-react";
import {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
} from "@/components/ui/message-scroller";
import AvatarElement from "@/components/elements/AvatarElement";
import BadgeElement from "@/components/elements/BadgeElement";
import ButtonElement from "@/components/elements/ButtonElement";
import LoadingElement from "@/components/elements/LoadingElement";
import EmptyState from "@/components/common/EmptyState";
import { SPRING } from "@/lib/motion";
import { ROUTES } from "@/constants/routes.constants";
import { languageLabelOf } from "@/constants/languages.constants";
import { useAuthContext } from "@/files/auth/auth.context";
import { useRoomContext } from "@/files/room/room.context";
import { useMessageContext } from "../message.context";
import useMessage from "../useMessage";
import MessageBubble from "../components/MessageBubble";
import MessageComposer from "../components/MessageComposer";
import TypingIndicator from "../components/TypingIndicator";

const Conversation = () => {
  const { roomId } = useParams();
  const { profile } = useAuthContext();
  const { rooms, setActiveRoomId } = useRoomContext();
  const {
    messages,
    isLoading,
    hasFetched,
    isLoadingMore,
    nextCursor,
    typingUserIds,
    loadOlder,
  } = useMessageContext();
  const {
    draft,
    setDraft,
    send,
    retrySend,
    retryTranslation,
    markSeen,
    emitTyping,
    stopTyping,
    isSending,
  } = useMessage();

  const room = useMemo(
    () => rooms.find((item) => item.id === roomId) ?? null,
    [rooms, roomId],
  );

  useEffect(() => {
    setActiveRoomId(roomId ?? null);
    return () => setActiveRoomId(null);
  }, [roomId, setActiveRoomId]);

  const latestIncoming = useMemo(
    () =>
      [...messages]
        .reverse()
        .find((item) => item.senderId !== profile?.id && !item.clientStatus),
    [messages, profile?.id],
  );

  useEffect(() => {
    if (latestIncoming) markSeen(latestIncoming.id);
  }, [latestIncoming, markSeen]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={SPRING.card}
      className="flex h-full min-h-0 flex-col"
    >
      <header className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
        <Link
          to={ROUTES.CHAT}
          aria-label="Back to conversations"
          className="flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground md:hidden"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <AvatarElement
          src={room?.otherUser.avatarUrl}
          name={room?.otherUser.displayName ?? room?.otherUser.username}
        />
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-medium">
            {room?.otherUser.displayName ??
              room?.otherUser.username ??
              "Conversation"}
          </span>
          {room && (
            <span className="text-xs text-muted-foreground">
              Reads {languageLabelOf(room.otherUser.preferredLang)}
            </span>
          )}
        </div>
        {room && (
          <BadgeElement variant="secondary" className="ml-auto">
            Auto translated
          </BadgeElement>
        )}
      </header>

      <MessageScrollerProvider>
        <MessageScroller className="flex-1">
          <MessageScrollerViewport>
            <MessageScrollerContent className="gap-3 px-4 py-4">
              {nextCursor && (
                <div className="flex justify-center">
                  <ButtonElement
                    variant="ghost"
                    size="sm"
                    onClick={() => void loadOlder()}
                    isLoading={isLoadingMore}
                    className="h-8 rounded-xl px-3 text-xs"
                  >
                    Load earlier messages
                  </ButtonElement>
                </div>
              )}
              {isLoading && !hasFetched && (
                <div className="flex flex-1 items-center justify-center py-16">
                  <LoadingElement />
                </div>
              )}
              {hasFetched && messages.length === 0 && (
                <EmptyState
                  icon={MessagesSquare}
                  title="Say hello"
                  description="Messages are translated into each person's language automatically."
                  className="border-none bg-transparent py-16"
                />
              )}
              {messages.map((message) => (
                <MessageScrollerItem key={message.id}>
                  <MessageBubble
                    message={message}
                    isOwn={message.senderId === profile?.id}
                    onRetrySend={retrySend}
                    onRetryTranslation={retryTranslation}
                  />
                </MessageScrollerItem>
              ))}
              <AnimatePresence>
                {typingUserIds.length > 0 && room && (
                  <TypingIndicator
                    name={
                      room.otherUser.displayName ??
                      room.otherUser.username ??
                      "Someone"
                    }
                  />
                )}
              </AnimatePresence>
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </MessageScrollerProvider>

      <MessageComposer
        draft={draft}
        setDraft={setDraft}
        onSend={send}
        onTyping={emitTyping}
        onStopTyping={stopTyping}
        isSending={isSending}
      />
    </motion.div>
  );
};

export default Conversation;
