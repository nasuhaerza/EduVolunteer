import * as ExpoNotifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Notification } from '../types';
import { supabase } from './supabase';

// Configure notification handler
ExpoNotifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const notificationService = {
  async registerForPushNotifications(): Promise<string | null> {
    if (Platform.OS === 'android') {
      await ExpoNotifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: ExpoNotifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2563EB',
      });
    }

    const { status: existingStatus } =
      await ExpoNotifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await ExpoNotifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    const token = await ExpoNotifications.getExpoPushTokenAsync();
    return token.data;
  },

  async sendLocalNotification(title: string, body: string) {
    await ExpoNotifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
      },
      trigger: null, // fire immediately
    });
  },

  // ── Database Notifications ────────────────────────────────────────────────

  async createNotification(payload: {
    user_id: string;
    title: string;
    message: string;
    type?: Notification['type'];
    reference_id?: string;
  }) {
    const { error } = await supabase.from('notifications').insert({
      ...payload,
      is_read: false,
    });
    if (error) throw error;
  },

  async getNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as Notification[];
  },

  async markAsRead(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    if (error) throw error;
  },

  async markAllAsRead(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    if (error) throw error;
  },

  async getUnreadCount(userId: string): Promise<number> {
    const { count } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    return count ?? 0;
  },
};
