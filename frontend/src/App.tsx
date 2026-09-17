import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HubHome } from './pages/HubHome';
import { CrowdDisplay } from './pages/CrowdDisplay';
import { RefereeConsole } from './pages/RefereeConsole';
import { MasterDashboard } from './pages/MasterDashboard';
import { OBSLowerThird } from './pages/overlays/OBSLowerThird';
import { OBSTopBar } from './pages/overlays/OBSTopBar';
import { OBSPenaltyAlert } from './pages/overlays/OBSPenaltyAlert';
import { RedTeamDisplay } from './pages/displays/RedTeamDisplay';
import { BlueTeamDisplay } from './pages/displays/BlueTeamDisplay';
import { DedicatedTimerDisplay } from './pages/displays/DedicatedTimerDisplay';
import { SplitTeamsDisplay } from './pages/displays/SplitTeamsDisplay';
import { NotFound } from './pages/NotFound';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Portal Home */}
        <Route path="/" element={<HubHome />} />

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
