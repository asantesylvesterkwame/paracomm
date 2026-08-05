export type UtteranceStatus = "pending" | "done" | "failed";

export interface IUtterance {
  id: string;
  sourceText: string;
  translation?: string;
  status: UtteranceStatus;
}

export type LiveStatus =
  | "unsupported"
  | "micDenied"
  | "idle"
  | "listening"
  | "stopped";

export interface ILiveTranslationRequest {
  text: string;
  sourceLang: string;
  targetLang: string;
}

export interface ILiveTranslationData {
  translation: string;
  provider: string;
  sourceLang: string;
  targetLang: string;
  remainingChars: number;
}

export interface ILanguageOption {
  code: string;
  label: string;
}
