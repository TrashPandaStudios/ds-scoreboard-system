import { useEffect, useRef, useCallback } from 'react';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useArenaStore } from '../store/arenaStore';
import {
  ArenaState,
  ArenaSummary,
  CommandType,
  MatchControlCommand,
  QueuedCommand,
} from '../types/scoreboard';

const STOMP_HEARTBEAT_MS = 3000;
const WS_STALE_FALLBACK_MS = 4500;
const WS_ZOMBIE_RESET_MS = 7500;
const HTTP_POLL_INTERVAL_MS = 1000;
const HTTP_TIMEOUT_MS = 2500;
const WS_COMMAND_ACK_TIMEOUT_MS = 750;
const TIMER_COMMAND_TTL_MS = 6000;
const OUTBOX_RETRY_DELAY_MS = 1500;

// Delta score/penalty commands are safe and valuable to queue durably during prolonged RF blackouts
const DURABLE_DELTA_COMMANDS = new Set<CommandType>([
  'ADD_RED_SCORE',
  'SUB_RED_SCORE',
  'ADD_BLUE_SCORE',
  'SUB_BLUE_SCORE',
  'ADD_RED_PENALTY',
  'SUB_RED_PENALTY',
  'ADD_BLUE_PENALTY',
  'SUB_BLUE_PENALTY',
]);

// Explicit timer start/pause commands use a short TTL so stale commands never fire unexpectedly late
const SHORT_TTL_TIMER_COMMANDS = new Set<CommandType>(['START_TIMER', 'PAUSE_TIMER']);

let commandSequence = 0;

function generateCommandId(): string {
  commandSequence += 1;
  const rand = Math.random().toString(36).slice(2, 8);
  return `cmd-${Date.now().toString(36)}-${commandSequence}-${rand}`;
}

async function fetchJsonWithTimeout<T>(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = HTTP_TIMEOUT_MS
): Promise<T | null> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      cache: 'no-store',
      ...options,
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } finally {
    window.clearTimeout(timer);
  }
}

