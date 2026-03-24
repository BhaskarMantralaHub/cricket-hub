import { create } from 'zustand';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { CricketTeam, CricketTeamMember, TeamMemberRole } from '@/types/cricket';

export type UserTeam = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
  role: TeamMemberRole;
};

interface TeamState {
  // Teams the current user belongs to
  myTeams: UserTeam[];
  loadingTeams: boolean;

  // Currently active team (set by /t/[slug] route)
  activeTeam: (CricketTeam & { role: TeamMemberRole }) | null;
  loadingActiveTeam: boolean;

  // All teams (super admin only)
  allTeams: CricketTeam[];
  allMembers: CricketTeamMember[];

  // Actions
  loadMyTeams: () => Promise<void>;
  loadTeamBySlug: (slug: string) => Promise<boolean>;
  clearActiveTeam: () => void;

  // Super admin actions
  loadAllTeams: () => Promise<void>;
  createTeam: (name: string, slug: string, primaryColor?: string) => Promise<CricketTeam | null>;
  addTeamMember: (teamId: string, userId: string, role: TeamMemberRole) => Promise<boolean>;
  removeTeamMember: (memberId: string) => Promise<void>;
  loadTeamMembers: (teamId: string) => Promise<CricketTeamMember[]>;
}

export const useTeamStore = create<TeamState>((set, get) => ({
  myTeams: [],
  loadingTeams: true,
  activeTeam: null,
  loadingActiveTeam: false,
  allTeams: [],
  allMembers: [],

  loadMyTeams: async () => {
    set({ loadingTeams: true });
    const supabase = getSupabaseClient();
    if (!supabase) { set({ loadingTeams: false }); return; }

    const { data } = await supabase.rpc('get_my_teams');
    const teams = (data ?? []) as UserTeam[];
    set({ myTeams: teams, loadingTeams: false });
  },

  loadTeamBySlug: async (slug: string) => {
    set({ loadingActiveTeam: true });
    const supabase = getSupabaseClient();
    if (!supabase) { set({ loadingActiveTeam: false }); return false; }

    const { data } = await supabase.rpc('get_team_by_slug', { team_slug: slug });
    if (!data || data.role === 'none') {
      set({ activeTeam: null, loadingActiveTeam: false });
      return false;
    }

    set({
      activeTeam: {
        id: data.id,
        name: data.name,
        slug: data.slug,
        logo_url: data.logo_url,
        primary_color: data.primary_color,
        created_by: '',
        created_at: '',
        role: data.role,
      },
      loadingActiveTeam: false,
    });
    return true;
  },

  clearActiveTeam: () => set({ activeTeam: null }),

  loadAllTeams: async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const { data } = await supabase
      .from('cricket_teams')
      .select('*')
      .order('name');
    set({ allTeams: (data ?? []) as CricketTeam[] });
  },

  createTeam: async (name, slug, primaryColor) => {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: team, error } = await supabase
      .from('cricket_teams')
      .insert({
        name,
        slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        primary_color: primaryColor ?? '#FBBF24',
        created_by: user.id,
      })
      .select()
      .single();

    if (error) { console.error('[team] create failed:', error); return null; }

    // Auto-add creator as team_admin
    if (team) {
      await supabase.from('cricket_team_members').insert({
        team_id: team.id,
        user_id: user.id,
        role: 'team_admin',
        approved: true,
      });
      set({ allTeams: [...get().allTeams, team as CricketTeam] });
    }

    return team as CricketTeam;
  },

  addTeamMember: async (teamId, userId, role) => {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    const { error } = await supabase
      .from('cricket_team_members')
      .insert({ team_id: teamId, user_id: userId, role, approved: true });

    if (error) { console.error('[team] addMember failed:', error); return false; }
    return true;
  },

  removeTeamMember: async (memberId) => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    await supabase.from('cricket_team_members').delete().eq('id', memberId);
    set({ allMembers: get().allMembers.filter((m) => m.id !== memberId) });
  },

  loadTeamMembers: async (teamId) => {
    const supabase = getSupabaseClient();
    if (!supabase) return [];

    const { data } = await supabase
      .from('cricket_team_members')
      .select('*')
      .eq('team_id', teamId)
      .order('joined_at');

    const members = (data ?? []) as CricketTeamMember[];
    set({ allMembers: members });
    return members;
  },
}));
