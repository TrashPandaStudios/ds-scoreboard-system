import { create } from 'zustand';
import { ArenaState, ArenaSummary, QueuedCommand, SponsorItem } from '../types/scoreboard';

export type TransportMode = 'WS' | 'HTTP_FALLBACK' | 'OFFLINE';

const OUTBOX_STORAGE_KEY = 'ds-referee-outbox-v1';
const OUTBOX_MAX_AGE_MS = 30 * 60 * 1000; // Discard any leftover queued taps older than 30 minutes

export interface PendingDeltas {
  redScoreDelta: number;
  blueScoreDelta: number;
  redPenaltyDelta: number;
  bluePenaltyDelta: number;
}

export function getPendingDeltas(queue: QueuedCommand[] = []): PendingDeltas {
  let redScoreDelta = 0;
  let blueScoreDelta = 0;
  let redPenaltyDelta = 0;
  let bluePenaltyDelta = 0;

  for (const item of queue) {
    switch (item.type) {
      case 'ADD_RED_SCORE':
        redScoreDelta += 1;
        break;
      case 'SUB_RED_SCORE':
        redScoreDelta -= 1;
        break;
      case 'ADD_BLUE_SCORE':
        blueScoreDelta += 1;
        break;
      case 'SUB_BLUE_SCORE':
        blueScoreDelta -= 1;
        break;
      case 'ADD_RED_PENALTY':
        redPenaltyDelta += 1;
        break;
      case 'SUB_RED_PENALTY':
        redPenaltyDelta -= 1;
        break;
      case 'ADD_BLUE_PENALTY':
        bluePenaltyDelta += 1;
        break;
      case 'SUB_BLUE_PENALTY':
        bluePenaltyDelta -= 1;
        break;
      default:
        break;
    }
  }

  return { redScoreDelta, blueScoreDelta, redPenaltyDelta, bluePenaltyDelta };
}

function loadInitialOutbox(): Record<number, QueuedCommand[]> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(OUTBOX_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, QueuedCommand[]>;
    const now = Date.now();
    const cleaned: Record<number, QueuedCommand[]> = {};
    for (const [key, list] of Object.entries(parsed)) {
      const id = Number(key);
      if (!Number.isFinite(id) || !Array.isArray(list)) continue;
      const fresh = list.filter(
        (item) =>
          item &&
          typeof item.commandId === 'string' &&
          typeof item.enqueuedAt === 'number' &&
          now - item.enqueuedAt <= OUTBOX_MAX_AGE_MS
      );
      if (fresh.length > 0) {
        cleaned[id] = fresh;
      }
    }
    return cleaned;
  } catch {
    return {};
  }
}

function persistOutbox(outbox: Record<number, QueuedCommand[]>) {
  if (typeof window === 'undefined') return;
  try {
    const hasItems = Object.values(outbox).some((q) => q.length > 0);
    if (!hasItems) {
      window.localStorage.removeItem(OUTBOX_STORAGE_KEY);
    } else {
      window.localStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(outbox));
    }
  } catch {
    // Ignore storage quota / private-browsing errors
  }
}

function isCommandStaleForState(item: QueuedCommand, state: ArenaState): boolean {
  if (item.expectedMatchNumber && state.matchNumber && item.expectedMatchNumber !== state.matchNumber) {
    return true;
  }
  if (item.expectedSet != null && state.currentSet != null && item.expectedSet !== state.currentSet) {
    return true;
  }
  return false;
}

interface ArenaStore {
  // Connection & Network Resilience Telemetry
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  transportMode: TransportMode;
  lastSyncAt: number | null;
  pendingCommands: number;
  commandError: string | null;
  setConnectionStatus: (
    connected: boolean,
    connecting: boolean,
    error?: string | null,
    transportMode?: TransportMode
  ) => void;
  setTransportMode: (mode: TransportMode) => void;
  markSynced: () => void;
  incrementPendingCommands: () => void;
  decrementPendingCommands: () => void;
  setCommandError: (error: string | null) => void;

  // Durable Referee Command Outbox (per arenaId, persisted to localStorage)
  commandOutbox: Record<number, QueuedCommand[]>;
  enqueueOutboxCommand: (item: QueuedCommand) => void;
  removeOutboxCommand: (arenaId: number, commandId: string) => void;
  clearOutbox: (arenaId: number) => void;

  // Single Arena Active State (keyed by arenaId, guarded by monotonic stateVersion)
  arenaStates: Record<number, ArenaState>;
  setArenaState: (arenaId: number, state: ArenaState) => void;

  // Multi-Arena Summaries
  arenaSummaries: ArenaSummary[];
  setArenaSummaries: (summaries: ArenaSummary[]) => void;

  // Visual/Audio Buzzer Active State
  activeBuzzerArenaId: number | null;
  buzzerTriggerTimestamp: number;
  triggerVisualBuzzer: (arenaId: number) => void;
  clearVisualBuzzer: () => void;

  // Sponsors
  sponsors: SponsorItem[];
  setSponsors: (sponsors: SponsorItem[]) => void;
}

