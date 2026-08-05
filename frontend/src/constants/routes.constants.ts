export const ROUTES = {
  HOME: "/",
  LIVE: "/live",
  STYLES: "/styles",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
