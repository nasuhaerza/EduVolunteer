// ─── User & Auth Types ───────────────────────────────────────────────────────

export type UserRole = 'volunteer' | 'school' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  city?: string;
  created_at: string;
}

// ─── Volunteer Profile ────────────────────────────────────────────────────────

export type Skill =
  | 'Matematika'
  | 'Bahasa Inggris'
  | 'IPA'
  | 'IPS'
  | 'Bahasa Indonesia'
  | 'Fisika'
  | 'Kimia'
  | 'Biologi'
  | 'Sejarah'
  | 'Geografi'
  | 'Seni'
  | 'Olahraga'
  | 'TIK';

export type AvailabilityDay =
  | 'Senin'
  | 'Selasa'
  | 'Rabu'
  | 'Kamis'
  | 'Jumat'
  | 'Sabtu'
  | 'Minggu';

export interface VolunteerProfile {
  id: string;
  user_id: string;
  skills: Skill[];
  availability: AvailabilityDay[];
  latitude: number;
  longitude: number;
  experience: string;
  rating?: number;
  total_hours?: number;
  badges?: string[];
  // Joined from users table
  user?: User;
}

// ─── School ───────────────────────────────────────────────────────────────────

export interface School {
  id: string;
  school_name: string;
  address: string;
  latitude: number;
  longitude: number;
  contact_person: string;
  // Joined from users table
  user_id?: string;
  user?: User;
}

// ─── Volunteer Request ────────────────────────────────────────────────────────

export type SubjectLevel = 'SD' | 'SMP' | 'SMA' | 'SMK';
export type RequestUrgency = 'low' | 'medium' | 'high';
export type RequestStatus = 'open' | 'matched' | 'filled' | 'closed';

export interface VolunteerRequest {
  id: string;
  school_id: string;
  subject_needed: Skill;
  level: SubjectLevel;
  urgency: RequestUrgency;
  description: string;
  schedule: string;
  status: RequestStatus;
  created_at: string;
  // Joined
  school?: School;
}

// ─── Match ────────────────────────────────────────────────────────────────────

export type MatchStatus = 'pending' | 'accepted' | 'rejected' | 'active' | 'completed';

export interface Match {
  id: string;
  volunteer_id: string;
  request_id: string;
  match_score: number;
  status: MatchStatus;
  created_at: string;
  // Joined
  volunteer?: VolunteerProfile;
  request?: VolunteerRequest;
}

// ─── Notification ─────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  type?: 'match' | 'request' | 'system' | 'accept' | 'reject';
  reference_id?: string;
}

// ─── Matching Agent ───────────────────────────────────────────────────────────

export interface MatchScore {
  volunteer_id: string;
  score: number;
  skill_score: number;
  distance_score: number;
  availability_score: number;
  distance_km: number;
}

// ─── Map ──────────────────────────────────────────────────────────────────────

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  description?: string;
  type: 'school' | 'volunteer' | 'user';
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export interface AdminStats {
  total_volunteers: number;
  total_schools: number;
  total_requests: number;
  total_matches: number;
}
