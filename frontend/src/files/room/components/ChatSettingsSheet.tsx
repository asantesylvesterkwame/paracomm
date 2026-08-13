import { useState } from "react";
import { Settings2 } from "lucide-react";
import ButtonElement from "@/components/elements/ButtonElement";
import SheetElement from "@/components/elements/SheetElement";
import SelectElement from "@/components/elements/SelectElement";
import useAuth from "@/files/auth/useAuth";
import { PREFERRED_LANGUAGES } from "@/constants/languages.constants";

const ChatSettingsSheet = () => {
  const [open, setOpen] = useState(false);
  const { profile, updatePreferredLang, isLoadingUpdateLang } = useAuth();

  return (
    <>
      <ButtonElement
        variant="ghost"
        size="icon"
        aria-label="Chat settings"
        onClick={() => setOpen(true)}
        isLoading={isLoadingUpdateLang}
        className="size-9 rounded-xl"
      >
        <Settings2 className="size-5" />
      </ButtonElement>
      <SheetElement
        open={open}
        onOpenChange={setOpen}
        title="Chat settings"
        description="Messages you receive are translated into your language."
        side="right"
      >
        <div className="flex flex-col gap-4 px-1 py-2">
          <SelectElement
            label="Your language"
            placeholder="Pick your language"
            items={PREFERRED_LANGUAGES.map((language) => ({
              value: language.code,
              label: language.label,
            }))}
            value={profile?.preferredLang}
            onValueChange={updatePreferredLang}
            disabled={isLoadingUpdateLang}
          />
        </div>
      </SheetElement>
    </>
  );
};

export default ChatSettingsSheet;
