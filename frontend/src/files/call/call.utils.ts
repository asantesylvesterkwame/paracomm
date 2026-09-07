import { INPUT_LANGUAGES } from "@/files/live/live.constants";
import { CALL_ENTRY_COPY } from "./call.constants";
import type { CallStatus, ICaptionWireMessage } from "./call.interface";

export const callEntryLabel = (status: CallStatus) =>
  CALL_ENTRY_COPY[status] ?? CALL_ENTRY_COPY.ended;

export const isCaptionSupported = () =>
  typeof window !== "undefined" &&
  ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

export const dictationLocaleOf = (preferredLang: string) => {
  const exact = INPUT_LANGUAGES.find(
    (option) => option.code.split("-")[0] === preferredLang,
  );
  return exact?.code ?? "en-US";
};

export const isCaptionWireMessage = (
  value: unknown,
): value is ICaptionWireMessage => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ICaptionWireMessage>;
  return (
    candidate.kind === "paracomm-caption" &&
    typeof candidate.text === "string" &&
    typeof candidate.lang === "string" &&
    typeof candidate.seq === "number" &&
    (candidate.state === "interim" || candidate.state === "final")
  );
};

export const callElapsedSeconds = (
  answeredAt: string | null,
  endedAt: string | null,
) => {
  if (!answeredAt) return 0;
  const start = new Date(answeredAt).getTime();
  const end = endedAt ? new Date(endedAt).getTime() : Date.now();
  return Math.max(0, Math.round((end - start) / 1000));
};

const PERMISSION_HINT =
  "Check your camera and microphone permissions, then try again.";

export const callJoinErrorDescription = (error: unknown) => {
  if (typeof error === "string" && error.trim()) return error;
  if (error && typeof error === "object") {
    const candidate = error as { errorMsg?: unknown; message?: unknown };
    const text =
      typeof candidate.errorMsg === "string"
        ? candidate.errorMsg
        : typeof candidate.message === "string"
          ? candidate.message
          : "";
    if (/permission|denied|notallowed/i.test(text)) return PERMISSION_HINT;
    if (text.trim()) return text;
  }
  return PERMISSION_HINT;
};
