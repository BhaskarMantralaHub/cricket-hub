import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCricketStore } from '@/stores/cricket-store';
import {
  TEST_PLAYERS,
  TEST_SEASONS,
  TEST_EXPENSES,
  TEST_SETTLEMENTS,
  TEST_FEES,
  TEST_SPONSORSHIPS,
} from '../mocks/fixtures';

// Mock supabase as non-cloud mode for local tests
vi.mock('@/lib/supabase/client', () => ({
  getSupabaseClient: () => null,
  isCloudMode: () => false,
}));

describe('Cricket Store — Core (Local Mode)', () => {
  beforeEach(() => {
    useCricketStore.setState({
      players: [...TEST_PLAYERS],
      seasons: [...TEST_SEASONS],
      expenses: [...TEST_EXPENSES],
      splits: [],
      settlements: [...TEST_SETTLEMENTS],
      fees: [...TEST_FEES],
      sponsorships: [...TEST_SPONSORSHIPS],
      gallery: [],
      galleryTags: [],
      galleryComments: [],
      galleryLikes: [],
      commentReactions: [],
      notifications: [],
      loading: false,
      selectedSeasonId: 'season-1',
      teamId: 'team-1',
      showPlayerForm: false,
      showExpenseForm: false,
      showSettleForm: false,
      editingPlayer: null,
    });
  });

  // ── Players ────────────────────────────────────────────────

  it('adds a player', () => {
    const store = useCricketStore.getState();
    store.addPlayer('user-admin', {
      name: 'New Player', jersey_number: 99, phone: null,
      player_role: 'batsman', batting_style: 'left', bowling_style: null,
      cricclub_id: null, shirt_size: 'M', email: 'new@test.com', designation: null,
    });

    const { players } = useCricketStore.getState();
    expect(players).toHaveLength(3);
    expect(players[2].name).toBe('New Player');
    expect(players[2].team_id).toBe('team-1');
    expect(players[2].user_id).toBeNull(); // admin-created players start with null user_id
  });

  it('updates a player', () => {
    const store = useCricketStore.getState();
    store.updatePlayer('player-1', { jersey_number: 42 });

    const player = useCricketStore.getState().players.find((p) => p.id === 'player-1');
    expect(player?.jersey_number).toBe(42);
  });

  it('removes a player (soft-delete via is_active)', () => {
    const store = useCricketStore.getState();
    store.removePlayer('player-1');

    const player = useCricketStore.getState().players.find((p) => p.id === 'player-1');
    expect(player?.is_active).toBe(false);
    expect(player?.designation).toBeNull();
  });

  it('restores a removed player', () => {
    const store = useCricketStore.getState();
    store.removePlayer('player-1');
    store.restorePlayer('player-1');

    const player = useCricketStore.getState().players.find((p) => p.id === 'player-1');
    expect(player?.is_active).toBe(true);
  });

  // ── Seasons ────────────────────────────────────────────────

  it('adds a season and auto-selects it', () => {
    const store = useCricketStore.getState();
    store.addSeason('user-admin', { name: 'Summer 2026', year: 2026, season_type: 'summer' });

    const { seasons, selectedSeasonId } = useCricketStore.getState();
    expect(seasons).toHaveLength(3);
    const newSeason = seasons[0]; // prepended
    expect(newSeason.name).toBe('Summer 2026');
    expect(newSeason.team_id).toBe('team-1');
    expect(selectedSeasonId).toBe(newSeason.id);
  });

  it('updates a season', () => {
    const store = useCricketStore.getState();
    store.updateSeason('season-1', { fee_amount: 75 });

    const season = useCricketStore.getState().seasons.find((s) => s.id === 'season-1');
    expect(season?.fee_amount).toBe(75);
  });

  // ── Expenses ───────────────────────────────────────────────

  it('adds an expense', () => {
    const store = useCricketStore.getState();
    store.addExpense('user-admin', 'season-1', {
      category: 'food', description: 'Post-game pizza', amount: 45, expense_date: '2026-03-20',
    }, 'Admin User');

    const { expenses } = useCricketStore.getState();
    expect(expenses).toHaveLength(2);
    expect(expenses[0].description).toBe('Post-game pizza');
    expect(expenses[0].team_id).toBe('team-1');
  });

  it('soft-deletes an expense', () => {
    const store = useCricketStore.getState();
    store.deleteExpense('exp-1', 'Admin');

    const expense = useCricketStore.getState().expenses.find((e) => e.id === 'exp-1');
    expect(expense?.deleted_at).toBeTruthy();
    expect(expense?.deleted_by).toBe('Admin');
  });

  it('restores a soft-deleted expense', () => {
    const store = useCricketStore.getState();
    store.deleteExpense('exp-1');
    store.restoreExpense('exp-1');

    const expense = useCricketStore.getState().expenses.find((e) => e.id === 'exp-1');
    expect(expense?.deleted_at).toBeNull();
  });

  // ── Settlements ────────────────────────────────────────────

  it('adds a settlement', () => {
    const store = useCricketStore.getState();
    store.addSettlement('user-admin', 'season-1', {
      from_player: 'player-1', to_player: 'player-2', amount: 25, settled_date: '2026-03-25',
    });

    const { settlements } = useCricketStore.getState();
    expect(settlements).toHaveLength(2);
    expect(settlements[0].team_id).toBe('team-1');
  });

  it('deletes a settlement', () => {
    const store = useCricketStore.getState();
    store.deleteSettlement('settle-1');

    expect(useCricketStore.getState().settlements).toHaveLength(0);
  });

  // ── Fees ───────────────────────────────────────────────────

  it('records a new fee', () => {
    const store = useCricketStore.getState();
    store.recordFee('season-1', 'player-2', 60, 'Admin');

    const { fees } = useCricketStore.getState();
    expect(fees).toHaveLength(2);
    const newFee = fees.find((f) => f.player_id === 'player-2');
    expect(newFee?.amount_paid).toBe(60);
  });

  it('updates an existing fee', () => {
    const store = useCricketStore.getState();
    store.recordFee('season-1', 'player-1', 30, 'Admin'); // player-1 already has a fee

    const fee = useCricketStore.getState().fees.find((f) => f.player_id === 'player-1');
    expect(fee?.amount_paid).toBe(30);
    expect(useCricketStore.getState().fees).toHaveLength(1); // no duplicate
  });

  // ── Sponsorships ───────────────────────────────────────────

  it('adds a sponsorship', () => {
    const store = useCricketStore.getState();
    store.addSponsorship('season-1', {
      sponsor_name: 'New Sponsor', amount: 100, sponsored_date: '2026-04-01', notes: null,
    }, 'Admin');

    const { sponsorships } = useCricketStore.getState();
    expect(sponsorships).toHaveLength(2);
  });

  it('soft-deletes a sponsorship', () => {
    const store = useCricketStore.getState();
    store.deleteSponsorship('spon-1', 'Admin');

    const spon = useCricketStore.getState().sponsorships.find((s) => s.id === 'spon-1');
    expect(spon?.deleted_at).toBeTruthy();
  });

  // ── UI State ───────────────────────────────────────────────

  it('toggles UI state', () => {
    const store = useCricketStore.getState();
    store.setShowPlayerForm(true);
    expect(useCricketStore.getState().showPlayerForm).toBe(true);

    store.setShowExpenseForm(true);
    expect(useCricketStore.getState().showExpenseForm).toBe(true);

    store.setEditingPlayer('player-1');
    expect(useCricketStore.getState().editingPlayer).toBe('player-1');
  });

  it('resets state', () => {
    const store = useCricketStore.getState();
    store.reset();

    const state = useCricketStore.getState();
    expect(state.players).toHaveLength(0);
    expect(state.seasons).toHaveLength(0);
    expect(state.teamId).toBeNull();
  });
});
