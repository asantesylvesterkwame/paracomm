import { useState } from "react";
import { UserRoundSearch } from "lucide-react";
import ButtonElement from "@/components/elements/ButtonElement";
import CommandElement from "@/components/elements/CommandElement";
import useUserSearch from "@/files/user/hooks/useUserSearch";
import useRoom from "../useRoom";

const NewChatButton = () => {
  const [open, setOpen] = useState(false);
  const { query, setQuery, results, isLoadingSearch } = useUserSearch();
  const { startConversation } = useRoom();

  const handleSelect = (userId: string) => {
    const user = results.find((item) => item.id === userId);
    if (!user) return;
    setOpen(false);
    setQuery("");
    startConversation(user);
  };

  return (
    <>
      <ButtonElement
        onClick={() => setOpen(true)}
        size="sm"
        className="h-9 gap-2 rounded-xl px-3"
      >
        <UserRoundSearch className="size-4" />
        New chat
      </ButtonElement>
      <CommandElement
        open={open}
        onOpenChange={setOpen}
        value={query}
        onValueChange={setQuery}
        items={results.map((user) => ({
          id: user.id,
          label: user.displayName ?? user.username ?? "User",
          description: user.username ? `@${user.username}` : undefined,
          avatarUrl: user.avatarUrl,
          avatarName: user.displayName ?? user.username,
        }))}
        onSelect={handleSelect}
        placeholder="Search people by name or username"
        emptyText={
          query.trim()
            ? "No one found with that name"
            : "Type a name to find someone"
        }
        isLoading={isLoadingSearch}
      />
    </>
  );
};

export default NewChatButton;
