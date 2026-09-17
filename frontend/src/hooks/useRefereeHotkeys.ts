import { useEffect } from 'react';
import { CommandType, MatchControlCommand } from '../types/scoreboard';

interface RefereeHotkeyOptions {
  enabled?: boolean;
  onCommand: (type: CommandType, payload?: Partial<MatchControlCommand>) => void;
}

export function useRefereeHotkeys({ enabled = true, onCommand }: RefereeHotkeyOptions) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Safety Guard: Disable hotkeys when focused in inputs, textareas, or contentEditable elements
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          (activeEl as HTMLElement).isContentEditable ||
          activeEl.getAttribute('role') === 'textbox')
      ) {
        return;
      }

      // 2. Hotkey mappings
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          onCommand('TOGGLE_TIMER');
          break;

        // Blue Team Scores: W / S
        case 'KeyW':
          e.preventDefault();
          onCommand('ADD_BLUE_SCORE');
          break;
        case 'KeyS':
          e.preventDefault();
          onCommand('SUB_BLUE_SCORE');
          break;

        // Blue Team Penalties: E / D
        case 'KeyE':
          e.preventDefault();
          onCommand('ADD_BLUE_PENALTY');
          break;
        case 'KeyD':
          e.preventDefault();
          onCommand('SUB_BLUE_PENALTY');
          break;

        // Red Team Scores / Penalties: ArrowUp / ArrowDown
        case 'ArrowUp':
          e.preventDefault();
          if (e.shiftKey) {
            onCommand('ADD_RED_PENALTY');
          } else {
            onCommand('ADD_RED_SCORE');
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (e.shiftKey) {
            onCommand('SUB_RED_PENALTY');
          } else {
            onCommand('SUB_RED_SCORE');
          }
          break;

        // Hardware / Stadium Buzzer: B
        case 'KeyB':
          e.preventDefault();
          onCommand('TRIGGER_BUZZER');
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, onCommand]);
}
