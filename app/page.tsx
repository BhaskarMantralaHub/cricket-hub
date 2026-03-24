'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AuthGate } from '@/components/AuthGate';
import { useAuthStore } from '@/stores/auth-store';
import { useTeamStore, type UserTeam } from '@/stores/team-store';

function TeamSelector() {
  const { user, isSuperAdmin } = useAuthStore();
  const { myTeams, loadingTeams, loadMyTeams } = useTeamStore();

  useEffect(() => {
    if (user) loadMyTeams();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loadingTeams) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--orange)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-52px)] px-4 py-8 sm:py-12">
      {/* Ambient blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="absolute -top-[20%] -right-[10%] h-[500px] w-[500px] rounded-full opacity-[0.07] blur-[100px]"
          style={{ background: 'radial-gradient(circle, #F59E0B, transparent 70%)' }} />
        <div className="absolute -bottom-[10%] left-[10%] h-[450px] w-[450px] rounded-full opacity-[0.06] blur-[100px]"
          style={{ background: 'radial-gradient(circle, #EF4444, transparent 70%)' }} />
      </div>

      <div className="mx-auto max-w-lg">
        <div className="mb-8 text-center">
          <div className="mb-3 text-4xl">🏏</div>
          <h1 className="mb-2 text-[26px] font-bold text-[var(--text)]">Cricket Hub</h1>
          <p className="text-[15px] text-[var(--muted)]">Select a team to get started</p>
        </div>

        {myTeams.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
            <p className="mb-2 text-[16px] font-medium text-[var(--text)]">No teams yet</p>
            <p className="text-[14px] text-[var(--muted)]">
              {isSuperAdmin
                ? 'Head to the Admin panel to create your first team.'
                : 'Ask your team admin to invite you.'}
            </p>
            {isSuperAdmin && (
              <Link href="/admin"
                className="mt-4 inline-block rounded-xl bg-gradient-to-r from-[var(--orange)] to-[var(--red)] px-6 py-2.5 text-[14px] font-semibold text-white transition-all hover:opacity-90">
                Go to Admin
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {myTeams.map((team) => (
              <TeamCard key={team.id} team={team} />
            ))}
          </div>
        )}

        {isSuperAdmin && myTeams.length > 0 && (
          <div className="mt-6 text-center">
            <Link href="/admin" className="text-[13px] text-[var(--muted)] hover:text-[var(--orange)] transition-colors">
              ⚙️ Admin Panel
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function TeamCard({ team }: { team: UserTeam }) {
  return (
    <Link href={`/t/${team.slug}`}>
      <div className="group flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 cursor-pointer transition-all hover:border-[var(--orange)]/40 hover:shadow-lg"
        style={{ '--team-color': team.primary_color ?? '#FBBF24' } as React.CSSProperties}>
        <div className="flex h-14 w-14 items-center justify-center rounded-xl text-2xl flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${team.primary_color ?? '#FBBF24'}40, ${team.primary_color ?? '#FBBF24'}20)` }}>
          {team.logo_url ? (
            <img src={team.logo_url} alt={team.name} className="h-10 w-10 rounded-lg object-cover" />
          ) : (
            '🏏'
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[16px] font-semibold text-[var(--text)] group-hover:text-[var(--orange)] transition-colors truncate">
            {team.name}
          </h3>
          <p className="text-[13px] text-[var(--muted)] capitalize">{team.role.replace('_', ' ')}</p>
        </div>
        <span className="text-[var(--muted)] group-hover:text-[var(--orange)] transition-colors">→</span>
      </div>
    </Link>
  );
}

export default function HomePage() {
  return (
    <AuthGate>
      <TeamSelector />
    </AuthGate>
  );
}
