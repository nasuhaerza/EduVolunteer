import { useEffect } from 'react';
import { notificationService } from '../services/notificationService';

export function useNotificationSetup() {
  useEffect(() => {
    notificationService.registerForPushNotifications().catch((err) => {
      console.warn('[Notifications] Could not register:', err);
    });
  }, []);
}
