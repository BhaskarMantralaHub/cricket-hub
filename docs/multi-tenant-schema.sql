-- ============================================================
-- Cricket Hub — Multi-Tenant Database Schema
-- ============================================================
-- Run this in Supabase SQL Editor to set up multi-tenant tables.
-- This extends the existing single-tenant cricket schema.
--
-- Architecture:
--   cricket_teams ─── cricket_team_members (user<>team junction)
--                 └── cricket_players, cricket_seasons, etc. (all scoped by team_id)
--
-- Roles:
--   super_admin  → profiles.is_admin = true (platform-wide)
--   team_admin   → cricket_team_members.role = 'team_admin' (per-team)
--   player       → cricket_team_members.role = 'player' (per-team)

-- ── Helper: check if user is super admin ─────────────────────
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ── Helper: check if user is team admin for a given team ─────
CREATE OR REPLACE FUNCTION is_team_admin(check_team_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM cricket_team_members
    WHERE team_id = check_team_id
      AND user_id = auth.uid()
      AND role = 'team_admin'
      AND approved = true
  ) OR is_super_admin();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ── Helper: check if user is a member of a given team ────────
CREATE OR REPLACE FUNCTION is_team_member(check_team_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM cricket_team_members
    WHERE team_id = check_team_id
      AND user_id = auth.uid()
      AND approved = true
  ) OR is_super_admin();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ══════════════════════════════════════════════════════════════
-- NEW TABLES
-- ══════════════════════════════════════════════════════════════

