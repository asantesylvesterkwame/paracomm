import { Link, Outlet, useMatch } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, MessagesSquare } from "lucide-react";
import Logo from "@/components/common/Logo";
import { ModeToggle } from "@/components/common/ModeToggle";
import EmptyState from "@/components/common/EmptyState";
import ScrollAreaElement from "@/components/elements/ScrollAreaElement";
import SkeletonElement from "@/components/elements/SkeletonElement";
import { SPRING, staggerParent } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes.constants";
import { useAuthContext } from "@/files/auth/auth.context";
import { useRoomContext } from "../room.context";
import RoomListItem from "../components/RoomListItem";
import NewChatButton from "../components/NewChatButton";
import ChatSettingsSheet from "../components/ChatSettingsSheet";

const Chat = () => {
  const roomId = useMatch(ROUTES.CHAT_ROOM)?.params.roomId;
  const { profile } = useAuthContext();
  const { rooms, isLoading, hasFetched } = useRoomContext();
  const hasOpenRoom = Boolean(roomId);

  return (
    <div className="flex h-dvh flex-col bg-background">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl flex-row items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <Link
              to={ROUTES.HOME}
              aria-label="Back to home"
              className="flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <ArrowLeft className="size-5" />
            </Link>
            <Logo />
          </div>
          <div className="flex flex-row items-center gap-2">
            <NewChatButton />
            <ChatSettingsSheet />
            <ModeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 overflow-hidden md:px-6 md:py-4">
        <aside
          className={cn(
            "flex w-full flex-col gap-2 md:w-80 md:shrink-0 md:border-r md:border-border/60 md:pr-4",
            hasOpenRoom && "hidden md:flex",
          )}
        >
          <ScrollAreaElement className="h-full px-3 py-3 md:px-0">
            {isLoading && !hasFetched && (
              <div className="flex flex-col gap-3">
                {[0, 1, 2, 3].map((row) => (
                  <SkeletonElement key={row} className="h-16 rounded-2xl" />
                ))}
              </div>
            )}
            {hasFetched && rooms.length === 0 && (
              <EmptyState
                icon={MessagesSquare}
                title="No conversations yet"
                description="Search for someone with New chat and send the first message."
                className="border-none bg-transparent"
              />
            )}
            <motion.div
              variants={staggerParent()}
              initial="hidden"
              animate="show"
              className="flex flex-col gap-1"
            >
              {rooms.map((room) => (
                <RoomListItem key={room.id} room={room} myUserId={profile?.id} />
              ))}
            </motion.div>
          </ScrollAreaElement>
        </aside>

        <main
          className={cn(
            "min-w-0 flex-1 md:pl-4",
            !hasOpenRoom && "hidden md:block",
          )}
        >
          <AnimatePresence mode="wait">
            {hasOpenRoom ? (
              <Outlet key={roomId} />
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={SPRING.card}
                className="flex h-full items-center justify-center"
              >
                <EmptyState
                  icon={MessagesSquare}
                  title="Pick a conversation"
                  description="Choose a chat on the left or start a new one. Every message arrives in your language."
                  className="max-w-sm border-none bg-transparent"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default Chat;
