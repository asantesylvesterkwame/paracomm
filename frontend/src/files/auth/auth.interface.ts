import type { IUser } from "@/files/user/user.interface";

export interface AuthContextType {
  profile: IUser | null;
  isProfileNew: boolean;
  isSignedIn: boolean;
  isClerkConfigured: boolean;
  isAuthLoading: boolean;
  isProfileLoading: boolean;
  hasFetched: boolean;
  refetchProfile: () => Promise<void>;
  updateProfile: (changes: Partial<IUser>) => void;
}
