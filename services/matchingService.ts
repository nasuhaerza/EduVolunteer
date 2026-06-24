import { MATCH_THRESHOLDS } from '../constants';
import type {
  AdminStats,
  Match,
  MatchScore,
  School,
  User,
  VolunteerProfile,
  VolunteerRequest,
} from '../types';
import { supabase } from './supabase';

// ─── Distance Calculation ─────────────────────────────────────────────────────

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Score Calculation ────────────────────────────────────────────────────────

function calculateMatchScore(
  volunteer: VolunteerProfile,
  request: VolunteerRequest,
  school: School
): MatchScore {
  const { SKILL_WEIGHT, DISTANCE_WEIGHT, AVAILABILITY_WEIGHT, MAX_DISTANCE_KM } =
    MATCH_THRESHOLDS;

  // Skill match: 50 pts if volunteer has the required skill
  const skillScore = volunteer.skills.includes(request.subject_needed)
    ? SKILL_WEIGHT
    : 0;

  // Distance score: 30 pts scaled by proximity (closer = more points)
  const distanceKm = haversineDistance(
    volunteer.latitude,
    volunteer.longitude,
    school.latitude,
    school.longitude
  );
  const distanceScore =
    distanceKm <= MAX_DISTANCE_KM
      ? Math.round(DISTANCE_WEIGHT * (1 - distanceKm / MAX_DISTANCE_KM))
      : 0;

  // Availability score: 20 pts if schedule day is in volunteer availability
  const requestDay = request.schedule.split(' ')[0] as string;
  const availabilityScore =
    volunteer.availability.some((d) => d === requestDay)
      ? AVAILABILITY_WEIGHT
      : Math.round(AVAILABILITY_WEIGHT * 0.5); // partial credit

  const score = skillScore + distanceScore + availabilityScore;

  return {
    volunteer_id: volunteer.id,
    score,
    skill_score: skillScore,
    distance_score: distanceScore,
    availability_score: availabilityScore,
    distance_km: Math.round(distanceKm * 10) / 10,
  };
}

// ─── Matching Service ─────────────────────────────────────────────────────────