export const useArenaStore = create<ArenaStore>((set) => ({
  isConnected: false,
  isConnecting: true,
  connectionError: null,
  transportMode: 'OFFLINE',
  lastSyncAt: null,
  pendingCommands: 0,
  commandError: null,

  setConnectionStatus: (connected, connecting, error = null, transportMode) =>
    set((prev) => ({
      isConnected: connected,
      isConnecting: connecting,
      connectionError: error,
      transportMode:
        transportMode ?? (connected ? 'WS' : prev.transportMode === 'HTTP_FALLBACK' ? 'HTTP_FALLBACK' : 'OFFLINE'),
    })),

  setTransportMode: (transportMode) => set({ transportMode }),

  markSynced: () => set({ lastSyncAt: Date.now() }),

  incrementPendingCommands: () =>
    set((prev) => ({ pendingCommands: prev.pendingCommands + 1 })),

  decrementPendingCommands: () =>
    set((prev) => ({ pendingCommands: Math.max(0, prev.pendingCommands - 1) })),

  setCommandError: (commandError) => set({ commandError }),

  commandOutbox: loadInitialOutbox(),

  enqueueOutboxCommand: (item) =>
    set((prev) => {
      const existing = prev.commandOutbox[item.arenaId] || [];
      if (existing.some((q) => q.commandId === item.commandId)) {
        return prev;
      }
      const nextOutbox = {
        ...prev.commandOutbox,
        [item.arenaId]: [...existing, item],
      };
      persistOutbox(nextOutbox);
      return { commandOutbox: nextOutbox };
    }),

  removeOutboxCommand: (arenaId, commandId) =>
    set((prev) => {
      const existing = prev.commandOutbox[arenaId];
      if (!existing || existing.length === 0) return prev;
      const filtered = existing.filter((q) => q.commandId !== commandId);
      const nextOutbox = { ...prev.commandOutbox };
      if (filtered.length > 0) {
        nextOutbox[arenaId] = filtered;
      } else {
        delete nextOutbox[arenaId];
      }
      persistOutbox(nextOutbox);
      return { commandOutbox: nextOutbox };
    }),

  clearOutbox: (arenaId) =>
    set((prev) => {
      if (!prev.commandOutbox[arenaId]) return prev;
      const nextOutbox = { ...prev.commandOutbox };
      delete nextOutbox[arenaId];
      persistOutbox(nextOutbox);
      return { commandOutbox: nextOutbox, commandError: null };
    }),

  arenaStates: {},
  setArenaState: (arenaId, incoming) =>
    set((prev) => {
      const existing = prev.arenaStates[arenaId];
      if (existing) {
        const prevVer = existing.stateVersion;
        const nextVer = incoming.stateVersion;

        // Ignore out-of-order stale frames flushing out of a congested wireless buffer.
        // Allow version reset only if the backend process restarted (stateVersion dropped back to <= 2 and serverEpochMs moved forward).
        if (prevVer != null && nextVer != null) {
          const looksLikeServerRestart =
            nextVer <= 2 && prevVer > 5 && incoming.serverEpochMs > existing.serverEpochMs + 2000;
          if (!looksLikeServerRestart) {
            if (nextVer < prevVer) {
              return { lastSyncAt: Date.now() };
            }
            if (nextVer === prevVer && incoming.serverEpochMs < existing.serverEpochMs) {
              return { lastSyncAt: Date.now() };
            }
          }
        }
      }

      // Automatically reconcile/prune outbox items for this arena:
      // 1) Remove any item confirmed via incoming.lastCommandId
      // 2) Discard stale offline taps if the match or set has already moved on
      let nextOutbox = prev.commandOutbox;
      let nextCommandError = prev.commandError;
      const queue = prev.commandOutbox[arenaId];
      if (queue && queue.length > 0) {
        let staleDiscarded = 0;
        const remaining = queue.filter((item) => {
          if (incoming.lastCommandId && item.commandId === incoming.lastCommandId) {
            return false;
          }
          if (isCommandStaleForState(item, incoming)) {
            staleDiscarded += 1;
            return false;
          }
          return true;
        });

        if (remaining.length !== queue.length) {
          nextOutbox = { ...prev.commandOutbox };
          if (remaining.length > 0) {
            nextOutbox[arenaId] = remaining;
          } else {
            delete nextOutbox[arenaId];
          }
          persistOutbox(nextOutbox);

          if (staleDiscarded > 0) {
            nextCommandError = `Discarded ${staleDiscarded} stale offline tap${
              staleDiscarded > 1 ? 's' : ''
            } because the match moved to ${incoming.matchNumber} (Set ${incoming.currentSet}).`;
          }
        }
      }

      return {
        arenaStates: { ...prev.arenaStates, [arenaId]: incoming },
        commandOutbox: nextOutbox,
        commandError: nextCommandError,
        lastSyncAt: Date.now(),
      };
    }),

  arenaSummaries: [],
  setArenaSummaries: (summaries) =>
    set({
      arenaSummaries: summaries,
      lastSyncAt: Date.now(),
    }),

  activeBuzzerArenaId: null,
  buzzerTriggerTimestamp: 0,
  triggerVisualBuzzer: (arenaId: number) =>
    set({ activeBuzzerArenaId: arenaId, buzzerTriggerTimestamp: Date.now() }),
  clearVisualBuzzer: () => set({ activeBuzzerArenaId: null }),

  sponsors: [],
  setSponsors: (sponsors) => set({ sponsors }),
}));
