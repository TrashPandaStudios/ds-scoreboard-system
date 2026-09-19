import React, { useState, useEffect, useRef } from 'react';
import { Team } from '../../types/scoreboard';
import { TeamBadge } from '../common/TeamBadge';
import {
  Users,
  Plus,
  UploadCloud,
  Trash2,
  X,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';

export const TeamsManagementPanel: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingTeamId, setUploadingTeamId] = useState<number | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New team modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamFile, setNewTeamFile] = useState<File | null>(null);
  const [newTeamPreview, setNewTeamPreview] = useState<string | null>(null);
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

  // File input refs for uploading
  const fileInputRefs = useRef<{ [teamId: number]: HTMLInputElement | null }>({});

  const fetchTeams = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/teams');
      if (res.ok) {
        const data = await res.json();
        setTeams(data);
      } else {
        setFeedbackMessage({ type: 'error', text: 'Failed to load teams from server' });
      }
    } catch (e) {
      console.error(e);
      setFeedbackMessage({ type: 'error', text: 'Network error loading teams' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleUploadLogo = async (teamId: number, file: File) => {
    if (!file) return;
    setUploadingTeamId(teamId);
    setFeedbackMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`/api/teams/${teamId}/logo`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setFeedbackMessage({ type: 'success', text: 'Team logo uploaded and pushed to active displays!' });
        await fetchTeams();
      } else {
        const err = await res.text();
        setFeedbackMessage({ type: 'error', text: err || 'Upload failed' });
      }
    } catch (e) {
      console.error(e);
      setFeedbackMessage({ type: 'error', text: 'Network error uploading logo' });
    } finally {
      setUploadingTeamId(null);
    }
  };

  const handleClearLogo = async (teamId: number) => {
    try {
      const res = await fetch(`/api/teams/${teamId}/logo`, { method: 'DELETE' });
      if (res.ok) {
        setFeedbackMessage({ type: 'success', text: 'Team logo removed. Reset to shield icon.' });
        await fetchTeams();
      } else {
        setFeedbackMessage({ type: 'error', text: 'Failed to clear logo' });
      }
    } catch (e) {
      console.error(e);
      setFeedbackMessage({ type: 'error', text: 'Network error removing logo' });
    }
  };

  const handleDeleteTeam = async (teamId: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete team "${name}" from the registry?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/teams/${teamId}`, { method: 'DELETE' });
      if (res.ok) {
        setFeedbackMessage({ type: 'success', text: `Team "${name}" deleted.` });
        await fetchTeams();
      } else {
        setFeedbackMessage({ type: 'error', text: 'Failed to delete team' });
      }
    } catch (e) {
      console.error(e);
      setFeedbackMessage({ type: 'error', text: 'Network error deleting team' });
    }
  };

  const handleCreateTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    setIsSubmittingNew(true);
    setFeedbackMessage(null);

    try {
      // 1. Create team
      const createRes = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTeamName.trim() }),
      });

      if (!createRes.ok) {
        const err = await createRes.text();
        throw new Error(err || 'Failed to create team');
      }

      const createdTeam: Team = await createRes.json();

      // 2. Upload logo if attached
      if (newTeamFile && createdTeam.id) {
        const formData = new FormData();
        formData.append('file', newTeamFile);
        await fetch(`/api/teams/${createdTeam.id}/logo`, {
          method: 'POST',
          body: formData,
        });
      }

      setFeedbackMessage({ type: 'success', text: `Team "${createdTeam.name}" registered successfully!` });
      setIsCreateModalOpen(false);
      setNewTeamName('');
      setNewTeamFile(null);
      setNewTeamPreview(null);
      await fetchTeams();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Error creating team' });
    } finally {
      setIsSubmittingNew(false);
    }
  };

  const handleFileDrop = (teamId: number, e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleUploadLogo(teamId, file);
    }
  };

  const filteredTeams = teams.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Action Header & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/40">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-display font-black text-white flex items-center gap-2">
              Team Registry & Logo Library
              <span className="text-xs font-mono font-bold bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/30">
                {teams.length} {teams.length === 1 ? 'Team' : 'Teams'}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Manage team identities, upload logos, and instantly push visual graphics to live OBS overlays and stadium screens.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-cyan-500/20 transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Team</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedbackMessage && (
        <div
          className={`flex items-center justify-between gap-3 p-4 rounded-xl text-sm font-medium border animate-in fade-in slide-in-from-top-2 ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
              : 'bg-rose-950/80 text-rose-300 border-rose-500/50'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Teams Grid */}
      {filteredTeams.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80">
          <Users className="w-12 h-12 text-slate-600 mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">
            {searchQuery ? 'No teams match your search' : 'No teams in registry yet'}
          </h3>
          <p className="text-xs text-slate-400 max-w-md mb-4">
            {searchQuery
              ? 'Try adjusting your search keywords or clear the filter.'
              : 'Teams are automatically registered when schedules are preloaded, or you can register new teams manually.'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-cyan-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Register First Team</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTeams.map((team) => {
            const isUploading = uploadingTeamId === team.id;
            return (
              <div
                key={team.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleFileDrop(team.id, e)}
                className="group relative flex flex-col justify-between p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 hover:border-cyan-500/50 shadow-lg hover:shadow-cyan-500/10 transition-all duration-200"
              >
                <div>
                  {/* Top Row: Badge & Status */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="relative">
                      <TeamBadge
                        teamName={team.name}
                        logoUrl={team.logoUrl}
                        side="neutral"
                        size="xl"
                        className="rounded-2xl shadow-inner border border-slate-700/80"
                      />
                      {isUploading && (
                        <div className="absolute inset-0 bg-slate-950/80 rounded-2xl flex items-center justify-center">
                          <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {team.logoUrl ? (
                        <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          Custom Logo
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700">
                          Shield Default
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Team Details */}
                  <h3 className="text-lg font-display font-black text-white tracking-wide truncate mb-1">
                    {team.name}
                  </h3>
                  <p className="text-[11px] font-mono text-slate-500">
                    ID: #{team.id} • Registered
                  </p>
                </div>

                {/* Actions Bar */}
                <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <input
                    type="file"
                    ref={(el) => (fileInputRefs.current[team.id] = el)}
                    className="hidden"
                    accept=".png,.jpg,.jpeg,.svg,.webp"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleUploadLogo(team.id, e.target.files[0]);
                      }
                    }}
                  />

                  <button
                    onClick={() => fileInputRefs.current[team.id]?.click()}
                    disabled={isUploading}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-slate-800 hover:bg-cyan-600 text-slate-200 hover:text-white rounded-xl text-xs font-bold border border-slate-700/80 hover:border-cyan-500 transition-all cursor-pointer"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>{team.logoUrl ? 'Replace' : 'Upload Logo'}</span>
                  </button>

                  {team.logoUrl && (
                    <button
                      onClick={() => handleClearLogo(team.id)}
                      title="Clear custom logo"
                      className="p-1.5 bg-slate-800/80 hover:bg-amber-950 text-slate-400 hover:text-amber-400 rounded-xl border border-slate-700 hover:border-amber-500/40 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteTeam(team.id, team.name)}
                    title="Delete team from registry"
                    className="p-1.5 bg-slate-800/80 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-xl border border-slate-700 hover:border-rose-500/40 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Team Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/40">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-display font-black text-white">Register New Team</h3>
              </div>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setNewTeamPreview(null);
                  setNewTeamFile(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTeamSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Team Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Red Phoenix"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Team Logo (Optional)
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {newTeamPreview ? (
                      <img src={newTeamPreview} alt="Preview" className="w-full h-full object-contain p-1" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-600" />
                    )}
                  </div>

                  <label className="flex-1 flex flex-col items-center justify-center px-4 py-3 border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-2xl cursor-pointer bg-slate-950/40 hover:bg-slate-950/80 transition-colors">
                    <UploadCloud className="w-5 h-5 text-cyan-400 mb-1" />
                    <span className="text-xs font-bold text-slate-300">
                      {newTeamFile ? newTeamFile.name : 'Choose Logo File'}
                    </span>
                    <span className="text-[10px] text-slate-500">PNG, SVG, JPG, WebP up to 5MB</span>
                    <input
                      type="file"
                      className="hidden"
                      accept=".png,.jpg,.jpeg,.svg,.webp"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          setNewTeamFile(file);
                          setNewTeamPreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNew || !newTeamName.trim()}
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white shadow-lg shadow-cyan-600/20"
                >
                  {isSubmittingNew ? 'Saving...' : 'Register Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
