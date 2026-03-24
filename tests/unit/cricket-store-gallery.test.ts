import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCricketStore } from '@/stores/cricket-store';
import {
  TEST_PLAYERS,
  TEST_SEASONS,
  TEST_GALLERY_POSTS,
  TEST_GALLERY_TAGS,
  TEST_GALLERY_COMMENTS,
  TEST_GALLERY_LIKES,
  TEST_COMMENT_REACTIONS,
  TEST_NOTIFICATIONS,
} from '../mocks/fixtures';

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseClient: () => null,
  isCloudMode: () => false,
}));

describe('Cricket Store — Gallery (Local Mode)', () => {
  beforeEach(() => {
    useCricketStore.setState({
      players: [...TEST_PLAYERS],
      seasons: [...TEST_SEASONS],
      expenses: [],
      splits: [],
      settlements: [],
      fees: [],
      sponsorships: [],
      gallery: [...TEST_GALLERY_POSTS],
      galleryTags: [...TEST_GALLERY_TAGS],
      galleryComments: [...TEST_GALLERY_COMMENTS],
      galleryLikes: [...TEST_GALLERY_LIKES],
      commentReactions: [...TEST_COMMENT_REACTIONS],
      notifications: [...TEST_NOTIFICATIONS],
      loading: false,
      selectedSeasonId: 'season-1',
      teamId: 'team-1',
      showPlayerForm: false,
      showExpenseForm: false,
      showSettleForm: false,
      editingPlayer: null,
    });
  });

  // ── Gallery Posts ─────────────────────────────────────────

  it('adds a gallery post with tags', () => {
    const store = useCricketStore.getState();
    store.addGalleryPost('user-p1', 'season-1', ['https://example.com/new.jpg'], 'New post', 'Player One', ['player-2']);

    const { gallery, galleryTags } = useCricketStore.getState();
    expect(gallery).toHaveLength(2);
    expect(gallery[0].caption).toBe('New post');
    expect(gallery[0].team_id).toBe('team-1');

    const newPostId = gallery[0].id;
    const newTags = galleryTags.filter((t) => t.post_id === newPostId);
    expect(newTags).toHaveLength(1);
    expect(newTags[0].player_id).toBe('player-2');
  });

  it('soft-deletes a gallery post', () => {
    const store = useCricketStore.getState();
    store.deleteGalleryPost('post-1');

    const post = useCricketStore.getState().gallery.find((p) => p.id === 'post-1');
    expect(post?.deleted_at).toBeTruthy();
  });

  it('updates a gallery post caption and reconciles tags', () => {
    const store = useCricketStore.getState();
    // Remove player-2 tag, add player-1 tag
    store.updateGalleryPost('post-1', 'Updated caption', ['player-1']);

    const { gallery, galleryTags } = useCricketStore.getState();
    expect(gallery.find((p) => p.id === 'post-1')?.caption).toBe('Updated caption');

    const tags = galleryTags.filter((t) => t.post_id === 'post-1');
    expect(tags).toHaveLength(1);
    expect(tags[0].player_id).toBe('player-1');
  });

  // ── Comments ──────────────────────────────────────────────

  it('adds a comment', () => {
    const store = useCricketStore.getState();
    store.addGalleryComment('post-1', 'user-p1', 'Player One', 'Great pic!');

    const { galleryComments } = useCricketStore.getState();
    expect(galleryComments).toHaveLength(2);
    expect(galleryComments[1].text).toBe('Great pic!');
  });

  it('updates a comment', () => {
    const store = useCricketStore.getState();
    store.updateGalleryComment('comment-1', 'Updated comment');

    const comment = useCricketStore.getState().galleryComments.find((c) => c.id === 'comment-1');
    expect(comment?.text).toBe('Updated comment');
  });

  it('deletes a comment', () => {
    const store = useCricketStore.getState();
    store.deleteGalleryComment('comment-1');

    expect(useCricketStore.getState().galleryComments).toHaveLength(0);
  });

  // ── Likes ─────────────────────────────────────────────────

  it('toggles like on (add)', () => {
    const store = useCricketStore.getState();
    store.toggleGalleryLike('post-1', 'user-p1', 'Player One');

    const likes = useCricketStore.getState().galleryLikes.filter((l) => l.post_id === 'post-1');
    expect(likes).toHaveLength(2);
  });

  it('toggles like off (remove)', () => {
    const store = useCricketStore.getState();
    // user-p2 already liked post-1
    store.toggleGalleryLike('post-1', 'user-p2');

    const likes = useCricketStore.getState().galleryLikes.filter((l) => l.post_id === 'post-1');
    expect(likes).toHaveLength(0);
  });

  // ── Comment Reactions ─────────────────────────────────────

  it('toggles comment reaction on', () => {
    const store = useCricketStore.getState();
    store.toggleCommentReaction('comment-1', 'user-p2', '😂');

    const reactions = useCricketStore.getState().commentReactions;
    expect(reactions).toHaveLength(2);
  });

  it('toggles comment reaction off', () => {
    const store = useCricketStore.getState();
    // user-p1 already has 🔥 on comment-1
    store.toggleCommentReaction('comment-1', 'user-p1', '🔥');

    expect(useCricketStore.getState().commentReactions).toHaveLength(0);
  });

  // ── Notifications ─────────────────────────────────────────

  it('marks notifications as read', () => {
    const store = useCricketStore.getState();
    store.markNotificationsRead();

    const unread = useCricketStore.getState().notifications.filter((n) => !n.is_read);
    expect(unread).toHaveLength(0);
  });

  it('clears all notifications', () => {
    const store = useCricketStore.getState();
    store.clearNotifications();

    expect(useCricketStore.getState().notifications).toHaveLength(0);
  });
});