export function useArenaWebSocket(arenaId?: number) {
  const clientRef = useRef<Client | null>(null);
  const lastWsActivityRef = useRef<number>(0);
  const wsConnectedRef = useRef<boolean>(false);
  const nativeWsFailuresRef = useRef<number>(0);
  const httpPollInFlightRef = useRef<boolean>(false);
  const drainingArenasRef = useRef<Set<number>>(new Set());
  const outboxRetryTimerRef = useRef<number | null>(null);

  const {
    setConnectionStatus,
    setTransportMode,
    setArenaState,
    setArenaSummaries,
    triggerVisualBuzzer,
    incrementPendingCommands,
    decrementPendingCommands,
    setCommandError,
    enqueueOutboxCommand,
    removeOutboxCommand,
    clearOutbox,
  } = useArenaStore();

  const isWsHealthyNow = useCallback((): boolean => {
    const msSinceWsActivity =
      lastWsActivityRef.current > 0 ? Date.now() - lastWsActivityRef.current : Number.POSITIVE_INFINITY;
    return Boolean(clientRef.current?.connected) && wsConnectedRef.current && msSinceWsActivity <= WS_STALE_FALLBACK_MS;
  }, []);

  // Wait briefly for a specific commandId (or stateVersion advancement) over WebSocket
  const waitForWsCommandAck = useCallback(
    (
      targetArenaId: number,
      commandId: string,
      preVersion: number,
      preBuzzerTs: number,
      type: CommandType
    ): Promise<boolean> => {
      return new Promise<boolean>((resolve) => {
        const checkConfirmed = () => {
          const s = useArenaStore.getState();
          const st = s.arenaStates[targetArenaId];
          if (st?.lastCommandId === commandId) return true;
          if (!DURABLE_DELTA_COMMANDS.has(type) && (st?.stateVersion ?? 0) > preVersion) return true;
          if (type === 'TRIGGER_BUZZER' && s.buzzerTriggerTimestamp > preBuzzerTs) return true;
          return false;
        };

        if (checkConfirmed()) {
          resolve(true);
          return;
        }

        let settled = false;
        const unsubscribe = useArenaStore.subscribe(() => {
          if (!settled && checkConfirmed()) {
            settled = true;
            window.clearTimeout(timeoutId);
            unsubscribe();
            resolve(true);
          }
        });

        const timeoutId = window.setTimeout(() => {
          if (!settled) {
            settled = true;
            unsubscribe();
            resolve(false);
          }
        }, WS_COMMAND_ACK_TIMEOUT_MS);
      });
    },
    []
  );

  // Drains queued durable score/penalty commands strictly in FIFO order for a given arena
  const drainOutbox = useCallback(
    async (targetArenaId: number) => {
      if (drainingArenasRef.current.has(targetArenaId)) return;
      const initialQueue = useArenaStore.getState().commandOutbox[targetArenaId];
      if (!initialQueue || initialQueue.length === 0) return;

      drainingArenasRef.current.add(targetArenaId);
      if (outboxRetryTimerRef.current !== null) {
        window.clearTimeout(outboxRetryTimerRef.current);
        outboxRetryTimerRef.current = null;
      }

      try {
        while (true) {
          const state = useArenaStore.getState();
          const queue = state.commandOutbox[targetArenaId];
          if (!queue || queue.length === 0) {
            break;
          }

          const head: QueuedCommand = queue[0];
          const currentArena = state.arenaStates[targetArenaId];

          // Client-side stale guardrail before sending (server also enforces this)
          if (
            currentArena &&
            ((head.expectedMatchNumber &&
              currentArena.matchNumber &&
              head.expectedMatchNumber !== currentArena.matchNumber) ||
              (head.expectedSet != null &&
                currentArena.currentSet != null &&
                head.expectedSet !== currentArena.currentSet))
          ) {
            removeOutboxCommand(targetArenaId, head.commandId);
            continue;
          }

          // Fast path: if WS is healthy, send over native WS and confirm by commandId
          let delivered = false;
          if (isWsHealthyNow() && clientRef.current) {
            const preVersion = currentArena?.stateVersion ?? 0;
            const preBuzzerTs = state.buzzerTriggerTimestamp;
            clientRef.current.publish({
              destination: `/app/arena/${targetArenaId}/command`,
              body: JSON.stringify(head.payload),
            });

            delivered = await waitForWsCommandAck(
              targetArenaId,
              head.commandId,
              preVersion,
              preBuzzerTs,
              head.type
            );
            if (delivered) {
              removeOutboxCommand(targetArenaId, head.commandId);
              setCommandError(null);
              continue;
            }
          }

          // Reliable HTTP path (used immediately when WS is down/stale, or if WS ack timed out)
          try {
            const updatedState = await fetchJsonWithTimeout<ArenaState>(
              `/api/arenas/${targetArenaId}/command`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(head.payload),
              },
              3000
            );
            if (updatedState && updatedState.arenaId) {
              removeOutboxCommand(targetArenaId, head.commandId);
              setArenaState(targetArenaId, updatedState);
              setCommandError(null);
              if (!wsConnectedRef.current) {
                setTransportMode('HTTP_FALLBACK');
              }
              delivered = true;
            }
          } catch {
            // Still offline / RF blackout — stop loop and retry shortly without dropping the command
          }

          if (!delivered) {
            if (!wsConnectedRef.current) {
              setTransportMode('OFFLINE');
            }
            outboxRetryTimerRef.current = window.setTimeout(() => {
              outboxRetryTimerRef.current = null;
              drainOutbox(targetArenaId);
            }, OUTBOX_RETRY_DELAY_MS);
            break;
          }
        }
      } finally {
        drainingArenasRef.current.delete(targetArenaId);
      }
    },
    [isWsHealthyNow, waitForWsCommandAck, removeOutboxCommand, setArenaState, setCommandError, setTransportMode]
  );

  const handleStateMessage = useCallback(
    (msg: IMessage) => {
      lastWsActivityRef.current = Date.now();
      try {
        const state: ArenaState = JSON.parse(msg.body);
        if (state.arenaId) {
          setArenaState(state.arenaId, state);
          setTransportMode('WS');
        }
      } catch (e) {
        console.error('Failed to parse arena state message:', e);
      }
    },
    [setArenaState, setTransportMode]
  );

  const handleSummaryMessage = useCallback(
    (msg: IMessage) => {
      lastWsActivityRef.current = Date.now();
      try {
        const summaries: ArenaSummary[] = JSON.parse(msg.body);
        setArenaSummaries(summaries);
        setTransportMode('WS');
      } catch (e) {
        console.error('Failed to parse summaries message:', e);
      }
    },
    [setArenaSummaries, setTransportMode]
  );

  const handleBuzzerMessage = useCallback(
    (_msg: IMessage) => {
      lastWsActivityRef.current = Date.now();
      if (arenaId) {
        triggerVisualBuzzer(arenaId);
      }
    },
    [arenaId, triggerVisualBuzzer]
  );

  // Pulls an authoritative HTTP snapshot (used on initial load, tab wake-up, and RF fallback polling)
  const fetchSnapshot = useCallback(async (): Promise<boolean> => {
    if (httpPollInFlightRef.current) return false;
    httpPollInFlightRef.current = true;
    try {
      if (arenaId) {
        const data = await fetchJsonWithTimeout<ArenaState>(`/api/arenas/${arenaId}`);
        if (data && data.arenaId) {
          setArenaState(arenaId, data);
          if (!wsConnectedRef.current || Date.now() - lastWsActivityRef.current > WS_STALE_FALLBACK_MS) {
            setTransportMode('HTTP_FALLBACK');
          }
          // Connectivity is alive over HTTP — flush any queued offline referee commands immediately
          drainOutbox(arenaId);
          return true;
        }
      } else {
        const summaries = await fetchJsonWithTimeout<ArenaSummary[]>('/api/arenas');
        if (Array.isArray(summaries)) {
          setArenaSummaries(summaries);
          if (!wsConnectedRef.current || Date.now() - lastWsActivityRef.current > WS_STALE_FALLBACK_MS) {
            setTransportMode('HTTP_FALLBACK');
          }
          return true;
        }
      }
      return false;
    } catch {
      if (!wsConnectedRef.current) {
        setTransportMode('OFFLINE');
      }
      return false;
    } finally {
      httpPollInFlightRef.current = false;
    }
  }, [arenaId, setArenaState, setArenaSummaries, setTransportMode, drainOutbox]);

  useEffect(() => {
    setConnectionStatus(false, true, null, 'OFFLINE');
    nativeWsFailuresRef.current = 0;

    // Fetch authoritative state immediately over HTTP without waiting for WS handshake
    fetchSnapshot();

    const isHttps = window.location.protocol === 'https:';
    const host = window.location.host;
    const rawWsUrl = `${isHttps ? 'wss:' : 'ws:'}//${host}/ws-scoreboard-raw`;
    const sockJsUrl = `${isHttps ? 'https:' : 'http:'}//${host}/ws-scoreboard`;

    const stompClient = new Client({
      // Prefer low-overhead native WebSocket; transparently fall back to SockJS only if native WS fails repeatedly
      webSocketFactory: () => {
        const useSockJs = typeof WebSocket === 'undefined' || nativeWsFailuresRef.current >= 2;
        const socket = useSockJs ? new SockJS(sockJsUrl) : new WebSocket(rawWsUrl);

        // Track every inbound frame (including STOMP '\n' heartbeats!) for zombie-connection detection
        const markAlive = () => {
          lastWsActivityRef.current = Date.now();
        };
        socket.addEventListener('message', markAlive);
        socket.addEventListener('open', () => {
          lastWsActivityRef.current = Date.now();
          if (!useSockJs) {
            nativeWsFailuresRef.current = 0;
          }
        });
        socket.addEventListener('error', () => {
          if (!useSockJs && !wsConnectedRef.current) {
            nativeWsFailuresRef.current += 1;
          }
        });

        return socket as unknown as WebSocket;
      },
      reconnectDelay: 1000,
      connectionTimeout: 4000,
      heartbeatIncoming: STOMP_HEARTBEAT_MS,
      heartbeatOutgoing: STOMP_HEARTBEAT_MS,
      debug: () => {
        // quiet debug logs in production
      },
      onConnect: () => {
        wsConnectedRef.current = true;
        lastWsActivityRef.current = Date.now();
        setConnectionStatus(true, false, null, 'WS');
        setCommandError(null);

        if (arenaId) {
          // Single-arena views ONLY subscribe to their own arena to eliminate multi-arena summary traffic
          stompClient.subscribe(`/topic/arena/${arenaId}/state`, handleStateMessage);
          stompClient.subscribe(`/topic/arena/${arenaId}/buzzer`, handleBuzzerMessage);
        } else {
          // HubHome & MasterDashboard subscribe to multi-arena summaries
          stompClient.subscribe('/topic/arenas/summary', handleSummaryMessage);
        }

        // Resync full snapshot immediately upon (re)connect, which also flushes any queued outbox taps
        fetchSnapshot();
      },
      onDisconnect: () => {
        wsConnectedRef.current = false;
        setConnectionStatus(false, false);
      },
      onStompError: (frame) => {
        wsConnectedRef.current = false;
        console.error('STOMP protocol error:', frame.headers['message']);
        setConnectionStatus(false, false, frame.headers['message']);
      },
      onWebSocketClose: () => {
        wsConnectedRef.current = false;
        setConnectionStatus(false, true);
      },
    });

    stompClient.activate();
    clientRef.current = stompClient;

    // 1-second resilience watchdog: detects silent half-open sockets and keeps state live via HTTP fallback
    const watchdogTimer = window.setInterval(() => {
      const now = Date.now();
      const msSinceWsActivity =
        lastWsActivityRef.current > 0 ? now - lastWsActivityRef.current : Number.POSITIVE_INFINITY;

      const isWsStale = wsConnectedRef.current && msSinceWsActivity > WS_STALE_FALLBACK_MS;
      const isWsZombie = wsConnectedRef.current && msSinceWsActivity > WS_ZOMBIE_RESET_MS;

      if (isWsZombie && clientRef.current) {
        // Socket went silently half-open under RF interference — recycle it cleanly
        wsConnectedRef.current = false;
        setConnectionStatus(false, true, 'Socket stalled — reconnecting');
        try {
          clientRef.current.forceDisconnect();
        } catch {
          // Ignore forceDisconnect errors on already-closing sockets
        }
      }

      if (!wsConnectedRef.current || isWsStale) {
        fetchSnapshot();
      } else if (arenaId && (useArenaStore.getState().commandOutbox[arenaId]?.length ?? 0) > 0) {
        drainOutbox(arenaId);
      }
    }, HTTP_POLL_INTERVAL_MS);

    // Mobile browsers suspend WebSockets when screen dims or tab backgrounds — resync immediately on wake!
    const handleWakeOrOnline = () => {
      if (document.visibilityState === 'hidden') return;
      fetchSnapshot();
      const msSinceWsActivity =
        lastWsActivityRef.current > 0 ? Date.now() - lastWsActivityRef.current : Number.POSITIVE_INFINITY;
      if (clientRef.current && (!wsConnectedRef.current || msSinceWsActivity > WS_STALE_FALLBACK_MS)) {
        try {
          clientRef.current.forceDisconnect();
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('online', handleWakeOrOnline);
    document.addEventListener('visibilitychange', handleWakeOrOnline);

    return () => {
      window.clearInterval(watchdogTimer);
      if (outboxRetryTimerRef.current !== null) {
        window.clearTimeout(outboxRetryTimerRef.current);
        outboxRetryTimerRef.current = null;
      }
      window.removeEventListener('online', handleWakeOrOnline);
      document.removeEventListener('visibilitychange', handleWakeOrOnline);
      wsConnectedRef.current = false;
      if (clientRef.current) {
        clientRef.current.deactivate();
      }
    };
  }, [
    arenaId,
    fetchSnapshot,
    drainOutbox,
    handleStateMessage,
    handleSummaryMessage,
    handleBuzzerMessage,
    setConnectionStatus,
    setCommandError,
  ]);

  // Guaranteed-delivery command dispatcher:
  // - Score/Penalty deltas -> Durable FIFO Outbox (persisted + optimistic preview + match/set scoped)
  // - Explicit START_TIMER/PAUSE_TIMER -> Fast idempotent delivery with short 6s TTL (no stale late replay)
  // - Other commands (buzzer, phase, awards, overrides) -> WS + immediate HTTP fallback with commandId dedup
  const sendCommand = useCallback(
    async (type: CommandType, payload: Partial<MatchControlCommand> = {}) => {
      const targetArenaId = payload.arenaId ?? arenaId;
      if (!targetArenaId) return;

      const commandId = payload.commandId ?? generateCommandId();
      const currentArena = useArenaStore.getState().arenaStates[targetArenaId];

      // 1) Durable Outbox path for score & penalty deltas on tracked arenas
      if (DURABLE_DELTA_COMMANDS.has(type) && arenaId === targetArenaId) {
        const expectedMatchNumber = currentArena?.matchNumber;
        const expectedSet = currentArena?.currentSet;
        const command: MatchControlCommand = {
          type,
          arenaId: targetArenaId,
          commandId,
          expectedMatchNumber,
          expectedSet,
          ...payload,
        };

        enqueueOutboxCommand({
          commandId,
          arenaId: targetArenaId,
          type,
          payload: command,
          enqueuedAt: Date.now(),
          expectedMatchNumber,
          expectedSet,
        });

        drainOutbox(targetArenaId);
        return;
      }

      // 2) Immediate path (with short TTL for explicit START_TIMER / PAUSE_TIMER)
      const command: MatchControlCommand = {
        type,
        arenaId: targetArenaId,
        commandId,
        ...payload,
      };

      const isTimerTtlCmd = SHORT_TTL_TIMER_COMMANDS.has(type);
      const deadline = isTimerTtlCmd ? Date.now() + TIMER_COMMAND_TTL_MS : Number.POSITIVE_INFINITY;

      const sendViaHttpWithRetries = async (maxAttempts: number): Promise<boolean> => {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          if (Date.now() > deadline) return false;
          const remainingMs = isTimerTtlCmd ? Math.min(2500, Math.max(500, deadline - Date.now())) : 3000;
          try {
            const updatedState = await fetchJsonWithTimeout<ArenaState>(
              `/api/arenas/${targetArenaId}/command`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(command),
              },
              remainingMs
            );
            if (updatedState && updatedState.arenaId) {
              setArenaState(targetArenaId, updatedState);
              setCommandError(null);
              if (!wsConnectedRef.current) {
                setTransportMode('HTTP_FALLBACK');
              }
              return true;
            }
          } catch {
            // Retry on transient wireless packet loss / timeout
          }
          if (attempt < maxAttempts && Date.now() + attempt * 300 < deadline) {
            await new Promise((resolve) => window.setTimeout(resolve, attempt * 300));
          }
        }
        return false;
      };

      incrementPendingCommands();
      try {
        if (isWsHealthyNow() && clientRef.current) {
          const preVersion = currentArena?.stateVersion ?? 0;
          const preBuzzerTs = useArenaStore.getState().buzzerTriggerTimestamp;

          clientRef.current.publish({
            destination: `/app/arena/${targetArenaId}/command`,
            body: JSON.stringify(command),
          });

          if (arenaId === targetArenaId) {
            const confirmedOverWs = await waitForWsCommandAck(
              targetArenaId,
              commandId,
              preVersion,
              preBuzzerTs,
              type
            );

            if (confirmedOverWs) {
              setCommandError(null);
              return;
            }

            // WS ack timed out under congestion — punch through via HTTP with identical commandId
            const ok = await sendViaHttpWithRetries(2);
            if (!ok) {
              setCommandError(
                isTimerTtlCmd
                  ? `Clock command (${type === 'PAUSE_TIMER' ? 'PAUSE' : 'START'}) expired after 6s due to RF blackout. Tap again once connected.`
                  : `Network congestion: "${type}" could not reach server. Retrying connection...`
              );
            }
            return;
          }

          setCommandError(null);
          return;
        }

        // WebSocket is disconnected or stale — send immediately over HTTP with retries
        const ok = await sendViaHttpWithRetries(3);
        if (!ok) {
          setCommandError(
            isTimerTtlCmd
              ? `Clock command (${type === 'PAUSE_TIMER' ? 'PAUSE' : 'START'}) expired after 6s — check Wi-Fi and tap again.`
              : `Offline: "${type}" failed after retries. Check Wi-Fi connection.`
          );
        }
      } finally {
        decrementPendingCommands();
      }
    },
    [
      arenaId,
      enqueueOutboxCommand,
      drainOutbox,
      isWsHealthyNow,
      waitForWsCommandAck,
      setArenaState,
      setTransportMode,
      incrementPendingCommands,
      decrementPendingCommands,
      setCommandError,
    ]
  );

  const clearOutboxForArena = useCallback(
    (targetArenaId?: number) => {
      const id = targetArenaId ?? arenaId;
      if (id) {
        clearOutbox(id);
      }
    },
    [arenaId, clearOutbox]
  );

  return {
    sendCommand,
    clearOutboxForArena,
  };
}
