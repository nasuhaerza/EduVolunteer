-- ============================================================
-- RLS FIX — Jalankan script ini di Supabase SQL Editor
-- Hapus semua policy lama dan buat ulang yang lebih permissive
-- ============================================================

-- ─── Drop existing policies ───────────────────────────────────
DO $$ DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- ─── users ────────────────────────────────────────────────────
CREATE POLICY "users_select" ON users
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "users_insert" ON users
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "users_update" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- ─── volunteer_profiles ──────────────────────────────────────
CREATE POLICY "volunteer_profiles_select" ON volunteer_profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "volunteer_profiles_insert" ON volunteer_profiles
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "volunteer_profiles_update" ON volunteer_profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- ─── schools ─────────────────────────────────────────────────
CREATE POLICY "schools_select" ON schools
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "schools_insert" ON schools
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "schools_update" ON schools
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);

-- ─── volunteer_requests ──────────────────────────────────────
-- SELECT: semua user authenticated bisa baca
CREATE POLICY "requests_select" ON volunteer_requests
  FOR SELECT TO authenticated USING (true);

-- INSERT: authenticated user bisa buat request
CREATE POLICY "requests_insert" ON volunteer_requests
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- UPDATE: school owner atau siapapun yg authenticated (relaxed untuk dev)
CREATE POLICY "requests_update" ON volunteer_requests
  FOR UPDATE TO authenticated
  USING (true);

-- ─── matches ─────────────────────────────────────────────────
CREATE POLICY "matches_select" ON matches
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "matches_insert" ON matches
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "matches_update" ON matches
  FOR UPDATE TO authenticated
  USING (true);

-- ─── notifications ───────────────────────────────────────────
CREATE POLICY "notifications_select" ON notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "notifications_insert" ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "notifications_update" ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- ─── Verifikasi ───────────────────────────────────────────────
-- Jalankan ini untuk melihat semua policy yang aktif:
-- SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;
