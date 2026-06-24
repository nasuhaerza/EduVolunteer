import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { COLORS } from '../../constants';
import { useNotifications } from '../../contexts/NotificationContext';
import type { Notification } from '../../types';
import { formatTimeAgo } from '../../utils';

const NOTIF_ICONS: Record<string, { name: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  match: { name: 'flash', color: '#7c3aed', bg: '#ede9fe' },
  request: { name: 'document-text', color: '#2563eb', bg: '#dbeafe' },
  accept: { name: 'checkmark-circle', color: '#16a34a', bg: '#dcfce7' },
  reject: { name: 'close-circle', color: '#dc2626', bg: '#fee2e2' },
  system: { name: 'information-circle', color: '#64748b', bg: '#f1f5f9' },
};

export default function NotificationsScreen() {
  const { notifications, isLoading, markAsRead, markAllAsRead, refresh } = useNotifications();

  const unread = notifications.filter((n) => !n.is_read).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Notifikasi</Text>
        {unread > 0 && (
          <Button
            title="Tandai Semua"
            onPress={markAllAsRead}
            variant="ghost"
            size="sm"
          />
        )}
      </View>

      {unread > 0 && (
        <View style={styles.unreadBanner}>
          <Ionicons name="notifications" size={16} color={COLORS.primary} />
          <Text style={styles.unreadText}>{unread} notifikasi belum dibaca</Text>
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={COLORS.primary} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="notifications-outline"
            title="Belum ada notifikasi"
            subtitle="Notifikasi baru akan muncul di sini."
          />
        }
        renderItem={({ item }) => <NotificationItem item={item} onMarkRead={markAsRead} />}
      />
    </SafeAreaView>
  );
}

function NotificationItem({
  item,
  onMarkRead,
}: {
  item: Notification;
  onMarkRead: (id: string) => void;
}) {
  const type = item.type ?? 'system';
  const icon = NOTIF_ICONS[type] ?? NOTIF_ICONS.system;

  return (
    <TouchableOpacity
      style={[styles.notifCard, !item.is_read && styles.unreadCard]}
      onPress={() => !item.is_read && onMarkRead(item.id)}
      activeOpacity={0.85}
    >
      {!item.is_read && <View style={styles.unreadDot} />}
      <View style={[styles.notifIcon, { backgroundColor: icon.bg }]}>
        <Ionicons name={icon.name} size={20} color={icon.color} />
      </View>
      <View style={styles.notifContent}>
        <Text style={styles.notifTitle}>{item.title}</Text>
        <Text style={styles.notifMessage} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={styles.notifTime}>{formatTimeAgo(item.created_at)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  unreadBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 10,
    padding: 10,
    gap: 8,
  },
  unreadText: { fontSize: 13, color: COLORS.primary, fontWeight: '500' },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  notifCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  unreadCard: { borderLeftWidth: 3, borderLeftColor: COLORS.primary },
  unreadDot: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  notifIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notifContent: { flex: 1 },
  notifTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  notifMessage: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18, marginBottom: 6 },
  notifTime: { fontSize: 11, color: COLORS.textMuted },
});
