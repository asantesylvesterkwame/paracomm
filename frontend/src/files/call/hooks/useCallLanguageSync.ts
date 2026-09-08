import { useCallback, useEffect, useRef } from "react";
import {
  useAppMessage,
  useDailyEvent,
  useLocalSessionId,
  useMeetingState,
} from "@daily-co/daily-react";
import { createLogger } from "@/utils/logger";
import { LANG_SYNC_DEBOUNCE_MS, LANG_WIRE_KIND } from "../call.constants";
import { isLangWireMessage } from "../call.utils";
import type { ILangWireMessage } from "../call.interface";

interface UseCallLanguageSyncOptions {
  myLang: string;
  onRemoteLang: (lang: string) => void;
}

const logger = createLogger("call-lang-sync");

const useCallLanguageSync = ({
  myLang,
  onRemoteLang,
}: UseCallLanguageSyncOptions) => {
  const localSessionId = useLocalSessionId();
  const meetingState = useMeetingState();
  const seqRef = useRef(0);
  const myLangRef = useRef(myLang);
  const onRemoteLangRef = useRef(onRemoteLang);

  useEffect(() => {
    myLangRef.current = myLang;
  }, [myLang]);

  useEffect(() => {
    onRemoteLangRef.current = onRemoteLang;
  }, [onRemoteLang]);

  const sendAppMessage = useAppMessage<ILangWireMessage>({
    onAppMessage: (event) => {
      if (!isLangWireMessage(event.data)) return;
      if (event.fromId === localSessionId) return;
      logger.log("remote language received", event.data);
      onRemoteLangRef.current(event.data.lang);
    },
  });

  const isJoined = meetingState === "joined-meeting";

  const announce = useCallback(() => {
    if (!isJoined) return;
    seqRef.current += 1;
    const payload: ILangWireMessage = {
      kind: LANG_WIRE_KIND,
      lang: myLangRef.current,
      seq: seqRef.current,
    };
    try {
      sendAppMessage(payload);
      logger.log("language announced", payload);
    } catch (error) {
      logger.warn("language announce failed", error);
    }
  }, [isJoined, sendAppMessage]);

  useDailyEvent("participant-joined", announce);

  useEffect(() => {
    if (!isJoined) return;
    const timer = setTimeout(announce, LANG_SYNC_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [announce, isJoined, myLang]);
};

export default useCallLanguageSync;
