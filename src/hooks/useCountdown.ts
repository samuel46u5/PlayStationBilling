import { useState, useEffect } from "react";

const useCountdown = (
  sessionId: string,
  startTimeMs: number,
  endTimeMs: number | null,
  isPrepaid: boolean,
  onComplete: (() => void) | undefined
) => {
  const [time, setTime] = useState(0); // Time in seconds

  useEffect(() => {
    if (!sessionId) return;

    let intervalId: NodeJS.Timeout | null = null;

    const updateTime = () => {
      const now = Date.now();
      let newTime = 0;

      if (isPrepaid && endTimeMs) {
        // Prepaid: Countdown remaining time
        newTime = Math.max(0, Math.floor((endTimeMs - now) / 1000));
      } else {
        // Pay As You Go: Elapsed time
        newTime = Math.floor((now - startTimeMs) / 1000);
      }

      setTime(newTime);

      if (isPrepaid && newTime <= 0) {
        // Prepaid: Timer is complete
        if (intervalId) clearInterval(intervalId);
        if (typeof onComplete === "function") {
          onComplete();
        }
      }
    };

    // Initial update
    updateTime();

    if (!isPrepaid || (isPrepaid && endTimeMs)) {
      // Set interval for both Pay As You Go and Prepaid (if time is remaining)
      intervalId = setInterval(updateTime, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [sessionId, startTimeMs, endTimeMs, isPrepaid]);

  return time;
};

export default useCountdown;
