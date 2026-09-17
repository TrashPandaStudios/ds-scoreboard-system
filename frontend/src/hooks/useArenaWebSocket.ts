import { useEffect, useRef, useCallback } from 'react';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useArenaStore } from '../store/arenaStore';
import { ArenaState, ArenaSummary, CommandType, MatchControlCommand } from '../types/scoreboard';

export function useArenaWebSocket(arenaId?: number) {
  const clientRef = useRef<Client | null>(null);
  const { setConnectionStatus, setArenaState, setArenaSummaries, triggerVisualBuzzer } = useArenaStore();

  const handleStateMessage = useCallback((msg: IMessage) => {
    try {
      const state: ArenaState = JSON.parse(msg.body);
      if (state.arenaId) {
        setArenaState(state.arenaId, state);
      }
    } catch (e) {
      console.error('Failed to parse arena state message:', e);
    }
  }, [setArenaState]);

  const handleSummaryMessage = useCallback((msg: IMessage) => {
    try {
      const summaries: ArenaSummary[] = JSON.parse(msg.body);
      setArenaSummaries(summaries);
    } catch (e) {
      console.error('Failed to parse summaries message:', e);
    }
  }, [setArenaSummaries]);

  const handleBuzzerMessage = useCallback((msg: IMessage) => {
    try {
      if (arenaId) {
        triggerVisualBuzzer(arenaId);
      }
    } catch (e) {
      console.error('Failed to parse buzzer message:', e);
    }
  }, [arenaId, triggerVisualBuzzer]);

  useEffect(() => {
    setConnectionStatus(false, true);

    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws-scoreboard`;

    const stompClient = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      reconnectDelay: 2000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: () => {
        // quiet debug logs in production
      },
      onConnect: () => {
        setConnectionStatus(true, false, null);

        // Always subscribe to multi-arena summaries
        stompClient.subscribe('/topic/arenas/summary', handleSummaryMessage);

        // If scoped to a specific arena, subscribe to that arena's topics
        if (arenaId) {
          stompClient.subscribe(`/topic/arena/${arenaId}/state`, handleStateMessage);
          stompClient.subscribe(`/topic/arena/${arenaId}/buzzer`, handleBuzzerMessage);

          // Fetch initial HTTP snapshot immediately in case we're waiting for next tick
          fetch(`/api/arenas/${arenaId}`)
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
              if (data) setArenaState(arenaId, data);
            })
            .catch(() => {});
        }
      },
      onDisconnect: () => {
        setConnectionStatus(false, false);
      },
      onStompError: (frame) => {
        console.error('STOMP protocol error:', frame.headers['message']);
        setConnectionStatus(false, false, frame.headers['message']);
      },
      onWebSocketClose: () => {
        setConnectionStatus(false, true);
      },
    });

    stompClient.activate();
    clientRef.current = stompClient;

    return () => {
      if (clientRef.current) {
        clientRef.current.deactivate();
      }
    };
  }, [arenaId, handleStateMessage, handleSummaryMessage, handleBuzzerMessage, setConnectionStatus, setArenaState]);

  const sendCommand = useCallback(
    async (type: CommandType, payload: Partial<MatchControlCommand> = {}) => {
      const targetArenaId = payload.arenaId ?? arenaId;
      if (!targetArenaId) return;

      const command: MatchControlCommand = {
        type,
        arenaId: targetArenaId,
        ...payload,
      };

      if (clientRef.current && clientRef.current.connected) {
        clientRef.current.publish({
          destination: `/app/arena/${targetArenaId}/command`,
          body: JSON.stringify(command),
        });
      } else {
        // Fallback to HTTP REST endpoint if WebSocket is reconnecting
        try {
          await fetch(`/api/arenas/${targetArenaId}/command`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(command),
          });
        } catch (e) {
          console.error('Failed to send command over HTTP fallback:', e);
        }
      }
    },
    [arenaId]
  );

  return {
    sendCommand,
  };
}
