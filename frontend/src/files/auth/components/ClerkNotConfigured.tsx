import { KeyRound } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";

const ClerkNotConfigured = () => (
  <EmptyState
    icon={KeyRound}
    title="Authentication keys not configured"
    description="Add VITE_CLERK_PUBLISHABLE_KEY to frontend/.env.local and CLERK_SECRET_KEY to backend/.dev.vars, then restart the dev servers."
    className="w-full max-w-md"
  />
);

export default ClerkNotConfigured;
