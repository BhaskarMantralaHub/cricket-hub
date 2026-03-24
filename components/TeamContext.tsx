'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useTeamStore, type UserTeam } from '@/stores/team-store';
import { useCricketStore } from '@/stores/cricket-store';
import { useAuthStore } from '@/stores/auth-store';
import type { CricketTeam, TeamMemberRole } from '@/types/cricket';

type TeamContextValue = {
  team: (CricketTeam & { role: TeamMemberRole }) | null;
  isTeamAdmin: boolean;
  loading: boolean;
};

const TeamCtx = createContext<TeamContextValue>({
  team: null,
  isTeamAdmin: false,
  loading: true,
});

export function useTeamContext() {
  return useContext(TeamCtx);
}

/// Provider that loads team by slug and initializes cricket data.
/// Wrap around /t/[slug] routes.
export function TeamProvider({ slug, children }: { slug: string; children: React.ReactNode }) {
  const { user } = useAuthStore();
  const { activeTeam, loadTeamBySlug, loadingActiveTeam } = useTeamStore();
  const { loadAll, reset } = useCricketStore();
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!user) return;
    reset();
    loadTeamBySlug(slug).then((found) => {
      if (!found) setNotFound(true);
    });
  }, [slug, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Once team is loaded, load cricket data
  useEffect(() => {
    if (activeTeam && user) {
      loadAll(activeTeam.id, user.id);
    }
  }, [activeTeam, user]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loadingActiveTeam) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--orange)] border-t-transparent" />
      </div>
    );
  }

  if (notFound || !activeTeam) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <div className="mb-3 text-4xl">🏏</div>
          <h2 className="mb-2 text-xl font-bold text-[var(--text)]">Team Not Found</h2>
          <p className="text-[var(--muted)]">
            You don&apos;t have access to this team, or it doesn&apos;t exist.
          </p>
        </div>
      </div>
    );
  }

  const isTeamAdmin = activeTeam.role === 'team_admin' || useAuthStore.getState().isSuperAdmin;

  return (
    <TeamCtx.Provider value={{ team: activeTeam, isTeamAdmin, loading: false }}>
      {children}
    </TeamCtx.Provider>
  );
}
