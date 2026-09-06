import { createStore, get, set, del, keys } from "idb-keyval";
import {
  CACHE_NAMESPACE,
  CACHE_WRITE_DEBOUNCE_MS,
  userCachePrefix,
} from "@/constants/cache.constants";

const store = createStore(CACHE_NAMESPACE, "entities");

const memory = new Map<string, unknown>();
const pending = new Map<string, unknown>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;

const flushPending = () => {
  flushTimer = null;
  const entries = [...pending.entries()];
  pending.clear();
  for (const [key, value] of entries) {
    void set(key, value, store).catch(() => undefined);
  }
};

export const cacheFlush = () => {
  if (flushTimer) clearTimeout(flushTimer);
  flushPending();
};

export const cacheReadSync = <T>(key: string): T | null =>
  (memory.get(key) as T | undefined) ?? null;

export const cacheRead = async <T>(key: string): Promise<T | null> => {
  const cached = memory.get(key);
  if (cached !== undefined) return cached as T;
  try {
    const stored = await get<T>(key, store);
    if (stored === undefined) return null;
    memory.set(key, stored);
    return stored;
  } catch {
    return null;
  }
};

export const cacheWrite = <T>(key: string, value: T) => {
  memory.set(key, value);
  pending.set(key, value);
  if (flushTimer) return;
  flushTimer = setTimeout(flushPending, CACHE_WRITE_DEBOUNCE_MS);
};

export const cacheRemove = (key: string) => {
  memory.delete(key);
  pending.delete(key);
  void del(key, store).catch(() => undefined);
};

export const cacheClearForUser = async (userId: string) => {
  const prefix = userCachePrefix(userId);
  for (const key of [...memory.keys()]) {
    if (key.startsWith(prefix)) memory.delete(key);
    if (pending.has(key)) pending.delete(key);
  }
  try {
    const stored = await keys(store);
    for (const key of stored) {
      if (typeof key === "string" && key.startsWith(prefix)) {
        await del(key, store);
      }
    }
  } catch {
    return;
  }
};

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", cacheFlush);
}
