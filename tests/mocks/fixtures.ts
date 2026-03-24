import type {
  CricketPlayer,
  CricketSeason,
  CricketExpense,
  CricketExpenseSplit,
  CricketSettlement,
  CricketSeasonFee,
  CricketSponsorship,
  GalleryPost,
  GalleryTag,
  GalleryComment,
  GalleryLike,
  CommentReaction,
  GalleryNotification,
  CricketTeam,
  CricketTeamMember,
} from '@/types/cricket';

export const TEST_TEAM: CricketTeam = {
  id: 'team-1',
  name: 'Test Cricket Club',
  slug: 'test-cricket',
  logo_url: null,
  primary_color: '#FBBF24',
  created_by: 'user-admin',
  created_at: '2026-01-01T00:00:00Z',
};

export const ADMIN_USER = { id: 'user-admin', email: 'admin@test.com', user_metadata: { full_name: 'Admin User' } };
export const PLAYER_USER_1 = { id: 'user-p1', email: 'player1@test.com', user_metadata: { full_name: 'Player One' } };
export const PLAYER_USER_2 = { id: 'user-p2', email: 'player2@test.com', user_metadata: { full_name: 'Player Two' } };

export const TEST_PLAYERS: CricketPlayer[] = [
  {
    id: 'player-1', team_id: 'team-1', user_id: 'user-p1', name: 'Player One', jersey_number: 10,
    phone: '555-0001', player_role: 'batsman', batting_style: 'right', bowling_style: '',
    cricclub_id: null, shirt_size: 'L', email: 'player1@test.com',
    designation: 'captain', photo_url: null, is_active: true,
    created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'player-2', team_id: 'team-1', user_id: 'user-p2', name: 'Player Two', jersey_number: 7,
    phone: '555-0002', player_role: 'bowler', batting_style: 'right', bowling_style: 'pace',
    cricclub_id: null, shirt_size: 'M', email: 'player2@test.com',
    designation: null, photo_url: null, is_active: true,
    created_at: '2026-01-02T00:00:00Z', updated_at: '2026-01-02T00:00:00Z',
  },
];

export const TEST_SEASONS: CricketSeason[] = [
  {
    id: 'season-1', team_id: 'team-1', user_id: 'user-admin', name: 'Spring 2026', year: 2026,
    season_type: 'spring', share_token: 'token-123', fee_amount: 60, is_active: true,
    created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'season-2', team_id: 'team-1', user_id: 'user-admin', name: 'Fall 2025', year: 2025,
    season_type: 'fall', share_token: 'token-456', fee_amount: 50, is_active: true,
    created_at: '2025-09-01T00:00:00Z', updated_at: '2025-09-01T00:00:00Z',
  },
];

export const TEST_EXPENSES: CricketExpense[] = [
  {
    id: 'exp-1', team_id: 'team-1', user_id: 'user-admin', season_id: 'season-1',
    paid_by: 'player-1', category: 'ground', description: 'Team jerseys',
    amount: 200, expense_date: '2026-03-15',
    created_by: 'Admin User', updated_by: null, deleted_at: null, deleted_by: null,
    created_at: '2026-03-15T00:00:00Z', updated_at: '2026-03-15T00:00:00Z',
  },
];

export const TEST_SPLITS: CricketExpenseSplit[] = [
  { id: 'split-1', expense_id: 'exp-1', player_id: 'player-1', share_amount: 100 },
  { id: 'split-2', expense_id: 'exp-1', player_id: 'player-2', share_amount: 100 },
];

export const TEST_SETTLEMENTS: CricketSettlement[] = [
  {
    id: 'settle-1', team_id: 'team-1', user_id: 'user-admin', season_id: 'season-1',
    from_player: 'player-2', to_player: 'player-1', amount: 50, settled_date: '2026-03-20',
    created_at: '2026-03-20T00:00:00Z',
  },
];

export const TEST_FEES: CricketSeasonFee[] = [
  { id: 'fee-1', season_id: 'season-1', player_id: 'player-1', amount_paid: 60, paid_date: '2026-03-01', marked_by: 'Admin User', created_at: '2026-03-01T00:00:00Z' },
];

export const TEST_SPONSORSHIPS: CricketSponsorship[] = [
  {
    id: 'spon-1', season_id: 'season-1', sponsor_name: 'Local Business',
    amount: 150, sponsored_date: '2026-03-10', notes: 'Season sponsor',
    created_by: 'Admin User', updated_by: null, deleted_at: null, deleted_by: null,
    created_at: '2026-03-10T00:00:00Z', updated_at: '2026-03-10T00:00:00Z',
  },
];

export const TEST_GALLERY_POSTS: GalleryPost[] = [
  {
    id: 'post-1', team_id: 'team-1', season_id: 'season-1', user_id: 'user-p1',
    photo_url: 'https://example.com/photo1.jpg', photo_urls: ['https://example.com/photo1.jpg'],
    caption: 'Great game today!', posted_by: 'Player One',
    deleted_at: null, created_at: '2026-03-16T00:00:00Z',
  },
];

export const TEST_GALLERY_TAGS: GalleryTag[] = [
  { id: 'tag-1', post_id: 'post-1', player_id: 'player-2' },
];

export const TEST_GALLERY_COMMENTS: GalleryComment[] = [
  { id: 'comment-1', post_id: 'post-1', user_id: 'user-p2', comment_by: 'Player Two', text: 'Nice shot!', created_at: '2026-03-16T01:00:00Z' },
];

export const TEST_GALLERY_LIKES: GalleryLike[] = [
  { id: 'like-1', post_id: 'post-1', user_id: 'user-p2', liked_by: 'Player Two' },
];

export const TEST_COMMENT_REACTIONS: CommentReaction[] = [
  { id: 'reaction-1', comment_id: 'comment-1', user_id: 'user-p1', emoji: '🔥' },
];

export const TEST_NOTIFICATIONS: GalleryNotification[] = [
  { id: 'notif-1', user_id: 'user-p1', post_id: 'post-1', type: 'tag', message: 'Player Two tagged you', is_read: false, created_at: '2026-03-16T01:00:00Z' },
];
