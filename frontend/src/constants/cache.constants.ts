export const CACHE_VERSION = "v1";

export const CACHE_NAMESPACE = "paracomm";

export const CACHED_MESSAGES_PER_ROOM = 50;

export const CACHED_ROOMS = 30;

export const CACHE_WRITE_DEBOUNCE_MS = 400;

const scopedKey = (userId: string, suffix: string) =>
  `${CACHE_NAMESPACE}:${CACHE_VERSION}:${userId}:${suffix}`;

export const roomsCacheKey = (userId: string) => scopedKey(userId, "rooms");

export const messagesCacheKey = (userId: string, roomId: string) =>
  scopedKey(userId, `messages:${roomId}`);

export const draftsCacheKey = (userId: string) => scopedKey(userId, "drafts");

export const userCachePrefix = (userId: string) =>
  `${CACHE_NAMESPACE}:${CACHE_VERSION}:${userId}:`;
