import { useCallback, useEffect, useRef, useState } from 'react';
import { staffRequest } from '../api/staffRequest';
import { useArenaStore } from '../store/arenaStore';
import { ArenaCheckInMatch, ArenaCheckInView, TeamSide } from '../types/scoreboard';

export function useArenaCheckIn(arenaId: number, includeRosters: boolean) {
  const [view, setView] = useState<ArenaCheckInView | null>(null);
  const [loadError, setLoadError] = useState('');
  const readSequence = useRef(0);
  const url = `/api/arenas/${arenaId}/check-in`;

  const refresh = useCallback(async () => {
    const sequence = ++readSequence.current;
    try {
      const response = await staffRequest(`${url}?includeRosters=${includeRosters}`);
      const data: ArenaCheckInView = await response.json();
      if (sequence !== readSequence.current) return;
      setView(data);
      setLoadError('');
    } catch {
      if (sequence === readSequence.current) setLoadError('Could not load arena check-in. Check the connection and retry.');
    }
  }, [url, includeRosters]);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(refresh, 6000);
    window.addEventListener('focus', refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
      readSequence.current++;
    };
  }, [refresh]);

  const save = async (match: ArenaCheckInMatch, side: TeamSide, strikerId: string | null, playerIds?: string[]) => {
    const teamUrl = `${url}/${side.toUpperCase()}`;
    let updated: ArenaCheckInMatch;
    try {
      const response = await staffRequest(playerIds === undefined ? `${teamUrl}/striker` : teamUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchToken: match.matchToken,
          lineupVersion: match[side].lineup?.version ?? null,
          strikerId,
          playerIds,
        }),
      });
      updated = await response.json();
    } catch (error) {
      void refresh();
      throw error;
    }
    if (updated.arenaState) useArenaStore.getState().setArenaState(arenaId, updated.arenaState);
    readSequence.current++;
    setView((current) => {
      if (current?.match.matchToken !== updated.matchToken
        || current.match[side].lineup?.version !== match[side].lineup?.version) return current;
      return { ...current, match: { ...current.match, [side]: updated[side] } };
    });
    void refresh();
  };

  return { view, loadError, refresh, save };
}
