import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react';
import { notificationService } from '../services/notificationService';
import { supabase } from '../services/supabase';
import type { Notification } from '../types';
import { useAuth } from './AuthContext';

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { appUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const refresh = useCallback(async () => {
    if (!appUser) return;
    setIsLoading(true);
    try {
      const data = await notificationService.getNotifications(appUser.id);
      setNotifications(data);
    } finally {
      setIsLoading(false);
    }
  }, [appUser]);

  useEffect(() => {
    if (!appUser) {
      setNotifications([]);
      return;
    }
    refresh();

    // Realtime subscription
    const channel = supabase
      .channel(`notifications:${appUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${appUser.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
          // Show local push
          notificationService.sendLocalNotification(
            (payload.new as Notification).title,
            (payload.new as Notification).message
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [appUser, refresh]);

  const markAsRead = async (id: string) => {
    await notificationService.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const markAllAsRead = async () => {
    if (!appUser) return;
    await notificationService.markAllAsRead(appUser.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, isLoading, markAsRead, markAllAsRead, refresh }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
