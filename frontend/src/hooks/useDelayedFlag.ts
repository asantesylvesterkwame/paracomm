import { useEffect, useState } from "react";

const useDelayedFlag = (isActive: boolean, delayMs: number) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setIsVisible(false);
      return;
    }
    const timer = setTimeout(() => setIsVisible(true), delayMs);
    return () => clearTimeout(timer);
  }, [isActive, delayMs]);

  return isVisible;
};

export default useDelayedFlag;
