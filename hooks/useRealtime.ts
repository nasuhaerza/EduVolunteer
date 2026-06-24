import { useEffect } from 'react';
import { supabase } from '../services/supabase';
import type { Match, Notification, VolunteerRequest } from '../types';

type RealtimeTable = 'volunteer_requests' | 'notifications' | 'matches';

interface UseRealtimeOptions<T> {
  table: RealtimeTable;
  filter?: string;
  onInsert?: (record: T) => void;
  onUpdate?: (record: T) => void;
  onDelete?: (record: T) => void;
}

export function useRealtime<T>({
  table,
  filter,
  onInsert,
  onUpdate,
  onDelete,
}: UseRealtimeOptions<T>) {
  useEffect(() => {
    const channelName = filter ? `${table}:${filter}` : table;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' && onInsert) {
            onInsert(payload.new as T);
          } else if (payload.eventType === 'UPDATE' && onUpdate) {
            onUpdate(payload.new as T);
          } else if (payload.eventType === 'DELETE' && onDelete) {
            onDelete(payload.old as T);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter, onInsert, onUpdate, onDelete]);
}

// ── Specialized hooks ──────────────────────────────────────────────────────────

export function useRealtimeRequests(onNewRequest: (req: VolunteerRequest) => void) {
  useRealtime<VolunteerRequest>({
    table: 'volunteer_requests',
    onInsert: onNewRequest,
  });
}

export function useRealtimeMatches(
  userId: string,
  onUpdate: (match: Match) => void
) {
  useRealtime<Match>({
    table: 'matches',
    filter: `volunteer_id=eq.${userId}`,
    onUpdate,
  });
}

export function useRealtimeNotifications(
  userId: string,
  onNew: (n: Notification) => void
) {
  useRealtime<Notification>({
    table: 'notifications',
    filter: `user_id=eq.${userId}`,
    onInsert: onNew,
  });
}
