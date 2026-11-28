import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HubHome } from './pages/HubHome';
import { CrowdDisplay } from './pages/CrowdDisplay';
import { RefereeConsole } from './pages/RefereeConsole';
import { ArenaCheckIn } from './pages/ArenaCheckIn';
import { MasterDashboard } from './pages/MasterDashboard';
import { PublicLiveHub } from './pages/PublicLiveHub';
import { PublicMatchDetail } from './pages/PublicMatchDetail';
import { PublicArenaDisplay } from './pages/PublicArenaDisplay';
import { OBSLowerThird } from './pages/overlays/OBSLowerThird';
import { OBSTopBar } from './pages/overlays/OBSTopBar';
import { OBSPenaltyAlert } from './pages/overlays/OBSPenaltyAlert';
import { RedTeamDisplay } from './pages/displays/RedTeamDisplay';
import { BlueTeamDisplay } from './pages/displays/BlueTeamDisplay';
import { DedicatedTimerDisplay } from './pages/displays/DedicatedTimerDisplay';
import { SplitTeamsDisplay } from './pages/displays/SplitTeamsDisplay';
import { NotFound } from './pages/NotFound';
import { PublicPortalContext } from './types/scoreboard';

export const App: React.FC = () => {
  const isExplicitLivePath =
    typeof window !== 'undefined' &&
    (window.location.pathname === '/live' || window.location.pathname.startsWith('/live/'));

  const [portalMode, setPortalMode] = useState<'loading' | 'public' | 'staff'>(
    isExplicitLivePath ? 'public' : 'loading'
  );
  const [isPublicPortalOrigin, setIsPublicPortalOrigin] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/public/context', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: PublicPortalContext | null) => {
        if (cancelled) return;
        const isPublic = Boolean(data?.publicPortal);
        setIsPublicPortalOrigin(isPublic);
        setPortalMode(isPublic ? 'public' : 'staff');
      })
      .catch(() => {
        if (cancelled) return;
        setPortalMode(isExplicitLivePath ? 'public' : 'staff');
      });

    return () => {
      cancelled = true;
    };
  }, [isExplicitLivePath]);

  // Brief loading shell only while resolving whether this origin is the locked-down public portal
  if (portalMode === 'loading') {
    return (
      <div className="app-shell min-h-screen flex items-center justify-center text-sm font-medium text-[var(--court-muted)]">
        <span>Loading scoreboard...</span>
      </div>
    );
  }

  // Strict Public Spectator Portal (served via Cloudflare Tunnel or dedicated PUBLIC_PORT)
  if (isPublicPortalOrigin) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PublicLiveHub />} />
          <Route path="/live" element={<PublicLiveHub />} />
          <Route path="/live/arena/:id" element={<PublicMatchDetail publicPortalMode={true} />} />
          <Route path="/live/arena/:id/display" element={<PublicArenaDisplay publicPortalMode={true} />} />
          <Route path="/live/arena/:id/info" element={<PublicArenaDisplay publicPortalMode={true} />} />
          <Route path="/live/arena/:id/board" element={<PublicArenaDisplay publicPortalMode={true} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

  // Full Staff / LAN Portal (also exposes /live & /live/arena/:id/* for previewing or LAN sharing)
  return (
    <BrowserRouter>
      <Routes>
        {/* Portal Home */}
        <Route path="/" element={<HubHome />} />

        {/* Public Live Spectator Portal & Arena Info Displays (Preview / LAN Share) */}
        <Route path="/live" element={<PublicLiveHub />} />
        <Route path="/live/arena/:id" element={<PublicMatchDetail publicPortalMode={false} />} />
        <Route path="/live/arena/:id/display" element={<PublicArenaDisplay publicPortalMode={false} />} />
        <Route path="/live/arena/:id/info" element={<PublicArenaDisplay publicPortalMode={false} />} />
        <Route path="/live/arena/:id/board" element={<PublicArenaDisplay publicPortalMode={false} />} />

        {/* Stadium Display */}
        <Route path="/arena/:id/display" element={<CrowdDisplay />} />
        <Route path="/display" element={<Navigate to="/arena/1/display" replace />} />

        {/* Dedicated Monitor Displays */}
        <Route path="/arena/:id/display/red" element={<RedTeamDisplay />} />
        <Route path="/arena/:id/red" element={<RedTeamDisplay />} />

        <Route path="/arena/:id/display/blue" element={<BlueTeamDisplay />} />
        <Route path="/arena/:id/blue" element={<BlueTeamDisplay />} />

        <Route path="/arena/:id/display/timer" element={<DedicatedTimerDisplay />} />
        <Route path="/arena/:id/timer" element={<DedicatedTimerDisplay />} />

        <Route path="/arena/:id/display/split" element={<SplitTeamsDisplay />} />
        <Route path="/arena/:id/teams" element={<SplitTeamsDisplay />} />

        {/* Referee Console */}
        <Route path="/arena/:id/referee" element={<RefereeConsole />} />
        <Route path="/referee" element={<Navigate to="/arena/1/referee" replace />} />
        <Route path="/arena/:id/admin" element={<RefereeConsole />} />
        <Route path="/arena/:id/check-in" element={<ArenaCheckIn />} />

        {/* Admin Panel & Master Tournament Dashboard */}
        <Route path="/admin" element={<Navigate to="/master" replace />} />
        <Route path="/admin-panel" element={<MasterDashboard />} />
        <Route path="/master" element={<MasterDashboard />} />

        {/* Broadcast OBS Overlays (Dedicated Transparent Views) */}
        <Route path="/arena/:id/overlay/lower-third" element={<OBSLowerThird />} />
        <Route path="/arena/:id/overlay/top-bar" element={<OBSTopBar />} />
        <Route path="/arena/:id/overlay/penalty-alert" element={<OBSPenaltyAlert />} />

        {/* 404 Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
