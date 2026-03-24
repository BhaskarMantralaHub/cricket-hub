'use client';

import { useEffect, useState } from 'react';
import { AuthGate } from '@/components/AuthGate';
import { useAuthStore } from '@/stores/auth-store';
import { useTeamStore } from '@/stores/team-store';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { CricketTeam, CricketTeamMember } from '@/types/cricket';

function AdminPanel() {
  const { isSuperAdmin } = useAuthStore();
  const { allTeams, loadAllTeams, createTeam } = useTeamStore();

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newColor, setNewColor] = useState('#FBBF24');
  const [creating, setCreating] = useState(false);

  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [members, setMembers] = useState<(CricketTeamMember & { email?: string; full_name?: string })[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Add member form
  const [addEmail, setAddEmail] = useState('');
  const [addRole, setAddRole] = useState<'team_admin' | 'player'>('player');
  const [addError, setAddError] = useState('');

  useEffect(() => {
    if (isSuperAdmin) loadAllTeams();
  }, [isSuperAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isSuperAdmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <div className="mb-3 text-4xl">🔒</div>
          <h2 className="mb-2 text-xl font-bold text-[var(--text)]">Access Denied</h2>
          <p className="text-[var(--muted)]">Only platform admins can access this page.</p>
        </div>
      </div>
    );
  }

  const handleCreate = async () => {
    if (!newName.trim() || !newSlug.trim()) return;
    setCreating(true);
    await createTeam(newName.trim(), newSlug.trim(), newColor);
    setNewName('');
    setNewSlug('');
    setShowCreate(false);
    setCreating(false);
  };

  const loadMembers = async (teamId: string) => {
    setSelectedTeam(teamId);
    setLoadingMembers(true);
    const supabase = getSupabaseClient();
    if (!supabase) { setLoadingMembers(false); return; }

    const { data } = await supabase
      .from('cricket_team_members')
      .select('*, profiles(email, full_name)')
      .eq('team_id', teamId)
      .order('joined_at');

    const mapped = (data ?? []).map((m: Record<string, unknown>) => ({
      ...(m as CricketTeamMember),
      email: (m.profiles as Record<string, string>)?.email,
      full_name: (m.profiles as Record<string, string>)?.full_name,
    }));
    setMembers(mapped);
    setLoadingMembers(false);
  };

  const handleAddMember = async () => {
    if (!addEmail.trim() || !selectedTeam) return;
    setAddError('');
    const supabase = getSupabaseClient();
    if (!supabase) return;

    // Find user by email
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .ilike('email', addEmail.trim())
      .maybeSingle();

    if (!profile) {
      setAddError('No user found with that email.');
      return;
    }

    const { error } = await supabase
      .from('cricket_team_members')
      .insert({ team_id: selectedTeam, user_id: profile.id, role: addRole, approved: true });

    if (error) {
      setAddError(error.message.includes('duplicate') ? 'User is already a member.' : error.message);
      return;
    }

    setAddEmail('');
    loadMembers(selectedTeam);
  };

  const handleRemoveMember = async (id: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    await supabase.from('cricket_team_members').delete().eq('id', id);
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 text-[24px] font-bold text-[var(--text)]">⚙️ Admin Panel</h1>

        {/* Create Team */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[18px] font-semibold text-[var(--text)]">Teams ({allTeams.length})</h2>
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="rounded-xl bg-gradient-to-r from-[var(--orange)] to-[var(--red)] px-4 py-2 text-[13px] font-semibold text-white cursor-pointer hover:opacity-90 transition-all"
            >
              + New Team
            </button>
          </div>

          {showCreate && (
            <div className="mb-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 animate-slide-in">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-[var(--muted)]">Team Name</label>
                  <input
                    value={newName}
                    onChange={(e) => {
                      setNewName(e.target.value);
                      setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
                    }}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-[14px] text-[var(--text)] outline-none focus:border-[var(--orange)] transition-all"
                    placeholder="Sunrisers Manteca"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-[var(--muted)]">URL Slug</label>
                  <input
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-[14px] text-[var(--text)] outline-none focus:border-[var(--orange)] transition-all font-mono"
                    placeholder="sunrisers-manteca"
                  />
                  <p className="mt-1 text-[11px] text-[var(--dim)]">/t/{newSlug || '...'}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <label className="text-[12px] font-medium text-[var(--muted)]">Color</label>
                <div className="flex items-center gap-1.5">
                  <div className="h-8 w-8 rounded-lg border border-[var(--border)]" style={{ background: newColor }} />
                  <input type="text" value={newColor} onChange={(e) => setNewColor(e.target.value)}
                    className="w-24 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-[13px] font-mono text-[var(--text)] outline-none focus:border-[var(--orange)] transition-all"
                    placeholder="#FBBF24" maxLength={7} />
                </div>
                <div className="flex-1" />
                <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-[13px] text-[var(--muted)] cursor-pointer hover:text-[var(--text)]">Cancel</button>
                <button onClick={handleCreate} disabled={creating || !newName.trim() || !newSlug.trim()}
                  className="rounded-xl bg-[var(--orange)] px-5 py-2 text-[13px] font-semibold text-white cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          )}

          {/* Team list */}
          <div className="space-y-2">
            {allTeams.map((team) => (
              <div key={team.id}
                className={`flex items-center gap-4 rounded-xl border p-4 cursor-pointer transition-all ${
                  selectedTeam === team.id
                    ? 'border-[var(--orange)]/50 bg-[var(--card)]'
                    : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border)]'
                }`}
                onClick={() => loadMembers(team.id)}
              >
                <div className="h-10 w-10 rounded-lg flex items-center justify-center text-lg"
                  style={{ background: `${team.primary_color ?? '#FBBF24'}25` }}>
                  {team.logo_url ? <img src={team.logo_url} alt="" className="h-7 w-7 rounded" /> : '🏏'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-medium text-[var(--text)] truncate">{team.name}</div>
                  <div className="text-[12px] text-[var(--dim)] font-mono">/t/{team.slug}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Members */}
        {selectedTeam && (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 animate-slide-in">
            <h3 className="mb-4 text-[16px] font-semibold text-[var(--text)]">
              Members — {allTeams.find((t) => t.id === selectedTeam)?.name}
            </h3>

            {/* Add member */}
            <div className="mb-4 flex gap-2">
              <input
                value={addEmail}
                onChange={(e) => { setAddEmail(e.target.value); setAddError(''); }}
                placeholder="user@example.com"
                className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[13px] text-[var(--text)] outline-none focus:border-[var(--orange)] transition-all"
              />
              <select value={addRole} onChange={(e) => setAddRole(e.target.value as 'team_admin' | 'player')}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[13px] text-[var(--text)] outline-none">
                <option value="player">Player</option>
                <option value="team_admin">Team Admin</option>
              </select>
              <button onClick={handleAddMember}
                className="rounded-xl bg-[var(--green)] px-4 py-2 text-[13px] font-medium text-white cursor-pointer hover:opacity-90 transition-all">
                Add
              </button>
            </div>
            {addError && <p className="mb-3 text-[12px] text-[var(--red)]">{addError}</p>}

            {loadingMembers ? (
              <div className="flex justify-center py-4">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--orange)] border-t-transparent" />
              </div>
            ) : (
              <div className="space-y-2">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                    <div className="h-8 w-8 rounded-full flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, var(--orange), var(--red))' }}>
                      {(m.full_name || m.email || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-[var(--text)] truncate">{m.full_name || 'Unknown'}</div>
                      <div className="text-[11px] text-[var(--dim)] truncate">{m.email}</div>
                    </div>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                      m.role === 'team_admin'
                        ? 'bg-[var(--orange)]/20 text-[var(--orange)]'
                        : 'bg-[var(--blue)]/20 text-[var(--blue)]'
                    }`}>
                      {m.role === 'team_admin' ? 'Admin' : 'Player'}
                    </span>
                    <button onClick={() => handleRemoveMember(m.id)}
                      className="text-[var(--dim)] hover:text-[var(--red)] cursor-pointer transition-colors text-[12px]">
                      ✕
                    </button>
                  </div>
                ))}
                {members.length === 0 && (
                  <p className="text-center text-[13px] text-[var(--muted)] py-4">No members yet</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <AuthGate>
      <AdminPanel />
    </AuthGate>
  );
}
