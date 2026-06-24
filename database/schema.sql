-- ============================================================
-- Education Volunteer Scout - Supabase PostgreSQL Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── users ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('volunteer', 'school', 'admin')),
  phone       TEXT,
  city        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── volunteer_profiles ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS volunteer_profiles (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skills       TEXT[] NOT NULL DEFAULT '{}',
  availability TEXT[] NOT NULL DEFAULT '{}',
  latitude     FLOAT NOT NULL DEFAULT 0,
  longitude    FLOAT NOT NULL DEFAULT 0,
  experience   TEXT NOT NULL DEFAULT '',
  rating       FLOAT DEFAULT 0,
  total_hours  INTEGER DEFAULT 0,
  badges       TEXT[] DEFAULT '{}',
  UNIQUE (user_id)
);

-- ─── schools ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS schools (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID REFERENCES users(id) ON DELETE SET NULL,
  school_name    TEXT NOT NULL,
  address        TEXT NOT NULL DEFAULT '',
  latitude       FLOAT NOT NULL DEFAULT 0,
  longitude      FLOAT NOT NULL DEFAULT 0,
  contact_person TEXT NOT NULL DEFAULT ''
);

-- ─── volunteer_requests ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS volunteer_requests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id       UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  subject_needed  TEXT NOT NULL,
  level           TEXT NOT NULL CHECK (level IN ('SD', 'SMP', 'SMA', 'SMK')),
  urgency         TEXT NOT NULL CHECK (urgency IN ('low', 'medium', 'high')),
  description     TEXT NOT NULL DEFAULT '',
  schedule        TEXT NOT NULL DEFAULT '',
  status          TEXT NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open', 'matched', 'filled', 'closed')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── matches ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS matches (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  volunteer_id UUID NOT NULL REFERENCES volunteer_profiles(id) ON DELETE CASCADE,
  request_id   UUID NOT NULL REFERENCES volunteer_requests(id) ON DELETE CASCADE,
  match_score  INTEGER NOT NULL DEFAULT 0,
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'accepted', 'rejected', 'active', 'completed')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (volunteer_id, request_id)
);

-- ─── notifications ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  message      TEXT NOT NULL,
  is_read      BOOLEAN NOT NULL DEFAULT FALSE,
  type         TEXT DEFAULT 'system'
                 CHECK (type IN ('match', 'request', 'system', 'accept', 'reject')),
  reference_id UUID,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_volunteer_profiles_user ON volunteer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_schools_user ON schools(user_id);
CREATE INDEX IF NOT EXISTS idx_requests_school ON volunteer_requests(school_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON volunteer_requests(status);
CREATE INDEX IF NOT EXISTS idx_matches_volunteer ON matches(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_matches_request ON matches(request_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);

-- ─── Row Level Security ───────────────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users: anyone can read, only self can update
CREATE POLICY "Users are viewable by everyone" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own record" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Volunteer profiles: viewable by all, editable by owner
CREATE POLICY "Volunteer profiles viewable by all" ON volunteer_profiles FOR SELECT USING (true);
CREATE POLICY "Volunteer can edit own profile" ON volunteer_profiles FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY "Volunteer can insert own profile" ON volunteer_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Schools: viewable by all, editable by owner
CREATE POLICY "Schools viewable by all" ON schools FOR SELECT USING (true);
CREATE POLICY "School can edit own record" ON schools FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY "School can insert own record" ON schools FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Requests: viewable by all, editable by school owner
CREATE POLICY "Requests viewable by all" ON volunteer_requests FOR SELECT USING (true);
CREATE POLICY "School can insert requests" ON volunteer_requests FOR INSERT
  WITH CHECK (
    school_id IN (SELECT id FROM schools WHERE user_id = auth.uid())
  );
CREATE POLICY "School can update own requests" ON volunteer_requests FOR UPDATE
  USING (
    school_id IN (SELECT id FROM schools WHERE user_id = auth.uid())
  );

-- Matches: viewable by relevant volunteer and school
CREATE POLICY "Matches viewable by participants" ON matches FOR SELECT USING (
  volunteer_id IN (SELECT id FROM volunteer_profiles WHERE user_id = auth.uid())
  OR
  request_id IN (
    SELECT vr.id FROM volunteer_requests vr
    JOIN schools s ON s.id = vr.school_id
    WHERE s.user_id = auth.uid()
  )
);
CREATE POLICY "Volunteer can insert match" ON matches FOR INSERT
  WITH CHECK (
    volunteer_id IN (SELECT id FROM volunteer_profiles WHERE user_id = auth.uid())
  );
CREATE POLICY "Participants can update match" ON matches FOR UPDATE
  USING (
    volunteer_id IN (SELECT id FROM volunteer_profiles WHERE user_id = auth.uid())
    OR
    request_id IN (
      SELECT vr.id FROM volunteer_requests vr
      JOIN schools s ON s.id = vr.school_id
      WHERE s.user_id = auth.uid()
    )
  );

-- Notifications: only owner
CREATE POLICY "Notifications owned by user" ON notifications FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "Notifications can be inserted for any user" ON notifications FOR INSERT
  WITH CHECK (true);
CREATE POLICY "User can update own notifications" ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- ─── Realtime ─────────────────────────────────────────────────
-- Enable realtime on relevant tables (run in Supabase Dashboard > Database > Replication)
-- ALTER PUBLICATION supabase_realtime ADD TABLE volunteer_requests;
-- ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
-- ALTER PUBLICATION supabase_realtime ADD TABLE matches;

-- ─── Seed Data (Demo) ────────────────────────────────────────
-- These are inserted after creating auth users via the app.
-- Example dummy data for testing:

/*
INSERT INTO users (id, name, email, role, phone, city) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Admin System', 'admin@eduvolunteer.id', 'admin', '081200000000', 'Jakarta'),
  ('22222222-2222-2222-2222-222222222222', 'Budi Santoso', 'budi@volunteer.id', 'volunteer', '081211111111', 'Jakarta'),
  ('33333333-3333-3333-3333-333333333333', 'SDN Harapan 01', 'harapan@school.id', 'school', '021123456', 'Jakarta Timur');

INSERT INTO volunteer_profiles (user_id, skills, availability, latitude, longitude, experience) VALUES
  ('22222222-2222-2222-2222-222222222222',
   ARRAY['Matematika', 'IPA'],
   ARRAY['Senin', 'Rabu', 'Jumat'],
   -6.2088, 106.8456,
   'Lulusan Teknik ITB, 3 tahun pengalaman mengajar privat');

INSERT INTO schools (user_id, school_name, address, latitude, longitude, contact_person) VALUES
  ('33333333-3333-3333-3333-333333333333',
   'SDN Harapan 01',
   'Jl. Pendidikan No. 1, Jakarta Timur',
   -6.2200, 106.8600,
   'Ibu Sari Dewi');

INSERT INTO volunteer_requests (school_id, subject_needed, level, urgency, description, schedule, status) VALUES
  ((SELECT id FROM schools WHERE school_name = 'SDN Harapan 01'),
   'Matematika', 'SMP', 'high',
   'Membutuhkan guru Matematika untuk kelas 7 dan 8, fokus pada aljabar dasar.',
   'Senin 09:00-11:00',
   'open');
*/
