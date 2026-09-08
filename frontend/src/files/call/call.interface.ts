import type { IUser } from "@/files/user/user.interface";

export type CallStatus =
  | "ringing"
  | "active"
  | "ended"
  | "missed"
  | "declined";

export type CaptionStatus = "pending" | "done" | "failed" | "untranslated";

export interface ICall {
  id: string;
  roomId: string;
  initiatorId: string;
  messageId: string | null;
  status: CallStatus;
  answeredAt: string | null;
  endedAt: string | null;
  expiresAt: string;
  createdAt: string;
}

export interface ICallCredentials {
  call: ICall;
  roomUrl: string;
  token: string;
  otherUser: IUser;
  ringTimeoutSeconds?: number;
}

export interface IRingingPayload {
  call: ICall;
  roomId: string;
  caller: IUser;
  callee: IUser;
}

export interface ICallStatePayload {
  call: ICall;
  roomId: string;
}

export interface ICaptionTranslationRequest {
  text: string;
  sourceLang: string;
  targetLang: string;
}

export interface ICaptionTranslationData {
  translation: string;
  provider: string;
  sourceLang: string;
  targetLang: string;
  remainingChars: number;
}

export interface ICaption {
  id: string;
  sessionId: string;
  isOwn: boolean;
  originalText: string;
  originalLang: string;
  translation: string | null;
  status: CaptionStatus;
  createdAt: number;
}

export interface ICaptionWireMessage {
  kind: "paracomm-caption";
  state: "interim" | "final";
  seq: number;
  text: string;
  lang: string;
}

export interface ILangWireMessage {
  kind: "paracomm-lang";
  lang: string;
  seq: number;
}

export type CallPhase = "idle" | "incoming" | "active";

export interface CallContextType {
  phase: CallPhase;
  call: ICall | null;
  credentials: ICallCredentials | null;
  incoming: IRingingPayload | null;
  otherUser: IUser | null;
  isMinimized: boolean;
  isStarting: boolean;
  isAccepting: boolean;
  isCaptionsOn: boolean;
  isDubbingOn: boolean;
  startCall: (roomId: string) => Promise<void>;
  acceptCall: () => Promise<void>;
  declineCall: () => Promise<void>;
  endCall: () => Promise<void>;
  setIsMinimized: (value: boolean) => void;
  setIsCaptionsOn: (value: boolean) => void;
  setIsDubbingOn: (value: boolean) => void;
  updateOtherUserLang: (lang: string) => void;
}
