export type DubbingState =
  | "off"
  | "connecting"
  | "listening"
  | "speaking"
  | "reconnecting"
  | "limited"
  | "unavailable";

export interface IDubbingSessionRequest {
  targetLang: string;
}

export interface IDubbingSessionData {
  token: string;
  expiresAt: string;
  model: string;
  provider: string;
  targetLang: string;
  sessionSeconds: number;
  remainingSeconds: number;
}

export interface IDubbingLine {
  id: string;
  original: string;
  translation: string;
  isFinal: boolean;
}

export interface IDubbingResult {
  state: DubbingState;
  lines: IDubbingLine[];
  current: IDubbingLine | null;
  isSpeaking: boolean;
  isSpeakingRef: React.RefObject<boolean>;
  unavailableReason: string | null;
}
