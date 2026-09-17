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
    <div className="flex flex-col gap-6 p-6 lg:p-8 rounded-3xl bg-slate-900/90 border-2 border-slate-800 shadow-xl">
      {/* Central Large Timer Display */}
      <TabularTimer
        serverRemainingMs={timeRemainingMs}
        totalDurationMs={totalDurationMs}
        timerRunning={timerRunning}
        phase={phase}
        size="lg"
        showProgressBar={true}
      />

      {/* Main Touch Play/Pause & Buzzer Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Giant Space / Play / Pause Toggle Button */}
        <button
          onClick={onToggleTimer}
          className={`md:col-span-2 h-20 rounded-2xl flex items-center justify-center gap-3 font-black text-2xl tracking-wide transition-all active:scale-[0.98] shadow-xl ${
            timerRunning
              ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 shadow-amber-500/20'
              : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-500/20'
          }`}
        >
          {timerRunning ? (
            <>
              <Pause className="w-8 h-8 fill-current" />
              <span>PAUSE MATCH CLOCK [SPACE]</span>
            </>
          ) : (
            <>
              <Play className="w-8 h-8 fill-current" />
              <span>START MATCH CLOCK [SPACE]</span>
            </>
          )}
        </button>

        {/* Stadium Hardware Buzzer Manual Trigger */}
        <button
          onClick={onTriggerBuzzer}
          className="h-20 rounded-2xl flex items-center justify-center gap-3 font-black text-xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white shadow-xl shadow-rose-600/30 border border-rose-400/40 transition-all active:scale-95 animate-pulse"
        >
          <Volume2 className="w-7 h-7" />
          <div className="text-left leading-tight">
            <span className="block text-sm font-mono opacity-90 uppercase">FIRE BUZZER</span>
            <span className="block text-lg">KEY: [B]</span>
          </div>
        </button>
      </div>

      {/* Quick Timer Adjustments & Presets */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2 border-t border-slate-800">
        {/* +10s */}
        <button
          onClick={() => onAdjustTimer(10)}
          className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold flex items-center justify-center gap-1 border border-slate-700 transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-emerald-400" />
          <span>+10 SEC</span>
        </button>

        {/* -10s */}
        <button
          onClick={() => onAdjustTimer(-10)}
          className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold flex items-center justify-center gap-1 border border-slate-700 transition-colors"
        >
          <Minus className="w-3.5 h-3.5 text-rose-400" />
          <span>-10 SEC</span>
        </button>

        {/* Reset 03:00 */}
        <button
          onClick={onResetTimer}
          className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold flex items-center justify-center gap-1 border border-slate-700 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
          <span>RESET 03:00</span>
        </button>

        {/* 5s Countdown */}
        <button
          onClick={onStartCountdown}
          className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-mono font-bold flex items-center justify-center gap-1 border border-slate-700 transition-colors"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>5S COUNTDOWN</span>
        </button>

        {/* 1:00 Timeout */}
        <button
          onClick={onStartTimeout}
          className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-mono font-bold flex items-center justify-center gap-1 border border-slate-700 transition-colors"
        >
          <Clock className="w-3.5 h-3.5 text-sky-400" />
          <span>TIMEOUT (1:00)</span>
        </button>

        {/* Penalty Phase 30s */}
        <button
          onClick={onSetPenaltyPhase}
          className="px-3 py-2.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 text-amber-400 text-xs font-mono font-bold flex items-center justify-center gap-1 border border-amber-600/40 transition-colors"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          <span>PENALTY (0:30)</span>
        </button>

        {/* Intermission Break & Config */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onStartIntermission}
            className="flex-1 px-2.5 py-2.5 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 text-xs font-mono font-bold flex items-center justify-center gap-1 border border-amber-600/40 transition-colors"
            title="Trigger Intermission Break"
          >
            <Coffee className="w-3.5 h-3.5 text-amber-400" />
            <span>BREAK ({Math.round(intermissionDurationMs / 1000)}s)</span>
          </button>
          {onOpenIntermissionConfig && (
            <button
              type="button"
              onClick={onOpenIntermissionConfig}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 hover:border-amber-500/50 transition-colors"
              title="Configure Arena Intermission Duration"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Exact Millisecond / Minute:Second Override Input */}
      <form onSubmit={handleApplyCustomTime} className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800 text-xs font-mono">
        <span className="text-slate-400 font-semibold">CUSTOM TIMER OVERRIDE:</span>
        <input
          type="number"
          placeholder="Min"
          min="0"
          max="59"
          value={customMinutes}
          onChange={(e) => setCustomMinutes(e.target.value)}
          className="w-16 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-center focus:border-cyan-500 focus:outline-none"
        />
        <span className="text-slate-500 font-bold">:</span>
        <input
          type="number"
          placeholder="Sec"
          min="0"
          max="59"
          value={customSeconds}
          onChange={(e) => setCustomSeconds(e.target.value)}
          className="w-16 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-center focus:border-cyan-500 focus:outline-none"
        />
        <button
          type="submit"
          className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-colors"
        >
          SET EXACT
        </button>
      </form>
    </div>
  );
};
