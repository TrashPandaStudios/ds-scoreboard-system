import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useArenaStore } from '../store/arenaStore';
import { useArenaWebSocket } from '../hooks/useArenaWebSocket';
import { useRefereeHotkeys } from '../hooks/useRefereeHotkeys';
import { useAudioBuzzer } from '../hooks/useAudioBuzzer';
import { HeaderNav } from '../components/common/HeaderNav';
import { ScoreButtonGrid } from '../components/referee/ScoreButtonGrid';
import { PenaltyControls } from '../components/referee/PenaltyControls';
import { TimerControlBar } from '../components/referee/TimerControlBar';
import { SetManagementCard } from '../components/referee/SetManagementCard';
import { TeamOverrideModal } from '../components/referee/TeamOverrideModal';
import { HotkeyLegendModal } from '../components/referee/HotkeyLegendModal';
import { IntermissionConfigModal } from '../components/referee/IntermissionConfigModal';
import { CommandType } from '../types/scoreboard';
import { Keyboard, Edit3, Volume2, ShieldAlert, Coffee } from 'lucide-react';

export const RefereeConsole: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const arenaId = parseInt(id || '1', 10);

  const { sendCommand } = useArenaWebSocket(arenaId);
  const { arenaStates } = useArenaStore();
  const { playBuzzer } = useAudioBuzzer();

  const [isOverrideOpen, setIsOverrideOpen] = useState(false);
  const [isHotkeyLegendOpen, setIsHotkeyLegendOpen] = useState(false);
  const [isIntermissionModalOpen, setIsIntermissionModalOpen] = useState(false);

  const arenaState = arenaStates[arenaId] || {
    arenaId,
    arenaName: `Arena ${arenaId}`,
    matchNumber: 'M-101',
    tournamentName: 'World Drone Soccer Championship',
    teamRed: 'Red Phoenix',
    teamBlue: 'Blue Comets',
    redScore: 0,
    blueScore: 0,
    redSetScore: 0,
    blueSetScore: 0,
    redPenalties: 0,
    bluePenalties: 0,
    currentSet: 1,
    maxSets: 3,
    timeRemainingMs: 180000,
    totalSetDurationMs: 180000,
    intermissionDurationMs: 90000,
    timerRunning: false,
    phase: 'IDLE',
    sideSwap: false,
    matchWinner: null,
    serverEpochMs: Date.now(),
    recentEvent: 'Referee Console Ready',
    completedSets: [],
  };

  // Register Global Referee Hotkeys (with automatic input guard suppression)
  useRefereeHotkeys({
    enabled: true,
    onCommand: (type: CommandType, payload) => {
      sendCommand(type, payload);
    },
  });

  const handleApplyOverrides = (data: {
    teamRed: string;
    teamBlue: string;
    matchNumber: string;
    redScore: number;
    blueScore: number;
    redPenalties: number;
    bluePenalties: number;
  }) => {
    sendCommand('UPDATE_TEAMS', {
      teamRed: data.teamRed,
      teamBlue: data.teamBlue,
      matchNumber: data.matchNumber,
    });
    sendCommand('SET_RED_SCORE', { intValue: data.redScore });
    sendCommand('SET_BLUE_SCORE', { intValue: data.blueScore });
    sendCommand('SET_RED_PENALTY', { intValue: data.redPenalties });
    sendCommand('SET_BLUE_PENALTY', { intValue: data.bluePenalties });
  };

  const [pendingMatches, setPendingMatches] = useState<any[]>([]);

  React.useEffect(() => {
    fetch(`/api/queue/arena/${arenaId}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setPendingMatches(data))
      .catch(() => {});
  }, [arenaId]);

  const handleSelectQueuedMatch = (matchId: string) => {
    const match = pendingMatches.find((m) => m.id.toString() === matchId);
    if (match) {
      sendCommand('LOAD_MATCH', {
        teamRed: match.teamRed,
        teamBlue: match.teamBlue,
        matchNumber: match.matchNumber,
        tournamentName: match.tournamentName,
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100 flex flex-col select-none">
      <HeaderNav arenaId={arenaId} variant="referee" />

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6 flex-1 flex flex-col gap-6 w-full">
        {/* Top Control Bar: Match Title, Hotkey Help, Overrides */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider bg-cyan-950/60 px-2.5 py-0.5 rounded border border-cyan-800">
                REFEREE CONSOLE — {arenaState.arenaName}
              </span>
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>CAGE {arenaId} LIVE</span>
              </span>
            </div>
            <h1 className="text-2xl font-display font-black text-white">
              {arenaState.matchNumber}: <span className="text-red-400">{arenaState.teamRed}</span> vs <span className="text-blue-400">{arenaState.teamBlue}</span>
            </h1>
            <span className="text-xs font-mono text-slate-400">
              {arenaState.tournamentName} • Set {arenaState.currentSet} of {arenaState.maxSets}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Quick Match Queue Selector */}
            {pendingMatches.length > 0 && (
              <div className="flex items-center gap-2">
                <select
                  onChange={(e) => handleSelectQueuedMatch(e.target.value)}
                  defaultValue=""
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-cyan-500/40 text-xs font-mono text-cyan-300 focus:outline-none"
                >
                  <option value="" disabled>
                    Load Queued Match for Cage {arenaId}...
                  </option>
                  {pendingMatches.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.matchNumber}: {m.teamRed} vs {m.teamBlue}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={() => setIsHotkeyLegendOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
            >
              <Keyboard className="w-4 h-4 text-cyan-400" />
              <span>HOTKEYS [?]</span>
            </button>

            <button
              onClick={() => setIsIntermissionModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 hover:text-white border border-amber-700/50 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
              title="Configure arena intermission break duration"
            >
              <Coffee className="w-4 h-4 text-amber-400" />
              <span>BREAK: {Math.round((arenaState.intermissionDurationMs || 90000) / 1000)}s</span>
            </button>

            <button
              onClick={() => setIsOverrideOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-md shadow-cyan-600/20 transition-all"
            >
              <Edit3 className="w-4 h-4" />
              <span>MANUAL OVERRIDES</span>
            </button>
          </div>
        </div>

        {/* Central Authoritative Timer & Clock Bar */}
        <TimerControlBar
          timeRemainingMs={arenaState.timeRemainingMs}
          totalDurationMs={arenaState.totalSetDurationMs}
          intermissionDurationMs={arenaState.intermissionDurationMs || 90000}
          timerRunning={arenaState.timerRunning}
          phase={arenaState.phase}
          onToggleTimer={() => sendCommand('TOGGLE_TIMER')}
          onResetTimer={() => sendCommand('RESET_SET_TIMER')}
          onAdjustTimer={(sec) => sendCommand('ADJUST_TIMER_SECONDS', { intValue: sec })}
          onSetExactMs={(exactMs) => sendCommand('SET_TIMER_EXACT_MS', { longValue: exactMs })}
          onStartCountdown={() => sendCommand('START_COUNTDOWN')}
          onStartTimeout={() => sendCommand('START_TIMEOUT')}
          onStartIntermission={() => sendCommand('START_INTERMISSION')}
          onOpenIntermissionConfig={() => setIsIntermissionModalOpen(true)}
          onSetPenaltyPhase={() => sendCommand('SET_PHASE', { phaseValue: 'PENALTY_PHASE' })}
          onTriggerBuzzer={() => {
            playBuzzer(800);
            sendCommand('TRIGGER_BUZZER');
          }}
        />

        {/* Score & Penalty Buttons (Side-Swap Aware) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Side (Red or Blue depending on sideSwap) */}
          {!arenaState.sideSwap ? (
            <div className="flex flex-col gap-3">
              <ScoreButtonGrid
                team="red"
                teamName={arenaState.teamRed}
                score={arenaState.redScore}
                onAddScore={() => sendCommand('ADD_RED_SCORE')}
                onSubScore={() => sendCommand('SUB_RED_SCORE')}
                onEditClick={() => setIsOverrideOpen(true)}
                hotkeyPlus="↑ Up Arrow"
                hotkeyMinus="↓ Down Arrow"
              />
              <PenaltyControls
                team="red"
                penalties={arenaState.redPenalties}
                onAddPenalty={() => sendCommand('ADD_RED_PENALTY')}
                onSubPenalty={() => sendCommand('SUB_RED_PENALTY')}
                hotkeyInfo="Shift + ↑ / Shift + ↓"
              />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <ScoreButtonGrid
                team="blue"
                teamName={arenaState.teamBlue}
                score={arenaState.blueScore}
                onAddScore={() => sendCommand('ADD_BLUE_SCORE')}
                onSubScore={() => sendCommand('SUB_BLUE_SCORE')}
                onEditClick={() => setIsOverrideOpen(true)}
                hotkeyPlus="W"
                hotkeyMinus="S"
              />
              <PenaltyControls
                team="blue"
                penalties={arenaState.bluePenalties}
                onAddPenalty={() => sendCommand('ADD_BLUE_PENALTY')}
                onSubPenalty={() => sendCommand('SUB_BLUE_PENALTY')}
                hotkeyInfo="E / D"
              />
            </div>
          )}

          {/* Right Side */}
          {!arenaState.sideSwap ? (
            <div className="flex flex-col gap-3">
              <ScoreButtonGrid
                team="blue"
                teamName={arenaState.teamBlue}
                score={arenaState.blueScore}
                onAddScore={() => sendCommand('ADD_BLUE_SCORE')}
                onSubScore={() => sendCommand('SUB_BLUE_SCORE')}
                onEditClick={() => setIsOverrideOpen(true)}
                hotkeyPlus="W"
                hotkeyMinus="S"
              />
              <PenaltyControls
                team="blue"
                penalties={arenaState.bluePenalties}
                onAddPenalty={() => sendCommand('ADD_BLUE_PENALTY')}
                onSubPenalty={() => sendCommand('SUB_BLUE_PENALTY')}
                hotkeyInfo="E / D"
              />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <ScoreButtonGrid
                team="red"
                teamName={arenaState.teamRed}
                score={arenaState.redScore}
                onAddScore={() => sendCommand('ADD_RED_SCORE')}
                onSubScore={() => sendCommand('SUB_RED_SCORE')}
                onEditClick={() => setIsOverrideOpen(true)}
                hotkeyPlus="↑ Up Arrow"
                hotkeyMinus="↓ Down Arrow"
              />
              <PenaltyControls
                team="red"
                penalties={arenaState.redPenalties}
                onAddPenalty={() => sendCommand('ADD_RED_PENALTY')}
                onSubPenalty={() => sendCommand('SUB_RED_PENALTY')}
                hotkeyInfo="Shift + ↑ / Shift + ↓"
              />
            </div>
          )}
        </div>

        {/* Set & Match Progression Card */}
        <SetManagementCard
          currentSet={arenaState.currentSet}
          maxSets={arenaState.maxSets}
          redSetScore={arenaState.redSetScore}
          blueSetScore={arenaState.blueSetScore}
          sideSwap={arenaState.sideSwap}
          onAwardSet={(winner) => {
            if (winner === 'RED') sendCommand('AWARD_SET_RED');
            else if (winner === 'BLUE') sendCommand('AWARD_SET_BLUE');
            else sendCommand('AWARD_SET_TIE');
          }}
          onNextSet={() => sendCommand('NEXT_SET')}
          onPrevSet={() => sendCommand('PREV_SET')}
          onSwapSides={() => sendCommand('SWAP_SIDES')}
          onResetMatch={() => sendCommand('RESET_MATCH')}
          onConfirmMatchEnd={() => sendCommand('CONFIRM_MATCH_END')}
        />
      </main>

      {/* Override and Hotkey Modals */}
      <TeamOverrideModal
        isOpen={isOverrideOpen}
        onClose={() => setIsOverrideOpen(false)}
        teamRed={arenaState.teamRed}
        teamBlue={arenaState.teamBlue}
        matchNumber={arenaState.matchNumber}
        redScore={arenaState.redScore}
        blueScore={arenaState.blueScore}
        redPenalties={arenaState.redPenalties}
        bluePenalties={arenaState.bluePenalties}
        onSave={handleApplyOverrides}
      />

      <HotkeyLegendModal
        isOpen={isHotkeyLegendOpen}
        onClose={() => setIsHotkeyLegendOpen(false)}
      />

      <IntermissionConfigModal
        isOpen={isIntermissionModalOpen}
        onClose={() => setIsIntermissionModalOpen(false)}
        arenaId={arenaId}
        arenaName={arenaState.arenaName}
        currentDurationMs={arenaState.intermissionDurationMs || 90000}
        isIntermissionActive={arenaState.phase === 'INTERMISSION'}
        onSaveDuration={(durationMs) => {
          sendCommand('SET_INTERMISSION_DURATION', { longValue: durationMs });
        }}
        onStartIntermission={() => {
          sendCommand('START_INTERMISSION');
        }}
      />
    </div>
  );
};
