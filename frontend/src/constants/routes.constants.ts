export const ROUTES = {
  HOME: "/",
  LIVE: "/live",
  CHAT: "/chat",
  CHAT_ROOM: "/chat/:roomId",
  SIGN_IN: "/sign-in",
  SIGN_UP: "/sign-up",
  STYLES: "/styles",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];

export const chatRoomRoute = (roomId: string) => `/chat/${roomId}`;
