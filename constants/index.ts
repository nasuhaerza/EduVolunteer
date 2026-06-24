import type { AvailabilityDay, RequestUrgency, Skill, SubjectLevel } from '../types';

export const SKILLS: Skill[] = [
  'Matematika',
  'Bahasa Inggris',
  'IPA',
  'IPS',
  'Bahasa Indonesia',
  'Fisika',
  'Kimia',
  'Biologi',
  'Sejarah',
  'Geografi',
  'Seni',
  'Olahraga',
  'TIK',
];

export const AVAILABILITY_DAYS: AvailabilityDay[] = [
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
  'Minggu',
];

export const SUBJECT_LEVELS: SubjectLevel[] = ['SD', 'SMP', 'SMA', 'SMK'];

export const URGENCY_LEVELS: RequestUrgency[] = ['low', 'medium', 'high'];

export const URGENCY_LABELS: Record<RequestUrgency, string> = {
  low: 'Rendah',
  medium: 'Sedang',
  high: 'Tinggi',
};

export const URGENCY_COLORS: Record<RequestUrgency, string> = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#ef4444',
};

export const MATCH_THRESHOLDS = {
  AUTO_MATCH: 80,
  SKILL_WEIGHT: 50,
  DISTANCE_WEIGHT: 30,
  AVAILABILITY_WEIGHT: 20,
  MAX_DISTANCE_KM: 50,
};

export const COLORS = {
  primary: '#2563EB',
  primaryLight: '#dbeafe',
  primaryDark: '#1d4ed8',
  secondary: '#64748b',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  white: '#ffffff',
  background: '#f8fafc',
  card: '#ffffff',
  border: '#e2e8f0',
  text: '#1e293b',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
};

export const BADGES = [
  { id: 'first_teach', label: 'Pengajar Pertama', icon: '🎓', condition: 1 },
  { id: 'five_teaches', label: 'Aktif Mengajar', icon: '⭐', condition: 5 },
  { id: 'ten_teaches', label: 'Pahlawan Pendidikan', icon: '🏆', condition: 10 },
  { id: 'top_rated', label: 'Relawan Terbaik', icon: '💎', condition: 0 },
];
