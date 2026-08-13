import { useState } from "react";
import { handleApiAction } from "@/utils";
import UserService from "@/files/user/user.service";
import { useAuthContext } from "./auth.context";

const useAuth = () => {
  const { profile, updateProfile } = useAuthContext();
  const [isLoadingUpdateLang, setIsLoadingUpdateLang] = useState(false);

  const updatePreferredLang = (preferredLang: string) => {
    if (!profile || profile.preferredLang === preferredLang) return;
    void handleApiAction({
      action: () => UserService.updateMe({ preferredLang }),
      onSuccess: (result) => {
        if (result?.data?.user) updateProfile(result.data.user);
      },
      setLoading: setIsLoadingUpdateLang,
      errorMessage: "We could not update your language",
    });
  };

  return { profile, updatePreferredLang, isLoadingUpdateLang };
};

export default useAuth;
