import { useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import type { Match, Notification, VolunteerRequest } from '../types';

type RealtimeTable = 'volunteer_requests' | 'notifications' | 'matches';

interface UseRealtimeOptions<T> {
  table: RealtimeTable;
  filter?: string;
  onInsert?: (record: T) => void;
  onUpdate?: (record: T) => void;
  onDelete?: (record: T) => void;
  enabled?: boolean;
}

export function useRealtime<T>({
  table,
  filter,
  onInsert,
  onUpdate,
  onDelete,
  enabled = true,
}: UseRealtimeOptions<T>) {
  // Unique channel name per hook instance to avoid conflicts
  const channelId = useRef(`${table}${filter ? `:${filter}` : ''}:${Date.now()}`);

  // Use refs for callbacks to avoid re-subscribing on every render
  const onInsertRef = useRef(onInsert);
  const onUpdateRef = useRef(onUpdate);
  const onDeleteRef = useRef(onDelete);
  onInsertRef.current = onInsert;
  onUpdateRef.current = onUpdate;
  onDeleteRef.current = onDelete;

  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel(channelId.current)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' && onInsertRef.current) {
            onInsertRef.current(payload.new as T);
          } else if (payload.eventType === 'UPDATE' && onUpdateRef.current) {
            onUpdateRef.current(payload.new as T);
          } else if (payload.eventType === 'DELETE' && onDeleteRef.current) {
            onDeleteRef.current(payload.old as T);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // Only re-subscribe if table/filter/enabled changes — NOT on callback changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, filter, enabled]);
}

// ── Specialized hooks ─────────────────────────────────────────────────────────

export function useRealtimeRequests(
  onNewRequest: (req: VolunteerRequest) => void,
  enabled = true
) {
  useRealtime<VolunteerRequest>({
    table: 'volunteer_requests',
    onInsert: onNewRequest,
    enabled,
  });
}

export function useRealtimeMatches(userId: string, onUpdate: (match: Match) => void) {
  useRealtime<Match>({
    table: 'matches',
    filter: `volunteer_id=eq.${userId}`,
    onUpdate,
    enabled: !!userId,
  });
}

export function useRealtimeNotifications(userId: string, onNew: (n: Notification) => void) {
  useRealtime<Notification>({
    table: 'notifications',
    filter: `user_id=eq.${userId}`,
    onInsert: onNew,
    enabled: !!userId,
  });
}
