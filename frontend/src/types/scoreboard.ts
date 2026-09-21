export type MatchPhase =
  | 'IDLE'
  | 'COUNTDOWN'
  | 'NORMAL_PHASE'
  | 'PENALTY_PHASE'
  | 'SUDDEN_DEATH'
  | 'TIMEOUT'
  | 'INTERMISSION'
  | 'MATCH_ENDED';

export interface SetWinnerBanner {
  active: boolean;
  winner: 'RED' | 'BLUE' | 'TIE' | string;
  winnerName: string;
  winnerLogoUrl?: string | null;
  redSetScore: number;
  blueSetScore: number;
  setsWon: number;
  currentSet: number;
  maxSets: number;
  isMatchWinner: boolean;
}

export interface SetSummary {
  setNumber: number;
  redScore: number;
  blueScore: number;
  redPenalties: number;
  bluePenalties: number;
  winner: 'RED' | 'BLUE' | 'TIE' | string;
  durationSeconds: number;
}

export interface ArenaState {
  arenaId: number;
  arenaName: string;
  matchId: number | null;
  matchNumber: string;
  tournamentName: string;
  teamRed: string;
  teamBlue: string;
  teamRedLogoUrl?: string | null;
  teamBlueLogoUrl?: string | null;
  redScore: number;
  blueScore: number;
  redSetScore: number;
  blueSetScore: number;
  redPenalties: number;
  bluePenalties: number;
  currentSet: number;
  maxSets: number;
  timeRemainingMs: number;
  totalSetDurationMs: number;
  intermissionDurationMs?: number;
  timerRunning: boolean;
  phase: MatchPhase;
  sideSwap: boolean; // false = Red on Left, true = Blue on Left
  matchWinner: string | null;
  setWinnerBanner?: SetWinnerBanner | null;
  serverEpochMs: number;
  recentEvent: string;
  completedSets: SetSummary[];
}

export interface ArenaSummary {
  arenaId: number;
  arenaName: string;
  matchId: number | null;
  matchNumber: string;
  teamRed: string;
  teamBlue: string;
  teamRedLogoUrl?: string | null;
  teamBlueLogoUrl?: string | null;
  redScore: number;
  blueScore: number;
  redSetScore: number;
  blueSetScore: number;
  currentSet: number;
  maxSets: number;
  timeRemainingMs: number;
  intermissionDurationMs?: number;
  timerRunning: boolean;
  phase: MatchPhase;
  sideSwap: boolean;
  setWinnerBanner?: SetWinnerBanner | null;
  serverEpochMs: number;
}

export type CommandType =
  | 'START_TIMER'
  | 'PAUSE_TIMER'
  | 'TOGGLE_TIMER'
  | 'RESET_SET_TIMER'
  | 'ADJUST_TIMER_SECONDS'
  | 'SET_TIMER_EXACT_MS'
  | 'ADD_RED_SCORE'
  | 'SUB_RED_SCORE'
  | 'ADD_BLUE_SCORE'
  | 'SUB_BLUE_SCORE'
  | 'SET_RED_SCORE'
  | 'SET_BLUE_SCORE'
  | 'ADD_RED_PENALTY'
  | 'SUB_RED_PENALTY'
  | 'ADD_BLUE_PENALTY'
  | 'SUB_BLUE_PENALTY'
  | 'SET_RED_PENALTY'
  | 'SET_BLUE_PENALTY'
  | 'AWARD_SET_RED'
  | 'AWARD_SET_BLUE'
  | 'AWARD_SET_TIE'
  | 'NEXT_SET'
  | 'PREV_SET'
  | 'SWAP_SIDES'
  | 'SET_PHASE'
  | 'START_COUNTDOWN'
  | 'START_TIMEOUT'
  | 'START_INTERMISSION'
  | 'START_SUDDEN_DEATH'
  | 'SET_INTERMISSION_DURATION'
  | 'TRIGGER_BUZZER'
  | 'LOAD_MATCH'
  | 'RESET_MATCH'
  | 'UPDATE_TEAMS'
  | 'CONFIRM_MATCH_END'
  | 'DISMISS_WINNER_BANNER';

export interface MatchControlCommand {
  type: CommandType;
  arenaId?: number;
  intValue?: number;
  longValue?: number;
  stringValue?: string;
  phaseValue?: MatchPhase;
  teamRed?: string;
  teamBlue?: string;
  matchNumber?: string;
  tournamentName?: string;
}

export interface Team {
  id: number;
  name: string;
  logoUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface SponsorItem {
  id: number;
  name: string;
  logoUrl: string;
  tagline?: string;
  displayDurationSec: number;
  active: boolean;
  orderIndex: number;
}

export interface ScheduledMatch {
  id: number;
  matchNumber: string;
  tournamentName: string;
  arenaId: number;
  teamRed: string;
  teamBlue: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
  scheduledTime: string;
  orderIndex: number;
}

export interface MatchRecord {
  id: number;
  matchNumber: string;
  arenaId: number;
  tournamentName: string;
  teamRed: string;
  teamBlue: string;
  redSetScore: number;
  blueSetScore: number;
  winner: string | null;
  status: string;
  startTime: string;
  endTime: string;
  notes?: string;
  createdAt: string;
  setRecords: {
    id: number;
    setNumber: number;
    redScore: number;
    blueScore: number;
    redPenalties: number;
    bluePenalties: number;
    winner: string;
    durationSeconds: number;
    endedAt: string;
  }[];
}

export interface AuditLogEntry {
  id: number;
  arenaId: number;
  matchId: number;
  eventType: string;
  description: string;
  payloadJson?: string;
  timestamp: string;
}

export interface MatchScheduleInput {
  matchNumber?: string;
  tournamentName?: string;
  arenaId?: number;
  teamRed?: string;
  teamBlue?: string;
  scheduledTime?: string;
}

export interface PreloadScheduleRequest {
  matches?: MatchScheduleInput[];
  clearExisting?: boolean;
  autoLoadArenas?: boolean;
  defaultTournamentName?: string;
  csvContent?: string;
}

export interface PrimedArenaDTO {
  arenaId: number;
  arenaName: string;
  matchNumber: string;
  teamRed: string;
  teamBlue: string;
  teamRedLogoUrl?: string | null;
  teamBlueLogoUrl?: string | null;
  tournamentName: string;
}

export interface PreloadResultDTO {
  totalMatchesLoaded: number;
  totalArenasPrimed: number;
  uniqueTeams: string[];
  primedArenas: PrimedArenaDTO[];
  scheduledMatches: ScheduledMatch[];
  message: string;
}
