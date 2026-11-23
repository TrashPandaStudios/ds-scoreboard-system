import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useSpectatorTheme } from '../hooks/useSpectatorTheme';

export const NotFound: React.FC = () => {
  const { theme } = useSpectatorTheme();
  return (
    <div
      className="app-shell min-h-screen flex flex-col items-center justify-center p-6 text-center"
      data-theme={theme}
    >
      <div className="max-w-sm rounded-2xl bg-[var(--court-surface)] border border-[var(--court-line)] p-8">
        <div className="spectator-numeral text-6xl font-black text-[var(--court-ink)] leading-none">
          404
        </div>
        <h1 className="text-lg font-bold text-[var(--court-ink)] mt-2">Page not found</h1>
        <p className="text-sm text-[var(--court-muted)] mt-1.5">
          The requested arena view or scoreboard route does not exist.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
          style={{
            backgroundColor: 'var(--court-active-pill-bg)',
            color: 'var(--court-active-pill-fg)',
          }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Arena Hub</span>
        </Link>
      </div>
    </div>
  );
};