-- ── Teams ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cricket_teams (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  logo_url      TEXT,
  primary_color TEXT DEFAULT '#FBBF24',
  created_by    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE cricket_teams ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can see teams (for team selector)
CREATE POLICY "Authenticated users can view teams"
  ON cricket_teams FOR SELECT USING (auth.uid() IS NOT NULL);
-- Only super admins can create teams
CREATE POLICY "Super admins can create teams"
  ON cricket_teams FOR INSERT WITH CHECK (is_super_admin());
CREATE POLICY "Super admins can update teams"
  ON cricket_teams FOR UPDATE USING (is_super_admin());
CREATE POLICY "Super admins can delete teams"
  ON cricket_teams FOR DELETE USING (is_super_admin());

-- ── Team Members ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cricket_team_members (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id   UUID NOT NULL REFERENCES cricket_teams(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role      TEXT NOT NULL CHECK (role IN ('team_admin', 'player')),
  approved  BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_id, user_id)
);

ALTER TABLE cricket_team_members ENABLE ROW LEVEL SECURITY;

-- Members can see other members of their teams
CREATE POLICY "Team members can view memberships"
  ON cricket_team_members FOR SELECT
  USING (is_team_member(team_id) OR user_id = auth.uid());
-- Super admins and team admins can manage members
CREATE POLICY "Admins can insert members"
  ON cricket_team_members FOR INSERT
  WITH CHECK (is_team_admin(team_id));
CREATE POLICY "Admins can update members"
  ON cricket_team_members FOR UPDATE
  USING (is_team_admin(team_id));
CREATE POLICY "Admins can delete members"
  ON cricket_team_members FOR DELETE
  USING (is_team_admin(team_id));

-- ══════════════════════════════════════════════════════════════
-- ALTER EXISTING TABLES — add team_id
-- ══════════════════════════════════════════════════════════════

-- ── Players ───────────────────────────────────────────────────
ALTER TABLE cricket_players
  ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES cricket_teams(id) ON DELETE CASCADE;

-- Drop old RLS policies and recreate with team scoping
DROP POLICY IF EXISTS "Cricket users can read players" ON cricket_players;
DROP POLICY IF EXISTS "Admin can manage players" ON cricket_players;
DROP POLICY IF EXISTS "Admin can update players" ON cricket_players;
DROP POLICY IF EXISTS "Admin can delete players" ON cricket_players;

CREATE POLICY "Team members can read players"
  ON cricket_players FOR SELECT USING (is_team_member(team_id));
CREATE POLICY "Team admins can insert players"
  ON cricket_players FOR INSERT WITH CHECK (is_team_admin(team_id));
CREATE POLICY "Team admins can update players"
  ON cricket_players FOR UPDATE USING (is_team_admin(team_id));
CREATE POLICY "Team admins can delete players"
  ON cricket_players FOR DELETE USING (is_team_admin(team_id));

-- ── Seasons ───────────────────────────────────────────────────
ALTER TABLE cricket_seasons
  ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES cricket_teams(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "Cricket users can read seasons" ON cricket_seasons;
DROP POLICY IF EXISTS "Admin can manage seasons" ON cricket_seasons;
DROP POLICY IF EXISTS "Admin can update seasons" ON cricket_seasons;
DROP POLICY IF EXISTS "Admin can delete seasons" ON cricket_seasons;

CREATE POLICY "Team members can read seasons"
  ON cricket_seasons FOR SELECT USING (is_team_member(team_id));
CREATE POLICY "Team admins can insert seasons"
  ON cricket_seasons FOR INSERT WITH CHECK (is_team_admin(team_id));
CREATE POLICY "Team admins can update seasons"
  ON cricket_seasons FOR UPDATE USING (is_team_admin(team_id));
CREATE POLICY "Team admins can delete seasons"
  ON cricket_seasons FOR DELETE USING (is_team_admin(team_id));

-- ── Expenses ──────────────────────────────────────────────────
ALTER TABLE cricket_expenses
  ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES cricket_teams(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "Cricket users can read expenses" ON cricket_expenses;
DROP POLICY IF EXISTS "Admin can manage expenses" ON cricket_expenses;
DROP POLICY IF EXISTS "Admin can update expenses" ON cricket_expenses;
DROP POLICY IF EXISTS "Admin can delete expenses" ON cricket_expenses;

CREATE POLICY "Team members can read expenses"
  ON cricket_expenses FOR SELECT USING (is_team_member(team_id));
CREATE POLICY "Team admins can insert expenses"
  ON cricket_expenses FOR INSERT WITH CHECK (is_team_admin(team_id));
CREATE POLICY "Team admins can update expenses"
  ON cricket_expenses FOR UPDATE USING (is_team_admin(team_id));
CREATE POLICY "Team admins can delete expenses"
  ON cricket_expenses FOR DELETE USING (is_team_admin(team_id));

-- ── Settlements ───────────────────────────────────────────────
ALTER TABLE cricket_settlements
  ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES cricket_teams(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "Cricket users can read settlements" ON cricket_settlements;
DROP POLICY IF EXISTS "Admin can manage settlements" ON cricket_settlements;

CREATE POLICY "Team members can read settlements"
  ON cricket_settlements FOR SELECT USING (is_team_member(team_id));
CREATE POLICY "Team admins can insert settlements"
  ON cricket_settlements FOR INSERT WITH CHECK (is_team_admin(team_id));
CREATE POLICY "Team admins can delete settlements"
  ON cricket_settlements FOR DELETE USING (is_team_admin(team_id));

-- ── Gallery ───────────────────────────────────────────────────
ALTER TABLE cricket_gallery
  ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES cricket_teams(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "Cricket users can read gallery" ON cricket_gallery;
DROP POLICY IF EXISTS "Cricket users can create posts" ON cricket_gallery;
DROP POLICY IF EXISTS "Own or admin can soft-delete posts" ON cricket_gallery;

CREATE POLICY "Team members can read gallery"
  ON cricket_gallery FOR SELECT USING (is_team_member(team_id));
CREATE POLICY "Team members can create posts"
  ON cricket_gallery FOR INSERT WITH CHECK (is_team_member(team_id));
CREATE POLICY "Own or admin can update posts"
  ON cricket_gallery FOR UPDATE
  USING (is_team_member(team_id) AND (user_id = auth.uid() OR is_team_admin(team_id)));

-- ══════════════════════════════════════════════════════════════
-- Child tables — RLS unchanged (scoped via parent FK + JOINs)
-- ══════════════════════════════════════════════════════════════
-- cricket_expense_splits, cricket_season_fees, cricket_sponsorships,
-- cricket_gallery_tags, cricket_gallery_comments, cricket_gallery_likes,
-- cricket_comment_reactions, cricket_notifications
-- These remain scoped by their parent table's RLS.

-- ══════════════════════════════════════════════════════════════
-- UPDATED FUNCTIONS for multi-tenancy
-- ══════════════════════════════════════════════════════════════

-- ── Public season data (updated to scope by team) ─────────────
CREATE OR REPLACE FUNCTION get_public_season_data(token UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  season_rec RECORD;
BEGIN
  SELECT s.id, s.name, s.year, s.season_type, s.fee_amount, s.team_id,
         t.name AS team_name, t.slug AS team_slug, t.logo_url AS team_logo
  INTO season_rec
  FROM cricket_seasons s
  JOIN cricket_teams t ON t.id = s.team_id
  WHERE s.share_token = token AND s.is_active = true;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Season not found');
  END IF;

  SELECT json_build_object(
    'team', json_build_object(
      'name', season_rec.team_name, 'slug', season_rec.team_slug, 'logo_url', season_rec.team_logo
    ),
    'season', json_build_object(
      'name', season_rec.name, 'year', season_rec.year,
      'season_type', season_rec.season_type, 'fee_amount', season_rec.fee_amount
    ),
    'players', (
      SELECT COALESCE(json_agg(json_build_object(
        'id', p.id, 'name', p.name, 'jersey_number', p.jersey_number,
        'player_role', p.player_role, 'designation', p.designation, 'is_active', p.is_active
      )), '[]'::json)
      FROM cricket_players p WHERE p.team_id = season_rec.team_id AND p.is_active = true
    ),
    'expenses', (
      SELECT COALESCE(json_agg(json_build_object(
        'id', e.id, 'category', e.category, 'description', e.description,
        'amount', e.amount, 'expense_date', e.expense_date
      )), '[]'::json)
      FROM cricket_expenses e WHERE e.season_id = season_rec.id AND e.deleted_at IS NULL
    ),
    'fees', (
      SELECT COALESCE(json_agg(json_build_object(
        'player_id', f.player_id, 'amount_paid', f.amount_paid, 'paid_date', f.paid_date
      )), '[]'::json)
      FROM cricket_season_fees f WHERE f.season_id = season_rec.id
    ),
    'sponsorships', (
      SELECT COALESCE(json_agg(json_build_object(
        'sponsor_name', sp.sponsor_name, 'amount', sp.amount,
        'sponsored_date', sp.sponsored_date, 'notes', sp.notes
      )), '[]'::json)
      FROM cricket_sponsorships sp WHERE sp.season_id = season_rec.id AND sp.deleted_at IS NULL
    )
  ) INTO result;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_public_season_data(UUID) TO anon;

-- ── Get user's teams ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_my_teams()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER STABLE
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(json_build_object(
      'id', t.id,
      'name', t.name,
      'slug', t.slug,
      'logo_url', t.logo_url,
      'primary_color', t.primary_color,
      'role', m.role
    ) ORDER BY t.name), '[]'::json)
    FROM cricket_team_members m
    JOIN cricket_teams t ON t.id = m.team_id
    WHERE m.user_id = auth.uid() AND m.approved = true
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_my_teams() TO authenticated;

-- ── Get team by slug ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_team_by_slug(team_slug TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER STABLE
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'id', t.id,
    'name', t.name,
    'slug', t.slug,
    'logo_url', t.logo_url,
    'primary_color', t.primary_color,
    'role', COALESCE(m.role, 'none'),
    'approved', COALESCE(m.approved, false)
  ) INTO result
  FROM cricket_teams t
  LEFT JOIN cricket_team_members m ON m.team_id = t.id AND m.user_id = auth.uid()
  WHERE t.slug = team_slug;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_team_by_slug(TEXT) TO authenticated;