export const matchingService = {
  // ── Requests ──────────────────────────────────────────────────────────────

  async getOpenRequests(): Promise<VolunteerRequest[]> {
    const { data, error } = await supabase
      .from('volunteer_requests')
      .select('*, school:schools(*)')
      .eq('status', 'open')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as VolunteerRequest[];
  },

  async getRequestById(id: string): Promise<VolunteerRequest | null> {
    const { data, error } = await supabase
      .from('volunteer_requests')
      .select('*, school:schools(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as VolunteerRequest;
  },

  async getRequestsBySchool(schoolId: string): Promise<VolunteerRequest[]> {
    const { data, error } = await supabase
      .from('volunteer_requests')
      .select('*, school:schools(*)')
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('[matchingService] getRequestsBySchool error:', error.message, error.code);
      throw error;
    }
    return (data ?? []) as VolunteerRequest[];
  },

  async createRequest(
    payload: Omit<VolunteerRequest, 'id' | 'created_at' | 'school'>
  ): Promise<VolunteerRequest> {
    const { data, error } = await supabase
      .from('volunteer_requests')
      .insert({ ...payload, status: 'open' })
      .select()
      .single();
    if (error) throw error;
    return data as VolunteerRequest;
  },

  async updateRequestStatus(id: string, status: VolunteerRequest['status']) {
    const { error } = await supabase
      .from('volunteer_requests')
      .update({ status })
      .eq('id', id);
    if (error) throw error;
  },

  // ── Matches ───────────────────────────────────────────────────────────────

  async getMatchesByVolunteer(volunteerId: string): Promise<Match[]> {
    const { data, error } = await supabase
      .from('matches')
      .select('*, request:volunteer_requests(*, school:schools(*))')
      .eq('volunteer_id', volunteerId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as Match[];
  },

  async getMatchesByRequest(requestId: string): Promise<Match[]> {
    const { data, error } = await supabase
      .from('matches')
      .select('*, volunteer:volunteer_profiles(*, user:users(*))')
      .eq('request_id', requestId)
      .order('match_score', { ascending: false });
    if (error) throw error;
    return (data ?? []) as Match[];
  },

  async createMatch(
    volunteerId: string,
    requestId: string,
    score: number
  ): Promise<Match> {
    // Check if match already exists
    const { data: existing } = await supabase
      .from('matches')
      .select('id')
      .eq('volunteer_id', volunteerId)
      .eq('request_id', requestId)
      .single();

    if (existing) return existing as Match;

    const { data, error } = await supabase
      .from('matches')
      .insert({
        volunteer_id: volunteerId,
        request_id: requestId,
        match_score: score,
        status: 'pending',
      })
      .select()
      .single();
    if (error) throw error;
    return data as Match;
  },

  async updateMatchStatus(id: string, status: Match['status']) {
    const { error } = await supabase
      .from('matches')
      .update({ status })
      .eq('id', id);
    if (error) throw error;
  },

  async volunteerAcceptRequest(volunteerId: string, requestId: string) {
    const { data: match } = await supabase
      .from('matches')
      .select('id, match_score')
      .eq('volunteer_id', volunteerId)
      .eq('request_id', requestId)
      .single();

    if (match) {
      await supabase
        .from('matches')
        .update({ status: 'accepted' })
        .eq('id', match.id);
    } else {
      await supabase.from('matches').insert({
        volunteer_id: volunteerId,
        request_id: requestId,
        match_score: 0,
        status: 'accepted',
      });
    }
  },

  // ── Volunteer Profiles ────────────────────────────────────────────────────

  async getVolunteerProfile(userId: string): Promise<VolunteerProfile | null> {
    const { data, error } = await supabase
      .from('volunteer_profiles')
      .select('*, user:users(*)')
      .eq('user_id', userId)
      .single();
    if (error) return null;
    return data as VolunteerProfile;
  },

  async getAllVolunteers(): Promise<VolunteerProfile[]> {
    const { data, error } = await supabase
      .from('volunteer_profiles')
      .select('*, user:users(*)');
    if (error) throw error;
    return (data ?? []) as VolunteerProfile[];
  },

  async upsertVolunteerProfile(
    userId: string,
    payload: Partial<Omit<VolunteerProfile, 'id' | 'user_id' | 'user'>>
  ) {
    // Check if row exists first
    const { data: existing } = await supabase
      .from('volunteer_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      // Update existing row
      const { error } = await supabase
        .from('volunteer_profiles')
        .update(payload)
        .eq('user_id', userId);
      if (error) throw error;
    } else {
      // Insert new row
      const { error } = await supabase
        .from('volunteer_profiles')
        .insert({ user_id: userId, ...payload });
      if (error) throw error;
    }
  },

  // ── Schools ───────────────────────────────────────────────────────────────

  async getSchoolByUserId(userId: string): Promise<School | null> {
    // Use .limit(1) to avoid "multiple rows" error if duplicates exist
    const { data, error } = await supabase
      .from('schools')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.warn('[matchingService] getSchoolByUserId error:', error.message);
      return null;
    }

    if (data && data.length > 0) return data[0] as School;

    // Fallback: find by user name matching school_name
    const { data: userRow } = await supabase
      .from('users')
      .select('name')
      .eq('id', userId)
      .maybeSingle();

    if (userRow?.name) {
      const { data: byName } = await supabase
        .from('schools')
        .select('*')
        .ilike('school_name', userRow.name)
        .order('created_at', { ascending: false })
        .limit(1);

      if (byName && byName.length > 0) {
        const school = byName[0] as School;
        // Fix user_id so future queries work
        await supabase
          .from('schools')
          .update({ user_id: userId })
          .eq('id', school.id);
        return school;
      }
    }

    return null;
  },

  async getAllSchools(): Promise<School[]> {
    const { data, error } = await supabase.from('schools').select('*');
    if (error) throw error;
    return (data ?? []) as School[];
  },

  async updateSchool(id: string, payload: Partial<School>) {
    // Also ensure user_id is set (may be null for schools created before this fix)
    const updatePayload = { ...payload };
    // Remove joined fields that aren't DB columns
    delete (updatePayload as any).user;

    const { error } = await supabase
      .from('schools')
      .update(updatePayload)
      .eq('id', id);
    if (error) {
      console.error('[matchingService] updateSchool error:', error.message);
      throw error;
    }
  },

  // ── Agent Matching ────────────────────────────────────────────────────────

  async runMatchingAgent(request: VolunteerRequest): Promise<MatchScore[]> {
    // Fetch school data
    const school = request.school;
    if (!school) return [];

    const volunteers = await this.getAllVolunteers();

    const scores: MatchScore[] = volunteers
      .filter((v) => v.latitude !== 0 && v.longitude !== 0)
      .map((v) => calculateMatchScore(v, request, school))
      .filter((s) => s.skill_score > 0) // must have the skill
      .sort((a, b) => b.score - a.score);

    return scores;
  },

  // ── Users ─────────────────────────────────────────────────────────────────

  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return data as User;
  },

  async updateUser(id: string, payload: Partial<User>) {
    const { error } = await supabase
      .from('users')
      .update(payload)
      .eq('id', id);
    if (error) throw error;
  },

  // ── Admin Stats ───────────────────────────────────────────────────────────

  async getAdminStats(): Promise<AdminStats> {
    const [volunteers, schools, requests, matches] = await Promise.all([
      supabase.from('volunteer_profiles').select('id', { count: 'exact', head: true }),
      supabase.from('schools').select('id', { count: 'exact', head: true }),
      supabase.from('volunteer_requests').select('id', { count: 'exact', head: true }),
      supabase.from('matches').select('id', { count: 'exact', head: true }),
    ]);

    return {
      total_volunteers: volunteers.count ?? 0,
      total_schools: schools.count ?? 0,
      total_requests: requests.count ?? 0,
      total_matches: matches.count ?? 0,
    };
  },

  async getAllRequests(): Promise<VolunteerRequest[]> {
    const { data, error } = await supabase
      .from('volunteer_requests')
      .select('*, school:schools(*)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as VolunteerRequest[];
  },

  async getAllMatches(): Promise<Match[]> {
    const { data, error } = await supabase
      .from('matches')
      .select('*, volunteer:volunteer_profiles(*, user:users(*)), request:volunteer_requests(*, school:schools(*))')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as Match[];
  },
};
