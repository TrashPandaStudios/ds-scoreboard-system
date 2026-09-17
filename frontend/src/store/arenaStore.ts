import { create } from 'zustand';
import { ArenaState, ArenaSummary, SponsorItem } from '../types/scoreboard';

interface ArenaStore {
  // Connection
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  setConnectionStatus: (connected: boolean, connecting: boolean, error?: string | null) => void;

  // Single Arena Active State (keyed by arenaId)
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
  setConnectionStatus: (connected, connecting, error = null) =>
    set({ isConnected: connected, isConnecting: connecting, connectionError: error }),

  arenaStates: {},
  setArenaState: (arenaId, state) =>
    set((prev) => ({
      arenaStates: { ...prev.arenaStates, [arenaId]: state },
    })),

  arenaSummaries: [],
  setArenaSummaries: (summaries) => set({ arenaSummaries: summaries }),

  activeBuzzerArenaId: null,
  buzzerTriggerTimestamp: 0,
  triggerVisualBuzzer: (arenaId: number) =>
    set({ activeBuzzerArenaId: arenaId, buzzerTriggerTimestamp: Date.now() }),
  clearVisualBuzzer: () => set({ activeBuzzerArenaId: null }),

  sponsors: [],
  setSponsors: (sponsors) => set({ sponsors }),
}));
