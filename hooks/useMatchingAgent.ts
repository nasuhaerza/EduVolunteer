import { useCallback } from 'react';
import { MATCH_THRESHOLDS } from '../constants';
import { matchingService } from '../services/matchingService';
import { notificationService } from '../services/notificationService';
import { supabase } from '../services/supabase';
import type { VolunteerRequest } from '../types';
import { useRealtimeRequests } from './useRealtime';

export function useMatchingAgent() {
  const runAgent = useCallback(async (request: VolunteerRequest) => {
    try {
      // Fetch full request with school data if not present
      let fullRequest = request;
      if (!request.school) {
        const fetched = await matchingService.getRequestById(request.id);
        if (!fetched) return;
        fullRequest = fetched;
      }

      const scores = await matchingService.runMatchingAgent(fullRequest);

      for (const score of scores) {
        if (score.score >= MATCH_THRESHOLDS.AUTO_MATCH) {
          // Create match record
          await matchingService.createMatch(
            score.volunteer_id,
            fullRequest.id,
            score.score
          );

          // Get volunteer user_id to send notification
          const { data: volunteerProfile } = await supabase
            .from('volunteer_profiles')
            .select('user_id')
            .eq('id', score.volunteer_id)
            .single();

          if (volunteerProfile) {
            const schoolName =
              fullRequest.school?.school_name ?? 'Sebuah Sekolah';
            await notificationService.createNotification({
              user_id: volunteerProfile.user_id,
              title: '🎓 Rekomendasi Mengajar Baru!',
              message: `${schoolName} membutuhkan guru ${fullRequest.subject_needed} (${fullRequest.level}). Skor kecocokan Anda: ${score.score}/100. Jarak: ${score.distance_km} km.`,
              type: 'match',
              reference_id: fullRequest.id,
            });
          }
        }
      }
    } catch (err) {
      console.error('[MatchingAgent] Error:', err);
    }
  }, []);

  // Subscribe to new requests in realtime and auto-run the agent
  useRealtimeRequests((newRequest) => {
    runAgent(newRequest);
  });

  return { runAgent };
}
