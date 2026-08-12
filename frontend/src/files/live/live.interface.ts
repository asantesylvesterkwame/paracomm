export type UtteranceStatus = "pending" | "done" | "failed";

export type SpeechStatus = "idle" | "loading" | "playing" | "failed";

export interface IUtterance {
  id: string;
  sourceText: string;
  translation?: string;
  status: UtteranceStatus;
  speechStatus?: SpeechStatus;
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

export interface ILiveSpeechRequest {
  text: string;
  lang: string;
}

export interface ILiveSpeechData {
  audioBase64: string;
  mimeType: string;
  provider: string;
  lang: string;
}

export interface ILanguageOption {
  code: string;
  label: string;
}
