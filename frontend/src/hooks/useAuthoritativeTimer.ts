import { useState, useEffect, useRef } from 'react';

interface AuthoritativeTimerProps {
  serverRemainingMs: number;
  totalDurationMs?: number;
  timerRunning: boolean;
}

export function useAuthoritativeTimer({
  serverRemainingMs,
  totalDurationMs = 180000,
  timerRunning,
}: AuthoritativeTimerProps) {
  const [currentMs, setCurrentMs] = useState(serverRemainingMs);
  const syncStateRef = useRef({
    serverMs: serverRemainingMs,
    receiptPerfTime: performance.now(),
    isRunning: timerRunning,
  });

  // Whenever authoritative server ticks arrive (every 100ms), resync baseline anchor
  useEffect(() => {
    syncStateRef.current = {
      serverMs: serverRemainingMs,
      receiptPerfTime: performance.now(),
      isRunning: timerRunning,
    };
    setCurrentMs(serverRemainingMs);
  }, [serverRemainingMs, timerRunning]);

  // requestAnimationFrame local smooth interpolation loop
  useEffect(() => {
    let animFrameId: number;

    const updateFrame = () => {
      const { serverMs, receiptPerfTime, isRunning } = syncStateRef.current;
      if (isRunning) {
        const elapsedSinceSync = performance.now() - receiptPerfTime;
        const remaining = Math.max(0, Math.round(serverMs - elapsedSinceSync));
        setCurrentMs(remaining);
      } else {
        setCurrentMs(serverMs);
      }
      animFrameId = requestAnimationFrame(updateFrame);
    };

    animFrameId = requestAnimationFrame(updateFrame);
    return () => cancelAnimationFrame(animFrameId);
  }, []);

  const totalSeconds = Math.floor(currentMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const tenths = Math.floor((currentMs % 1000) / 100);

  const formattedMinutes = minutes.toString().padStart(2, '0');
  const formattedSeconds = seconds.toString().padStart(2, '0');
  const formattedTime = `${formattedMinutes}:${formattedSeconds}`;
  const formattedWithTenths = `${formattedMinutes}:${formattedSeconds}.${tenths}`;

  const safeTotalDuration = totalDurationMs > 0 ? totalDurationMs : 180000;
  const progressPercent = Math.min(100, Math.max(0, (currentMs / safeTotalDuration) * 100));

  return {
    currentMs,
    minutes,
    seconds,
    tenths,
    formattedMinutes,
    formattedSeconds,
    formattedTime,
    formattedWithTenths,
    progressPercent,
    isZero: currentMs <= 0,
  };
}
