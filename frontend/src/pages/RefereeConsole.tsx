import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useArenaStore, getPendingDeltas } from '../store/arenaStore';
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
import { SetEndResolutionModal } from '../components/referee/SetEndResolutionModal';
import { MatchStrikers } from '../components/referee/MatchStrikers';
import { getSpectatorPhaseMeta } from '../components/public/PublicLiveCard';
import { CommandType } from '../types/scoreboard';
import { Keyboard, Edit3, ShieldAlert, Coffee, Trophy, ClipboardCheck } from 'lucide-react';

export const RefereeConsole: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const arenaId = parseInt(id || '1', 10);

  const { sendCommand, clearOutboxForArena } = useArenaWebSocket(arenaId);
  const { arenaStates, commandOutbox, transportMode, pendingCommands, commandError, setCommandError } =
    useArenaStore();
  const { playBuzzer } = useAudioBuzzer();

  const [isOverrideOpen, setIsOverrideOpen] = useState(false);
  const [isHotkeyLegendOpen, setIsHotkeyLegendOpen] = useState(false);
  const [isIntermissionModalOpen, setIsIntermissionModalOpen] = useState(false);
  const [isResolutionModalOpen, setIsResolutionModalOpen] = useState(false);
  const promptedSetRef = React.useRef<number | null>(null);

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
    phase: 'IDLE' as const,
    sideSwap: false,
    matchWinner: null,
    serverEpochMs: Date.now(),
    recentEvent: 'Referee Console Ready',
    completedSets: [],
  };

  const queuedCommands = commandOutbox[arenaId] || [];
  const pendingDeltas = getPendingDeltas(queuedCommands);

  const displayRedScore = Math.max(0, arenaState.redScore + pendingDeltas.redScoreDelta);
  const displayBlueScore = Math.max(0, arenaState.blueScore + pendingDeltas.blueScoreDelta);
  const displayRedPenalties = Math.max(0, arenaState.redPenalties + pendingDeltas.redPenaltyDelta);
  const displayBluePenalties = Math.max(0, arenaState.bluePenalties + pendingDeltas.bluePenaltyDelta);

  const handleExplicitToggleTimer = () => {
    sendCommand(arenaState.timerRunning ? 'PAUSE_TIMER' : 'START_TIMER');
  };

  useRefereeHotkeys({
    enabled: true,
    onCommand: (type: CommandType, payload) => {
      if (type === 'TOGGLE_TIMER') {
        handleExplicitToggleTimer();
        return;
      }
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

  React.useEffect(() => {
    if (
      arenaState.timeRemainingMs === 0 &&
      arenaState.phase === 'NORMAL_PHASE' &&
      !arenaState.setWinnerBanner?.active &&
      promptedSetRef.current !== arenaState.currentSet
    ) {
      promptedSetRef.current = arenaState.currentSet;
      setIsResolutionModalOpen(true);
    }
  }, [arenaState.timeRemainingMs, arenaState.phase, arenaState.setWinnerBanner, arenaState.currentSet]);

  const phaseMeta = getSpectatorPhaseMeta(arenaState.phase, arenaState.timerRunning);

  return (
    <div className="app-shell min-h-screen flex flex-col select-none">
      <HeaderNav arenaId={arenaId} variant="referee" />

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6 flex-1 flex flex-col gap-5 w-full">
        {/* RF Interference / Durable Command Outbox Banner */}
        {(commandError || transportMode === 'HTTP_FALLBACK' || queuedCommands.length > 0) && (
          <div
            className="px-4 py-3 rounded-xl border text-xs font-semibold flex flex-wrap items-center justify-between gap-3"
            style={
              commandError
                ? {
                    backgroundColor: 'var(--drone-red-tint)',
                    borderColor: 'var(--drone-red-border)',
                    color: 'var(--drone-red-text)',
                  }
                : {
                    backgroundColor: 'var(--signal-amber-tint)',
                    borderColor: 'var(--signal-amber-border)',
                    color: 'var(--signal-amber-text)',
                  }
            }
          >
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full animate-pulse shrink-0"
                style={{ backgroundColor: commandError ? 'var(--drone-red)' : 'var(--signal-amber)' }}
              />
              <span>
                {commandError
                  ? commandError
                  : queuedCommands.length > 0
                  ? `${queuedCommands.length} score/penalty action${
                      queuedCommands.length > 1 ? 's' : ''
                    } queued for Set ${arenaState.currentSet} — syncing automatically when connection recovers.`
                  : 'RF congestion detected — HTTP fallback active (scoring and timer commands remain live).'}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {pendingCommands > 0 && (
                <span className="px-2 py-0.5 rounded bg-[var(--court-surface)] text-[var(--court-ink)]">
                  In flight: {pendingCommands}
                </span>
              )}
              {queuedCommands.length > 0 && (
                <button
                  type="button"
                  onClick={() => clearOutboxForArena(arenaId)}
                  className="px-2.5 py-1 rounded-md bg-[var(--court-surface)] border border-[var(--court-line)] text-[var(--court-ink)]"
                >
                  Clear queue ({queuedCommands.length})
                </button>
              )}
              {commandError && (
                <button
                  type="button"
                  onClick={() => setCommandError(null)}
                  className="px-2.5 py-1 rounded-md bg-[var(--court-surface)] border border-[var(--court-line)] text-[var(--court-ink)]"
                >
                  Dismiss
                </button>
              )}
            </div>
          </div>
        )}

        {/* Match Identity & Utility Bar */}
        <section className="p-5 rounded-2xl bg-[var(--court-surface)] border border-[var(--court-line)] flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--court-muted)]">
              <span className="font-bold text-[var(--court-ink)]">{arenaState.arenaName}</span>
              <span>{arenaState.tournamentName}</span>
              <span>
                Set {arenaState.currentSet} of {arenaState.maxSets}
              </span>
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border"
                style={phaseMeta.pillStyle}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${phaseMeta.pulse ? 'animate-pulse' : ''}`}
                  style={{ backgroundColor: phaseMeta.dotColor }}
                />
                {phaseMeta.label}
              </span>
            </div>

            <h1 className="spectator-numeral text-3xl sm:text-4xl font-black text-[var(--court-ink)] leading-tight">
              {arenaState.matchNumber}:{' '}
              <span style={{ color: 'var(--drone-red-text)' }}>{arenaState.teamRed}</span>{' '}
              <span className="text-[var(--court-muted)] font-semibold text-2xl">vs</span>{' '}
              <span style={{ color: 'var(--drone-blue-text)' }}>{arenaState.teamBlue}</span>
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {pendingMatches.length > 0 && (
              <select
                onChange={(e) => handleSelectQueuedMatch(e.target.value)}
                defaultValue=""
                className="px-3 py-2 rounded-lg bg-[var(--court-subtle)] border border-[var(--court-line)] text-xs font-semibold text-[var(--court-ink)]"
              >
                <option value="" disabled>
                  Load queued match...
                </option>
                {pendingMatches.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.matchNumber}: {m.teamRed} vs {m.teamBlue}
                  </option>
                ))}
              </select>
            )}

            <Link
              to={`/arena/${arenaId}/check-in`}
              className="px-3 py-2 rounded-lg bg-[var(--court-control-bg)] hover:bg-[var(--court-control-hover)] text-[var(--court-ink)] border border-[var(--court-line)] text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <ClipboardCheck className="w-4 h-4 text-[var(--court-accent-link)]" />
              Team check-in
            </Link>

            <button
              type="button"
              onClick={() => setIsHotkeyLegendOpen(true)}
              className="px-3 py-2 rounded-lg bg-[var(--court-control-bg)] hover:bg-[var(--court-control-hover)] text-[var(--court-ink)] border border-[var(--court-line)] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
            >
              <Keyboard className="w-3.5 h-3.5 text-[var(--court-muted)]" />
              <span>Hotkeys</span>
            </button>

            <button
              type="button"
              onClick={() => setIsResolutionModalOpen(true)}
              className="px-3 py-2 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
              style={{
                backgroundColor: 'var(--signal-intermission-tint)',
                borderColor: 'var(--signal-intermission-border)',
                color: 'var(--signal-intermission-text)',
              }}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Resolve set</span>
            </button>

            <button
              type="button"
              onClick={() => setIsIntermissionModalOpen(true)}
              className="px-3 py-2 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
              style={{
                backgroundColor: 'var(--signal-amber-tint)',
                borderColor: 'var(--signal-amber-border)',
                color: 'var(--signal-amber-text)',
              }}
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>Break ({Math.round((arenaState.intermissionDurationMs || 90000) / 1000)}s)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsOverrideOpen(true)}
              className="px-3.5 py-2 rounded-lg text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--drone-blue-solid)' }}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Overrides</span>
            </button>
          </div>
        </section>

        {/* Active Winner Banner Callout */}
        {arenaState.setWinnerBanner?.active &&
          (() => {
            const banner = arenaState.setWinnerBanner;
            const setsNeeded = Math.floor((arenaState.maxSets || 3) / 2) + 1;
            const isMatchClinched =
              Boolean(banner.isMatchWinner) ||
              Boolean(banner.matchWinner) ||
              banner.setsWon >= setsNeeded ||
              banner.redSetScore >= setsNeeded ||
              banner.blueSetScore >= setsNeeded ||
              arenaState.phase === 'MATCH_ENDED';

            return (
              <div
                className="w-full p-5 rounded-2xl border flex flex-wrap items-center justify-between gap-4"
                style={{
                  backgroundColor: 'var(--signal-amber-tint)',
                  borderColor: 'var(--signal-amber-border)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="p-2.5 rounded-xl border"
                    style={{
                      backgroundColor: 'var(--court-surface)',
                      borderColor: 'var(--signal-amber-border)',
                      color: 'var(--signal-amber)',
                    }}
                  >
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <span
                      className="text-xs font-bold block"
                      style={{ color: 'var(--signal-amber-text)' }}
                    >
                      {isMatchClinched ? 'Match clinched' : `Set ${banner.currentSet} concluded`}
                    </span>
                    <h2 className="spectator-numeral text-2xl font-black text-[var(--court-ink)]">
                      Winner:{' '}
                      <span
                        style={{
                          color: banner.winner === 'RED' ? 'var(--drone-red-text)' : 'var(--drone-blue-text)',
                        }}
                      >
                        {banner.winnerName}
                      </span>{' '}
                      ({banner.setsWon} sets won)
                    </h2>
                    <span className="text-xs text-[var(--court-muted)]">
                      Winner takeover is live on stadium displays.
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!isMatchClinched ? (
                    <button
                      type="button"
                      onClick={() => sendCommand('START_INTERMISSION')}
                      className="px-4 py-2 rounded-lg text-white text-xs font-semibold inline-flex items-center gap-1.5"
                      style={{ backgroundColor: 'var(--signal-intermission)' }}
                    >
                      <Coffee className="w-4 h-4" />
                      <span>Start intermission</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => sendCommand('RESET_MATCH')}
                      className="px-4 py-2 rounded-lg text-white text-xs font-semibold"
                      style={{ backgroundColor: 'var(--drone-blue-solid)' }}
                    >
                      Start new match
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => sendCommand('DISMISS_WINNER_BANNER')}
                    className="px-3.5 py-2 rounded-lg bg-[var(--court-surface)] hover:bg-[var(--court-control-hover)] text-[var(--court-ink)] border border-[var(--court-line)] text-xs font-semibold"
                  >
                    Dismiss banner
                  </button>
                </div>
              </div>
            );
          })()}

        <MatchStrikers key={arenaId} arenaId={arenaId} />

        {/* Central Authoritative Timer & Clock Bar */}
        <TimerControlBar
          timeRemainingMs={arenaState.timeRemainingMs}
          totalDurationMs={arenaState.totalSetDurationMs}
          intermissionDurationMs={arenaState.intermissionDurationMs || 90000}
          timerRunning={arenaState.timerRunning}
          phase={arenaState.phase}
          onToggleTimer={handleExplicitToggleTimer}
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

        {/* Score & Penalty Controls (Side-Swap Aware) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {!arenaState.sideSwap ? (
            <div className="flex flex-col gap-3">
              <ScoreButtonGrid
                team="red"
                teamName={arenaState.teamRed}
                logoUrl={arenaState.teamRedLogoUrl}
                score={displayRedScore}
                pendingDelta={pendingDeltas.redScoreDelta}
                onAddScore={() => sendCommand('ADD_RED_SCORE')}
                onSubScore={() => sendCommand('SUB_RED_SCORE')}
                onEditClick={() => setIsOverrideOpen(true)}
                hotkeyPlus="↑ Up"
                hotkeyMinus="↓ Down"
              />
              <PenaltyControls
                team="red"
                penalties={displayRedPenalties}
                pendingDelta={pendingDeltas.redPenaltyDelta}
                onAddPenalty={() => sendCommand('ADD_RED_PENALTY')}
                onSubPenalty={() => sendCommand('SUB_RED_PENALTY')}
                hotkeyInfo="Shift + ↑ / ↓"
              />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <ScoreButtonGrid
                team="blue"
                teamName={arenaState.teamBlue}
                logoUrl={arenaState.teamBlueLogoUrl}
                score={displayBlueScore}
                pendingDelta={pendingDeltas.blueScoreDelta}
                onAddScore={() => sendCommand('ADD_BLUE_SCORE')}
                onSubScore={() => sendCommand('SUB_BLUE_SCORE')}
                onEditClick={() => setIsOverrideOpen(true)}
                hotkeyPlus="W"
                hotkeyMinus="S"
              />
              <PenaltyControls
                team="blue"
                penalties={displayBluePenalties}
                pendingDelta={pendingDeltas.bluePenaltyDelta}
                onAddPenalty={() => sendCommand('ADD_BLUE_PENALTY')}
                onSubPenalty={() => sendCommand('SUB_BLUE_PENALTY')}
                hotkeyInfo="E / D"
              />
            </div>
          )}

          {!arenaState.sideSwap ? (
            <div className="flex flex-col gap-3">
              <ScoreButtonGrid
                team="blue"
                teamName={arenaState.teamBlue}
                logoUrl={arenaState.teamBlueLogoUrl}
                score={displayBlueScore}
                pendingDelta={pendingDeltas.blueScoreDelta}
                onAddScore={() => sendCommand('ADD_BLUE_SCORE')}
                onSubScore={() => sendCommand('SUB_BLUE_SCORE')}
                onEditClick={() => setIsOverrideOpen(true)}
                hotkeyPlus="W"
                hotkeyMinus="S"
              />
              <PenaltyControls
                team="blue"
                penalties={displayBluePenalties}
                pendingDelta={pendingDeltas.bluePenaltyDelta}
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
                logoUrl={arenaState.teamRedLogoUrl}
                score={displayRedScore}
                pendingDelta={pendingDeltas.redScoreDelta}
                onAddScore={() => sendCommand('ADD_RED_SCORE')}
                onSubScore={() => sendCommand('SUB_RED_SCORE')}
                onEditClick={() => setIsOverrideOpen(true)}
                hotkeyPlus="↑ Up"
                hotkeyMinus="↓ Down"
              />
              <PenaltyControls
                team="red"
                penalties={displayRedPenalties}
                pendingDelta={pendingDeltas.redPenaltyDelta}
                onAddPenalty={() => sendCommand('ADD_RED_PENALTY')}
                onSubPenalty={() => sendCommand('SUB_RED_PENALTY')}
                hotkeyInfo="Shift + ↑ / ↓"
              />
            </div>
          )}
        </div>

        {/* Set & Match Progression */}
        <SetManagementCard
          currentSet={arenaState.currentSet}
          maxSets={arenaState.maxSets}
          redSetScore={arenaState.redSetScore}
          blueSetScore={arenaState.blueSetScore}
          sideSwap={arenaState.sideSwap}
          isSetAlreadyAwarded={
            arenaState.completedSets?.some((s) => s.setNumber === arenaState.currentSet) ||
            !!arenaState.setWinnerBanner?.active
          }
          isMatchEnded={arenaState.phase === 'MATCH_ENDED'}
          currentSetWinner={
            arenaState.completedSets?.find((s) => s.setNumber === arenaState.currentSet)?.winner ||
            arenaState.setWinnerBanner?.winnerName
          }
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

      {/* Modals */}
      <TeamOverrideModal
        isOpen={isOverrideOpen}
        onClose={() => setIsOverrideOpen(false)}
        teamRed={arenaState.teamRed}
        teamBlue={arenaState.teamBlue}
        teamRedLogoUrl={arenaState.teamRedLogoUrl}
        teamBlueLogoUrl={arenaState.teamBlueLogoUrl}
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

      <SetEndResolutionModal
        isOpen={isResolutionModalOpen}
        onClose={() => setIsResolutionModalOpen(false)}
        currentSet={arenaState.currentSet}
        maxSets={arenaState.maxSets}
        teamRed={arenaState.teamRed}
        teamBlue={arenaState.teamBlue}
        redScore={arenaState.redScore}
        blueScore={arenaState.blueScore}
        redPenalties={arenaState.redPenalties}
        bluePenalties={arenaState.bluePenalties}
        onAdjustScore={(isRed, delta) => {
          sendCommand(
            isRed
              ? delta > 0
                ? 'ADD_RED_SCORE'
                : 'SUB_RED_SCORE'
              : delta > 0
              ? 'ADD_BLUE_SCORE'
              : 'SUB_BLUE_SCORE'
          );
        }}
        onAdjustPenalty={(isRed, delta) => {
          sendCommand(
            isRed
              ? delta > 0
                ? 'ADD_RED_PENALTY'
                : 'SUB_RED_PENALTY'
              : delta > 0
              ? 'ADD_BLUE_PENALTY'
              : 'SUB_BLUE_PENALTY'
          );
        }}
        onEnterPenaltyPhase={() => sendCommand('SET_PHASE', { phaseValue: 'PENALTY_PHASE' })}
        onEnterSuddenDeath={() => sendCommand('START_SUDDEN_DEATH')}
        onAwardSet={(winner) => sendCommand(winner === 'RED' ? 'AWARD_SET_RED' : 'AWARD_SET_BLUE')}
      />
    </div>
  );
};
