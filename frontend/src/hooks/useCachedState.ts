import { useEffect, useRef, useState } from "react";
import { cacheRead, cacheWrite } from "@/utils";

export const useCachedState = <T>({
  key,
  value,
  onHydrate,
  transform,
  enabled = true,
}: {
  key: string | null;
  value: T;
  onHydrate: (cached: T) => void;
  transform?: (value: T) => T;
  enabled?: boolean;
}) => {
  const [hydratedKey, setHydratedKey] = useState<string | null>(null);
  const onHydrateRef = useRef(onHydrate);
  const transformRef = useRef(transform);

  useEffect(() => {
    onHydrateRef.current = onHydrate;
    transformRef.current = transform;
  });

  useEffect(() => {
    if (!enabled || !key || hydratedKey === key) return;
    let cancelled = false;
    void cacheRead<T>(key).then((cached) => {
      if (cancelled) return;
      if (cached) onHydrateRef.current(cached);
      setHydratedKey(key);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, hydratedKey, key]);

  useEffect(() => {
    if (!enabled || !key || hydratedKey !== key) return;
    const next = transformRef.current ? transformRef.current(value) : value;
    cacheWrite(key, next);
  }, [enabled, hydratedKey, key, value]);

  return { isHydrated: Boolean(key) && hydratedKey === key };
};

export default useCachedState;
