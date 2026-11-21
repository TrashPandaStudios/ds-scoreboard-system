import { useState, useEffect, useRef } from 'react';
import { MatchPhase } from '../types/scoreboard';

interface AuthoritativeTimerProps {
  serverRemainingMs: number;
  totalDurationMs?: number;
  timerRunning: boolean;
  phase?: MatchPhase;
}

const DRIFT_SNAP_THRESHOLD_MS = 150;

export function useAuthoritativeTimer({
  serverRemainingMs,
  totalDurationMs = 180000,
  timerRunning,
  phase,
}: AuthoritativeTimerProps) {
  const [currentMs, setCurrentMs] = useState(serverRemainingMs);
  const isCountUp = phase === 'SUDDEN_DEATH';

  const syncStateRef = useRef({
    serverMs: serverRemainingMs,
    receiptPerfTime: performance.now(),
    isRunning: timerRunning,
    isCountUp,
  });

  // Re-anchor smoothly when server mutations or periodic heartbeats arrive
  useEffect(() => {
    const now = performance.now();
    const prev = syncStateRef.current;

    if (timerRunning && prev.isRunning && prev.isCountUp === isCountUp) {
      const elapsed = now - prev.receiptPerfTime;
      const predictedLocal = isCountUp
        ? prev.serverMs + elapsed
        : Math.max(0, prev.serverMs - elapsed);

      // Avoid visual micro-jitter on routine 2s heartbeats when local interpolation is already tight;
      // snap immediately on larger drift or explicit referee adjustments (+/-10s, reset, exact set).
      if (Math.abs(predictedLocal - serverRemainingMs) <= DRIFT_SNAP_THRESHOLD_MS) {
        return;
      }
    }

    syncStateRef.current = {
      serverMs: serverRemainingMs,
      receiptPerfTime: now,
      isRunning: timerRunning,
      isCountUp,
    };
    setCurrentMs(serverRemainingMs);
  }, [serverRemainingMs, timerRunning, isCountUp]);

  // Run requestAnimationFrame ONLY while timer is actively running, and bucket React updates
  // to 50ms intervals (20Hz) so mobile phones & low-power displays stay silky-smooth without CPU burn.
  useEffect(() => {
    if (!timerRunning) {
      setCurrentMs(syncStateRef.current.serverMs);
      return;
    }

    let animFrameId: number;
    let lastEmittedBucket = -1;

    const updateFrame = () => {
      const { serverMs, receiptPerfTime, isRunning, isCountUp: countUp } = syncStateRef.current;
      if (!isRunning) {
        setCurrentMs(serverMs);
        return;
      }

      const elapsedSinceSync = performance.now() - receiptPerfTime;
      const computed = countUp
        ? Math.max(0, Math.round(serverMs + elapsedSinceSync))
        : Math.max(0, Math.round(serverMs - elapsedSinceSync));

      const bucket = Math.floor(computed / 50);
      if (bucket !== lastEmittedBucket) {
        lastEmittedBucket = bucket;
        setCurrentMs(computed);
      }

      animFrameId = requestAnimationFrame(updateFrame);
    };

    animFrameId = requestAnimationFrame(updateFrame);
    return () => cancelAnimationFrame(animFrameId);
  }, [timerRunning, isCountUp]);

  const totalSeconds = Math.floor(currentMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const tenths = Math.floor((currentMs % 1000) / 100);

  const formattedMinutes = minutes.toString().padStart(2, '0');
  const formattedSeconds = seconds.toString().padStart(2, '0');
  const formattedTime = `${formattedMinutes}:${formattedSeconds}`;
  const formattedWithTenths = `${formattedMinutes}:${formattedSeconds}.${tenths}`;

  const safeTotalDuration = totalDurationMs > 0 ? totalDurationMs : 180000;
  const progressPercent = isCountUp
    ? 100
    : Math.min(100, Math.max(0, (currentMs / safeTotalDuration) * 100));

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
    isZero: !isCountUp && currentMs <= 0,
  };
}
