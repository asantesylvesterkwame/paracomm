import { Navigate, Outlet, useLocation } from "react-router-dom";
import LoadingElement from "@/components/elements/LoadingElement";
import { ROUTES } from "@/constants/routes.constants";
import { useAuthContext } from "../auth.context";
import ClerkNotConfigured from "./ClerkNotConfigured";

const RequireAuth = () => {
  const { isSignedIn, isAuthLoading, isClerkConfigured } = useAuthContext();
  const location = useLocation();

  if (!isClerkConfigured) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background px-6">
        <ClerkNotConfigured />
      </div>
    );
  }

  if (isAuthLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <LoadingElement className="size-8" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <Navigate to={ROUTES.SIGN_IN} replace state={{ from: location }} />
    );
  }

  return <Outlet />;
};

export default RequireAuth;
