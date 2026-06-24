import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../constants';
import { useNotifications } from '../../contexts/NotificationContext';
import { useMatchingAgent } from '../../hooks/useMatchingAgent';
import { useNotificationSetup } from '../../hooks/useNotifications';

function TabBarIcon({
  name,
  color,
  size,
}: {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  size: number;
}) {
  return <Ionicons name={name} size={size} color={color} />;
}

function NotificationTabIcon({ color, size }: { color: string; size: number }) {
  const { unreadCount } = useNotifications();
  return (
    <View>
      <Ionicons name="notifications-outline" size={size} color={color} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
        </View>
      )}
    </View>
  );
}

export default function VolunteerLayout() {
  // Activate matching agent and push notification setup
  useMatchingAgent();
  useNotificationSetup();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.border,
          paddingBottom: 4,
          height: 60,
        },
        tabBarLabelStyle: { fontSize: 11, marginBottom: 2 },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Beranda',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="home-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="missions"
        options={{
          title: 'Misi',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="list-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="activities"
        options={{
          title: 'Aktivitas',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="checkmark-circle-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Peta',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="map-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifikasi',
          tabBarIcon: ({ color, size }) => (
            <NotificationTabIcon color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="person-outline" color={color} size={size} />
          ),
        }}
      />
      {/* Hidden screens */}
      <Tabs.Screen name="request-detail" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: COLORS.danger,
    borderRadius: 9,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },
});
