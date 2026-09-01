import { TEMP_ID_PREFIX } from "./message.constants";
import type {
  ClientMessageError,
  IClientMessage,
  IMessage,
  IRoomMessagesState,
} from "./message.interface";

export const EMPTY_ROOM_MESSAGES: IRoomMessagesState = {
  items: [],
  nextCursor: null,
  hasFetched: false,
  isLoading: false,
  isRevalidating: false,
  isLoadingMore: false,
  isHydrated: false,
};

export const isTempMessage = (id: string) => id.startsWith(TEMP_ID_PREFIX);

export const tempIdOf = (clientId: string) => `${TEMP_ID_PREFIX}${clientId}`;

export const sortByCreatedAt = (items: IClientMessage[]) =>
  [...items].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

const confirmed = (
  message: IMessage,
  previous?: IClientMessage,
): IClientMessage => ({
  ...(previous ?? {}),
  ...message,
  clientStatus: undefined,
  clientError: undefined,
});

export const mergeMessages = (
  server: IMessage[],
  local: IClientMessage[],
): IClientMessage[] => {
  const reconciledClientIds = new Set(
    server.map((item) => item.clientId).filter(Boolean),
  );
  const byId = new Map<string, IClientMessage>();
  for (const item of local) {
    if (isTempMessage(item.id) && item.clientId) {
      if (reconciledClientIds.has(item.clientId)) continue;
    }
    byId.set(item.id, item);
  }
  for (const item of server) {
    byId.set(item.id, confirmed(item, byId.get(item.id)));
  }
  return sortByCreatedAt([...byId.values()]);
};

const newerOf = (a: IClientMessage, b: IClientMessage) =>
  new Date(b.updatedAt).getTime() >= new Date(a.updatedAt).getTime() ? b : a;

export const mergeCachedMessages = (
  cached: IClientMessage[],
  current: IClientMessage[],
): IClientMessage[] => {
  const confirmedClientIds = new Set(
    current
      .filter((item) => !isTempMessage(item.id))
      .map((item) => item.clientId)
      .filter(Boolean),
  );
  const byId = new Map<string, IClientMessage>();
  for (const item of cached) {
    if (isTempMessage(item.id) && item.clientId) {
      if (confirmedClientIds.has(item.clientId)) continue;
    }
    byId.set(item.id, item);
  }
  for (const item of current) {
    const previous = byId.get(item.id);
    byId.set(item.id, previous ? newerOf(previous, item) : item);
  }
  return sortByCreatedAt([...byId.values()]);
};

export const reconcileMessageInto = (
  items: IClientMessage[],
  message: IMessage,
  replaceId?: string,
): IClientMessage[] => {
  const droppedIds = new Set<string>();
  if (replaceId) droppedIds.add(replaceId);
  if (message.clientId) {
    for (const item of items) {
      if (isTempMessage(item.id) && item.clientId === message.clientId) {
        droppedIds.add(item.id);
      }
    }
  }
  const previous = items.find((item) => item.id === message.id);
  const kept = items.filter(
    (item) => !droppedIds.has(item.id) && item.id !== message.id,
  );
  return sortByCreatedAt([...kept, confirmed(message, previous)]);
};

export const upsertMessageInto = (
  items: IClientMessage[],
  message: IClientMessage,
): IClientMessage[] => {
  const exists = items.some((item) => item.id === message.id);
  const next = exists
    ? items.map((item) =>
        item.id === message.id ? { ...item, ...message } : item,
      )
    : [...items, message];
  return sortByCreatedAt(next);
};

export const capMessages = (items: IClientMessage[], limit: number) =>
  items.length <= limit ? items : items.slice(items.length - limit);

export const pendingMessagesOf = (items: IClientMessage[]) =>
  items.filter((item) => item.clientStatus === "sending");

export const failedMessagesOf = (items: IClientMessage[]) =>
  items.filter((item) => item.clientStatus === "failed");

export const isSeenMessage = (
  message: IClientMessage,
  lastSeenMessageId: string | null,
  lastSeenAt: string | null,
) => {
  if (message.clientStatus) return false;
  if (lastSeenMessageId === message.id) return true;
  if (!lastSeenAt) return false;
  return new Date(message.createdAt).getTime() <= new Date(lastSeenAt).getTime();
};

export const classifySendError = (error: unknown): ClientMessageError => {
  const candidate = error as {
    response?: { status?: number };
    code?: string;
    request?: unknown;
  };
  const status = candidate?.response?.status;
  if (status === 429) return "rate";
  if (!status && (candidate?.request || candidate?.code)) return "network";
  if (status && status >= 500) return "network";
  return "fatal";
};
