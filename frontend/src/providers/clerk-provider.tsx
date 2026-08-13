import { ClerkProvider } from "@clerk/react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes.constants";
import type { ReactNode } from "react";

export const isClerkConfigured = Boolean(
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkAppearance = {
  variables: {
    colorPrimary: "var(--primary)",
    colorBackground: "var(--card)",
    colorText: "var(--foreground)",
    colorTextSecondary: "var(--muted-foreground)",
    colorInputBackground: "var(--background)",
    colorInputText: "var(--foreground)",
    colorDanger: "var(--destructive)",
    borderRadius: "var(--radius)",
    fontFamily: "var(--font-sans)",
  },
  elements: {
    card: "border border-border shadow-none",
    formButtonPrimary: "shadow-none",
  },
};

export const ClerkAppProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  if (!isClerkConfigured) {
    return children;
  }
  return (
    <ClerkProvider
      routerPush={(to: string) => navigate(to)}
      routerReplace={(to: string) => navigate(to, { replace: true })}
      signInUrl={ROUTES.SIGN_IN}
      signUpUrl={ROUTES.SIGN_UP}
      afterSignOutUrl={ROUTES.HOME}
      appearance={clerkAppearance}
    >
      {children}
    </ClerkProvider>
  );
};
