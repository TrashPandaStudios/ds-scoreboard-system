import React, { useState } from 'react';
import { TabularTimer } from '../common/TabularTimer';
import { MatchPhase } from '../../types/scoreboard';
import { Play, Pause, RotateCcw, Plus, Minus, Volume2, Zap, Clock, ShieldAlert, Coffee, Settings } from 'lucide-react';

interface TimerControlBarProps {
  timeRemainingMs: number;
  totalDurationMs: number;
  intermissionDurationMs?: number;
  timerRunning: boolean;
  phase: MatchPhase;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  onAdjustTimer: (seconds: number) => void;
  onSetExactMs: (exactMs: number) => void;
  onStartCountdown: () => void;
  onStartTimeout: () => void;
  onStartIntermission?: () => void;
  onOpenIntermissionConfig?: () => void;
  onSetPenaltyPhase: () => void;
  onTriggerBuzzer: () => void;
}

export const TimerControlBar: React.FC<TimerControlBarProps> = ({
  timeRemainingMs,
  totalDurationMs,
  intermissionDurationMs = 90000,
  timerRunning,
  phase,
  onToggleTimer,
  onResetTimer,
  onAdjustTimer,
  onSetExactMs,
  onStartCountdown,
  onStartTimeout,
  onStartIntermission,
  onOpenIntermissionConfig,
  onSetPenaltyPhase,
  onTriggerBuzzer,
}) => {
  const [customMinutes, setCustomMinutes] = useState('');
  const [customSeconds, setCustomSeconds] = useState('');

  const handleApplyCustomTime = (e: React.FormEvent) => {
    e.preventDefault();
    const mins = parseInt(customMinutes, 10) || 0;
    const secs = parseInt(customSeconds, 10) || 0;
    const totalMs = (mins * 60 + secs) * 1000;
    if (totalMs >= 0) {
      onSetExactMs(totalMs);
      setCustomMinutes('');
      setCustomSeconds('');
    }
  };

  return (
    <div className="flex flex-col gap-5 p-6 rounded-2xl bg-[var(--court-surface)] border border-[var(--court-line)]">
      {/* Authoritative Timer Display */}
      <TabularTimer
        serverRemainingMs={timeRemainingMs}
        totalDurationMs={totalDurationMs}
        timerRunning={timerRunning}
        phase={phase}
        size="lg"
        showProgressBar={true}
      />

      {/* Primary Play/Pause & Buzzer Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={onToggleTimer}
          className="md:col-span-2 h-16 sm:h-20 rounded-xl flex items-center justify-center gap-3 font-extrabold text-xl sm:text-2xl text-white transition-opacity hover:opacity-95 active:scale-[0.99]"
          style={{
            backgroundColor: timerRunning ? 'var(--signal-amber-solid)' : 'var(--signal-live-solid)',
          }}
        >
          {timerRunning ? (
            <>
              <Pause className="w-7 h-7 fill-current" />
              <span>Pause clock</span>
              <span className="text-xs font-mono opacity-85 px-2 py-0.5 rounded bg-black/20">Space</span>
            </>
          ) : (
            <>
              <Play className="w-7 h-7 fill-current" />
              <span>Start clock</span>
              <span className="text-xs font-mono opacity-85 px-2 py-0.5 rounded bg-black/20">Space</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onTriggerBuzzer}
          className="h-16 sm:h-20 rounded-xl flex items-center justify-center gap-3 font-extrabold text-lg text-white transition-opacity hover:opacity-95 active:scale-[0.99]"
          style={{ backgroundColor: 'var(--drone-red-solid)' }}
        >
          <Volume2 className="w-6 h-6" />
          <span>Fire buzzer</span>
          <span className="text-xs font-mono opacity-85 px-2 py-0.5 rounded bg-black/20">B</span>
        </button>
      </div>

      {/* Quick Timer Adjustments & Presets */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-4 border-t border-[var(--court-line-soft)]">
        <button
          type="button"
          onClick={() => onAdjustTimer(10)}
          className="px-3 py-2 rounded-lg bg-[var(--court-control-bg)] hover:bg-[var(--court-control-hover)] text-[var(--court-ink)] text-xs font-semibold inline-flex items-center justify-center gap-1 border border-[var(--court-line)] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" style={{ color: 'var(--signal-live)' }} />
          <span>10 sec</span>
        </button>

        <button
          type="button"
          onClick={() => onAdjustTimer(-10)}
          className="px-3 py-2 rounded-lg bg-[var(--court-control-bg)] hover:bg-[var(--court-control-hover)] text-[var(--court-ink)] text-xs font-semibold inline-flex items-center justify-center gap-1 border border-[var(--court-line)] transition-colors"
        >
          <Minus className="w-3.5 h-3.5" style={{ color: 'var(--drone-red)' }} />
          <span>10 sec</span>
        </button>

        <button
          type="button"
          onClick={onResetTimer}
          className="px-3 py-2 rounded-lg bg-[var(--court-control-bg)] hover:bg-[var(--court-control-hover)] text-[var(--court-ink)] text-xs font-semibold inline-flex items-center justify-center gap-1 border border-[var(--court-line)] transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5 text-[var(--court-accent-link)]" />
          <span>Reset 03:00</span>
        </button>

        <button
          type="button"
          onClick={onStartCountdown}
          className="px-3 py-2 rounded-lg bg-[var(--court-control-bg)] hover:bg-[var(--court-control-hover)] text-[var(--court-ink)] text-xs font-semibold inline-flex items-center justify-center gap-1 border border-[var(--court-line)] transition-colors"
        >
          <Zap className="w-3.5 h-3.5" style={{ color: 'var(--signal-amber)' }} />
          <span>5s countdown</span>
        </button>

        <button
          type="button"
          onClick={onStartTimeout}
          className="px-3 py-2 rounded-lg bg-[var(--court-control-bg)] hover:bg-[var(--court-control-hover)] text-[var(--court-ink)] text-xs font-semibold inline-flex items-center justify-center gap-1 border border-[var(--court-line)] transition-colors"
        >
          <Clock className="w-3.5 h-3.5" style={{ color: 'var(--signal-info)' }} />
          <span>Timeout 1:00</span>
        </button>

        <button
          type="button"
          onClick={onSetPenaltyPhase}
          className="px-3 py-2 rounded-lg border text-xs font-semibold inline-flex items-center justify-center gap-1 transition-colors"
          style={{
            backgroundColor: 'var(--signal-amber-tint)',
            borderColor: 'var(--signal-amber-border)',
            color: 'var(--signal-amber-text)',
          }}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Penalty 0:30</span>
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onStartIntermission}
            className="flex-1 px-2.5 py-2 rounded-lg border text-xs font-semibold inline-flex items-center justify-center gap-1 transition-colors"
            style={{
              backgroundColor: 'var(--signal-intermission-tint)',
              borderColor: 'var(--signal-intermission-border)',
              color: 'var(--signal-intermission-text)',
            }}
            title="Start intermission break"
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>Break ({Math.round(intermissionDurationMs / 1000)}s)</span>
          </button>
          {onOpenIntermissionConfig && (
            <button
              type="button"
              onClick={onOpenIntermissionConfig}
              className="p-2 rounded-lg bg-[var(--court-control-bg)] hover:bg-[var(--court-control-hover)] text-[var(--court-muted)] hover:text-[var(--court-ink)] border border-[var(--court-line)] transition-colors"
              title="Configure break duration"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Exact Override Input */}
      <form
        onSubmit={handleApplyCustomTime}
        className="flex flex-wrap items-center gap-2 pt-4 border-t border-[var(--court-line-soft)] text-xs"
      >
        <span className="text-[var(--court-muted)] font-semibold">Set exact time:</span>
        <input
          type="number"
          placeholder="Min"
          min="0"
          max="59"
          value={customMinutes}
          onChange={(e) => setCustomMinutes(e.target.value)}
          className="w-16 px-2.5 py-1.5 rounded-lg bg-[var(--court-subtle)] border border-[var(--court-line)] text-[var(--court-ink)] text-center tabular-nums"
        />
        <span className="text-[var(--court-muted)] font-bold">:</span>
        <input
          type="number"
          placeholder="Sec"
          min="0"
          max="59"
          value={customSeconds}
          onChange={(e) => setCustomSeconds(e.target.value)}
          className="w-16 px-2.5 py-1.5 rounded-lg bg-[var(--court-subtle)] border border-[var(--court-line)] text-[var(--court-ink)] text-center tabular-nums"
        />
        <button
          type="submit"
          className="px-3.5 py-1.5 rounded-lg text-white font-semibold transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--drone-blue-solid)' }}
        >
          Apply time
        </button>
      </form>
    </div>
  );
};
