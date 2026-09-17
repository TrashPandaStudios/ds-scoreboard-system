import { useCallback, useRef } from 'react';

export function useAudioBuzzer() {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const playBuzzer = useCallback((durationMs: number = 800) => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const duration = durationMs / 1000;

      // Primary tone: 180Hz square wave
      const osc1 = ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(180, now);

      // Secondary tone: 220Hz square wave for resonant dual-horn industrial stadium effect
      const osc2 = ctx.createOscillator();
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(220, now);

      // Overdrive distortion / lowpass filter
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, now);

      // Gain Envelope
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.001, now);
      gainNode.gain.exponentialRampToValueAtTime(0.8, now + 0.03); // punchy attack
      gainNode.gain.setValueAtTime(0.8, now + duration - 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration); // release

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + duration);
      osc2.stop(now + duration);
    } catch (e) {
      console.warn('Web Audio buzzer playback prevented or unsupported:', e);
    }
  }, [getAudioContext]);

  return { playBuzzer };
}
