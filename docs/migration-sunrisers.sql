-- ============================================================
-- Migration: Backfill Sunrisers Manteca into Multi-Tenant Schema
-- ============================================================
-- Run this AFTER applying multi-tenant-schema.sql.
-- This creates the Sunrisers team, backfills team_id on all
-- existing rows, and creates team_members from existing players.
--
-- Paste into Supabase SQL Editor and run once.

BEGIN;

-- ── Step 1: Find the admin user (creator of the team) ────────
-- Use the existing admin profile as the team creator.
DO $$
DECLARE
  admin_uid UUID;
  sunrisers_team_id UUID;
BEGIN
  SELECT id INTO admin_uid FROM profiles
  WHERE is_admin = true OR access @> '{admin}'
  ORDER BY created_at LIMIT 1;

  IF admin_uid IS NULL THEN
    RAISE EXCEPTION 'No admin user found. Create an admin profile first.';
  END IF;

  -- ── Step 2: Create the Sunrisers Manteca team ──────────────
  INSERT INTO cricket_teams (name, slug, logo_url, primary_color, created_by)
  VALUES ('Sunrisers Manteca', 'sunrisers-manteca', NULL, '#FBBF24', admin_uid)
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO sunrisers_team_id;

  -- If already exists, get the ID
  IF sunrisers_team_id IS NULL THEN
    SELECT id INTO sunrisers_team_id FROM cricket_teams WHERE slug = 'sunrisers-manteca';
  END IF;

  -- ── Step 3: Backfill team_id on cricket_players ────────────
  UPDATE cricket_players SET team_id = sunrisers_team_id
  WHERE team_id IS NULL;

  -- ── Step 4: Backfill team_id on cricket_seasons ────────────
  UPDATE cricket_seasons SET team_id = sunrisers_team_id
  WHERE team_id IS NULL;

  -- ── Step 5: Backfill team_id on cricket_expenses ───────────
  UPDATE cricket_expenses SET team_id = sunrisers_team_id
  WHERE team_id IS NULL;

  -- ── Step 6: Backfill team_id on cricket_settlements ────────
  UPDATE cricket_settlements SET team_id = sunrisers_team_id
  WHERE team_id IS NULL;

  -- ── Step 7: Backfill team_id on cricket_gallery ────────────
  UPDATE cricket_gallery SET team_id = sunrisers_team_id
  WHERE team_id IS NULL;

  -- ── Step 8: Create team_members from cricket_players ───────
  -- Players with user_id (linked accounts) become 'player' members.
  -- The admin becomes 'team_admin'.
  INSERT INTO cricket_team_members (team_id, user_id, role, approved)
  SELECT sunrisers_team_id, cp.user_id,
    CASE WHEN cp.user_id = admin_uid THEN 'team_admin' ELSE 'player' END,
    true
  FROM cricket_players cp
  WHERE cp.user_id IS NOT NULL
    AND cp.is_active = true
  ON CONFLICT (team_id, user_id) DO NOTHING;

  -- Ensure the admin is always a team_admin
  INSERT INTO cricket_team_members (team_id, user_id, role, approved)
  VALUES (sunrisers_team_id, admin_uid, 'team_admin', true)
  ON CONFLICT (team_id, user_id) DO UPDATE SET role = 'team_admin';

  -- ── Step 9: Add any other admin users as team_admin ────────
  INSERT INTO cricket_team_members (team_id, user_id, role, approved)
  SELECT sunrisers_team_id, p.id, 'team_admin', true
  FROM profiles p
  WHERE (p.is_admin = true OR p.access @> '{admin}')
    AND p.id != admin_uid
  ON CONFLICT (team_id, user_id) DO UPDATE SET role = 'team_admin';

  RAISE NOTICE 'Migration complete. Team ID: %', sunrisers_team_id;
END $$;

COMMIT;

-- ── Verify migration ─────────────────────────────────────────
-- Run these queries to verify:
--
-- SELECT name, slug FROM cricket_teams;
-- SELECT COUNT(*) AS players_with_team FROM cricket_players WHERE team_id IS NOT NULL;
-- SELECT COUNT(*) AS seasons_with_team FROM cricket_seasons WHERE team_id IS NOT NULL;
-- SELECT COUNT(*) AS members FROM cricket_team_members;
-- SELECT t.name, m.role, p.email
--   FROM cricket_team_members m
--   JOIN cricket_teams t ON t.id = m.team_id
--   JOIN profiles p ON p.id = m.user_id;
