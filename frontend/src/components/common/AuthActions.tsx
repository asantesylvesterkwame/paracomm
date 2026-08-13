import { Link } from "react-router-dom";
import { Show, UserButton } from "@clerk/react";
import { MessageCircle } from "lucide-react";
import ButtonElement from "@/components/elements/ButtonElement";
import { isClerkConfigured } from "@/providers/clerk-provider";
import { ROUTES } from "@/constants/routes.constants";

const AuthActions = () => {
  if (!isClerkConfigured) return null;
  return (
    <div className="flex flex-row items-center gap-3">
      <Show when="signed-in">
        <Link
          to={ROUTES.CHAT}
          aria-label="Open chat"
          className="flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <MessageCircle className="size-5" />
        </Link>
        <UserButton />
      </Show>
      <Show when="signed-out">
        <Link to={ROUTES.SIGN_IN}>
          <ButtonElement className="h-9 rounded-xl px-4">
            Sign in
          </ButtonElement>
        </Link>
      </Show>
    </div>
  );
};

export default AuthActions;
