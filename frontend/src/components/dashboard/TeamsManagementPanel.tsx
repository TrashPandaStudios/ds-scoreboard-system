import React, { useState, useEffect, useRef } from 'react';
import { Team } from '../../types/scoreboard';
import { TeamBadge } from '../common/TeamBadge';
import { TeamRosterDialog } from './TeamRosterDialog';
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
  const [rosterTeam, setRosterTeam] = useState<Team | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingTeamId, setUploadingTeamId] = useState<number | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamFile, setNewTeamFile] = useState<File | null>(null);
  const [newTeamPreview, setNewTeamPreview] = useState<string | null>(null);
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

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
        setFeedbackMessage({ type: 'success', text: 'Team logo updated across active displays.' });
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
        setFeedbackMessage({ type: 'success', text: 'Team logo removed.' });
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
    if (!window.confirm(`Delete team "${name}" from the registry?`)) {
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

      if (newTeamFile && createdTeam.id) {
        const formData = new FormData();
        formData.append('file', newTeamFile);
        await fetch(`/api/teams/${createdTeam.id}/logo`, {
          method: 'POST',
          body: formData,
        });
      }

      setFeedbackMessage({ type: 'success', text: `Team "${createdTeam.name}" registered.` });
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
      handleUploadLogo(teamId, e.dataTransfer.files[0]);
    }
  };

  const filteredTeams = teams.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[var(--court-surface)] border border-[var(--court-line)]">
        <div>
          <h2 className="text-base font-bold text-[var(--court-ink)] flex items-center gap-2">
            <span>Team registry</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[var(--court-control-bg)] text-[var(--court-muted)] tabular-nums">
              {teams.length}
            </span>
          </h2>
          <p className="text-xs text-[var(--court-muted)] mt-0.5">
            Manage players for arena check-in and logos for live displays.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--court-muted)]" />
            <input
              type="text"
              placeholder="Search teams"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[var(--court-subtle)] border border-[var(--court-line)] rounded-lg text-xs text-[var(--court-ink)] placeholder:text-[var(--court-muted)]"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-opacity hover:opacity-90"
            style={{
              backgroundColor: 'var(--court-active-pill-bg)',
              color: 'var(--court-active-pill-fg)',
            }}
          >
            <Plus className="w-4 h-4" />
            <span>Add team</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackMessage && (
        <div
          className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-xs font-semibold border"
          style={
            feedbackMessage.type === 'success'
              ? {
                  backgroundColor: 'var(--signal-live-tint)',
                  borderColor: 'var(--signal-live-border)',
                  color: 'var(--signal-live-text)',
                }
              : {
                  backgroundColor: 'var(--drone-red-tint)',
                  borderColor: 'var(--drone-red-border)',
                  color: 'var(--drone-red-text)',
                }
          }
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button type="button" onClick={() => setFeedbackMessage(null)} className="p-1 opacity-75 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Teams Grid */}
      {filteredTeams.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-[var(--court-surface)] border border-[var(--court-line)]">
          <Users className="w-9 h-9 text-[var(--court-muted)] mb-2" />
          <h3 className="text-sm font-bold text-[var(--court-ink)]">
            {isLoading ? 'Loading teams...' : searchQuery ? 'No matching teams' : 'No teams registered yet'}
          </h3>
          <p className="text-xs text-[var(--court-muted)] max-w-md mt-1 mb-4">
            {searchQuery
              ? 'Try another search term or clear your filter.'
              : 'Teams are registered automatically when a schedule is preloaded, or you can add them manually.'}
          </p>
          {!searchQuery && !isLoading && (
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-xs font-semibold"
              style={{ backgroundColor: 'var(--drone-blue-solid)' }}
            >
              <Plus className="w-4 h-4" />
              <span>Register first team</span>
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
                className="flex flex-col justify-between p-4 rounded-xl bg-[var(--court-surface)] border border-[var(--court-line)] hover:border-[var(--court-muted)] transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="relative">
                      <TeamBadge teamName={team.name} logoUrl={team.logoUrl} side="neutral" size="xl" />
                      {isUploading && (
                        <div className="absolute inset-0 bg-[var(--court-surface)]/80 rounded-xl flex items-center justify-center">
                          <RefreshCw className="w-5 h-5 text-[var(--court-accent-link)] animate-spin" />
                        </div>
                      )}
                    </div>

                    <span
                      className="text-[11px] font-semibold px-2 py-0.5 rounded-full border"
                      style={
                        team.logoUrl
                          ? {
                              backgroundColor: 'var(--signal-live-tint)',
                              borderColor: 'var(--signal-live-border)',
                              color: 'var(--signal-live-text)',
                            }
                          : {
                              backgroundColor: 'var(--court-control-bg)',
                              borderColor: 'var(--court-line-soft)',
                              color: 'var(--court-muted)',
                            }
                      }
                    >
                      {team.logoUrl ? 'Custom logo' : 'Default'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[var(--court-ink)] truncate">{team.name}</h3>
                  <p className="text-xs text-[var(--court-muted)] mt-0.5">Team #{team.id}</p>
                </div>

                <button
                  type="button"
                  onClick={() => setRosterTeam(team)}
                  aria-label={`Manage players for ${team.name}`}
                  className="mt-4 inline-flex items-center justify-center gap-1.5 py-2 px-2.5 bg-[var(--court-control-bg)] hover:bg-[var(--court-control-hover)] text-[var(--court-ink)] rounded-lg text-xs font-semibold border border-[var(--court-line)]"
                >
                  <Users className="w-3.5 h-3.5" />
                  Manage players
                </button>

                <div className="mt-3 pt-3 border-t border-[var(--court-line-soft)] flex items-center gap-1.5">
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
                    type="button"
                    onClick={() => fileInputRefs.current[team.id]?.click()}
                    disabled={isUploading}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 bg-[var(--court-control-bg)] hover:bg-[var(--court-control-hover)] text-[var(--court-ink)] rounded-lg text-xs font-semibold border border-[var(--court-line)] transition-colors"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>{team.logoUrl ? 'Replace logo' : 'Upload logo'}</span>
                  </button>

                  {team.logoUrl && (
                    <button
                      type="button"
                      onClick={() => handleClearLogo(team.id)}
                      title="Clear custom logo"
                      className="p-1.5 bg-[var(--court-control-bg)] hover:bg-[var(--signal-amber-tint)] text-[var(--court-muted)] hover:text-[var(--signal-amber-text)] rounded-lg border border-[var(--court-line)] transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeleteTeam(team.id, team.name)}
                    title="Delete team"
                    className="p-1.5 bg-[var(--court-control-bg)] hover:bg-[var(--drone-red-tint)] text-[var(--court-muted)] hover:text-[var(--drone-red-text)] rounded-lg border border-[var(--court-line)] transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {rosterTeam && <TeamRosterDialog team={rosterTeam} onClose={() => setRosterTeam(null)} />}

      {/* Create Team Modal */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          style={{ backgroundColor: 'var(--court-overlay-backdrop)' }}
        >
          <div className="w-full max-w-md bg-[var(--court-surface)] border border-[var(--court-line)] rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--court-line-soft)]">
              <h3 className="text-lg font-bold text-[var(--court-ink)]">Register new team</h3>
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setNewTeamPreview(null);
                  setNewTeamFile(null);
                }}
                className="p-1.5 rounded-lg text-[var(--court-muted)] hover:text-[var(--court-ink)] hover:bg-[var(--court-control-bg)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTeamSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--court-ink-secondary)] mb-1.5">
                  Team name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Red Phoenix"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[var(--court-subtle)] border border-[var(--court-line)] rounded-lg text-[var(--court-ink)] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--court-ink-secondary)] mb-1.5">
                  Team logo (optional)
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl bg-[var(--court-subtle)] border border-[var(--court-line)] flex items-center justify-center overflow-hidden shrink-0">
                    {newTeamPreview ? (
                      <img src={newTeamPreview} alt="Preview" className="w-full h-full object-contain p-1" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-[var(--court-muted)]" />
                    )}
                  </div>

                  <label className="flex-1 flex flex-col items-center justify-center px-4 py-3 border border-dashed border-[var(--court-line)] hover:border-[var(--court-accent-link)] rounded-xl cursor-pointer bg-[var(--court-subtle)] transition-colors">
                    <UploadCloud className="w-4 h-4 text-[var(--court-accent-link)] mb-1" />
                    <span className="text-xs font-semibold text-[var(--court-ink)]">
                      {newTeamFile ? newTeamFile.name : 'Choose logo file'}
                    </span>
                    <span className="text-[11px] text-[var(--court-muted)]">PNG, SVG, JPG, WebP up to 5MB</span>
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

              <div className="pt-4 border-t border-[var(--court-line-soft)] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-[var(--court-muted)] hover:text-[var(--court-ink)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNew || !newTeamName.trim()}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                  style={{ backgroundColor: 'var(--drone-blue-solid)' }}
                >
                  {isSubmittingNew ? 'Saving...' : 'Register team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
