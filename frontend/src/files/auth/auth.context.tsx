import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth as useClerkAuth } from "@clerk/react";
import { registerAuthTokenGetter } from "@/api";
import { cacheClearForUser, notify } from "@/utils";
import { isClerkConfigured } from "@/providers/clerk-provider";
import UserService from "@/files/user/user.service";
import type { IUser } from "@/files/user/user.interface";
import type { AuthContextType } from "./auth.interface";
import type { ReactNode } from "react";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const signedOutValue: AuthContextType = {
  profile: null,
  identityId: null,
  isProfileNew: false,
  isSignedIn: false,
  isClerkConfigured,
  isAuthLoading: false,
  isProfileLoading: false,
  hasFetched: true,
  refetchProfile: async () => {},
  updateProfile: () => {},
};

const ClerkAuthBridge = ({ children }: { children: ReactNode }) => {
  const { isLoaded, isSignedIn, getToken, userId } = useClerkAuth();
  const [profile, setProfile] = useState<IUser | null>(null);
  const [isProfileNew, setIsProfileNew] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const lastIdentityRef = useRef<string | null>(null);

  useEffect(() => {
    if (userId) lastIdentityRef.current = userId;
  }, [userId]);

  useLayoutEffect(() => {
    if (!isSignedIn) {
      registerAuthTokenGetter(null);
      return;
    }
    registerAuthTokenGetter(() => getToken());
  }, [getToken, isSignedIn]);

  const refetchProfile = useCallback(async () => {
    setIsProfileLoading(true);
    let loaded = false;
    for (let attempt = 0; attempt < 2 && !loaded; attempt += 1) {
      try {
        if (attempt > 0) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
        const result = await UserService.getMe();
        if (result?.data?.user) {
          setProfile(result.data.user);
          setIsProfileNew(Boolean(result.data.isNew));
          loaded = true;
        }
      } catch {
        loaded = false;
      }
    }
    if (!loaded) {
      setProfile(null);
      notify({
        type: "error",
        message: "We could not load your profile",
        description: "Chat needs your profile. Refresh the page to try again.",
      });
    }
    setIsProfileLoading(false);
    setHasFetched(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) {
      void refetchProfile();
      return;
    }
    setProfile(null);
    if (lastIdentityRef.current) {
      void cacheClearForUser(lastIdentityRef.current);
      lastIdentityRef.current = null;
    }
    setIsProfileNew(false);
    setHasFetched(true);
  }, [isLoaded, isSignedIn, refetchProfile]);

  const updateProfile = useCallback((changes: Partial<IUser>) => {
    setProfile((previous) =>
      previous ? { ...previous, ...changes } : previous,
    );
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      profile,
      identityId: userId ?? null,
      isProfileNew,
      isSignedIn: Boolean(isSignedIn),
      isClerkConfigured,
      isAuthLoading: !isLoaded,
      isProfileLoading,
      hasFetched,
      refetchProfile,
      updateProfile,
    }),
    [
      profile,
      userId,
      isProfileNew,
      isSignedIn,
      isLoaded,
      isProfileLoading,
      hasFetched,
      refetchProfile,
      updateProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  if (!isClerkConfigured) {
    return (
      <AuthContext.Provider value={signedOutValue}>
        {children}
      </AuthContext.Provider>
    );
  }
  return <ClerkAuthBridge>{children}</ClerkAuthBridge>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};
