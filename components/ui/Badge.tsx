import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { RequestUrgency } from '../../types';
import { getUrgencyColor, getUrgencyLabel } from '../../utils';

interface UrgencyBadgeProps {
  urgency: RequestUrgency;
}

export function UrgencyBadge({ urgency }: UrgencyBadgeProps) {
  const color = getUrgencyColor(urgency);
  return (
    <View style={[styles.badge, { backgroundColor: `${color}20`, borderColor: color }]}>
      <Text style={[styles.text, { color }]}>{getUrgencyLabel(urgency)}</Text>
    </View>
  );
}

interface StatusBadgeProps {
  status: string;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  open: { label: 'Terbuka', color: '#2563eb' },
  matched: { label: 'Dicocokkan', color: '#7c3aed' },
  filled: { label: 'Terisi', color: '#16a34a' },
  closed: { label: 'Ditutup', color: '#64748b' },
  pending: { label: 'Menunggu', color: '#f59e0b' },
  accepted: { label: 'Diterima', color: '#16a34a' },
  rejected: { label: 'Ditolak', color: '#ef4444' },
  active: { label: 'Aktif', color: '#2563eb' },
  completed: { label: 'Selesai', color: '#64748b' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_MAP[status] ?? { label: status, color: '#64748b' };
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: `${config.color}20`, borderColor: config.color },
      ]}
    >
      <Text style={[styles.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
});
