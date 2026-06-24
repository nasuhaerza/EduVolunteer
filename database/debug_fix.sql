-- ============================================================
-- DEBUG & FIX — Jalankan di Supabase SQL Editor
-- ============================================================

-- 1. Cek apakah schools.user_id terisi atau NULL
SELECT id, school_name, user_id, created_at
FROM schools
ORDER BY created_at DESC;

-- 2. Cek users dengan role school
SELECT id, name, email, role
FROM users
WHERE role = 'school';

-- 3. Cek apakah ada requests yang sudah dibuat
SELECT id, school_id, subject_needed, status, created_at
FROM volunteer_requests
ORDER BY created_at DESC;

-- ────────────────────────────────────────────────────────────
-- FIX: Update user_id di schools jika NULL
-- Jalankan ini SETELAH melihat hasil query 1 dan 2 di atas
-- Ganti 'email-sekolah@domain.com' dengan email akun sekolah Anda
-- ────────────────────────────────────────────────────────────

-- UPDATE schools
-- SET user_id = (SELECT id FROM users WHERE email = 'email-sekolah@domain.com' AND role = 'school')
-- WHERE user_id IS NULL;

-- ────────────────────────────────────────────────────────────
-- ALTERNATIF: Update berdasarkan nama sekolah
-- ────────────────────────────────────────────────────────────

-- UPDATE schools s
-- SET user_id = u.id
-- FROM users u
-- WHERE u.role = 'school'
--   AND s.user_id IS NULL
--   AND (s.school_name = u.name OR s.contact_person = u.name);

-- ────────────────────────────────────────────────────────────
-- VERIFIKASI setelah fix:
-- ────────────────────────────────────────────────────────────

-- SELECT s.id, s.school_name, s.user_id, u.email, u.name
-- FROM schools s
-- LEFT JOIN users u ON u.id = s.user_id;
