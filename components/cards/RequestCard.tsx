import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../../constants';
import type { VolunteerRequest } from '../../types';
import { formatTimeAgo } from '../../utils';
import { StatusBadge, UrgencyBadge } from '../ui/Badge';

interface RequestCardProps {
  request: VolunteerRequest;
  onPress: () => void;
  distanceKm?: number;
  showStatus?: boolean;
}

export function RequestCard({
  request,
  onPress,
  distanceKm,
  showStatus = false,
}: RequestCardProps) {
  const schoolName = request.school?.school_name ?? 'Sekolah';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.schoolIcon}>
          <Ionicons name="school" size={20} color={COLORS.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.schoolName} numberOfLines={1}>
            {schoolName}
          </Text>
          <Text style={styles.time}>{formatTimeAgo(request.created_at)}</Text>
        </View>
        <UrgencyBadge urgency={request.urgency} />
      </View>

      {/* Subject */}
      <View style={styles.subjectRow}>
        <View style={styles.subjectBadge}>
          <Text style={styles.subjectText}>{request.subject_needed}</Text>
        </View>
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>{request.level}</Text>
        </View>
      </View>

      {/* Description */}
      <Text style={styles.description} numberOfLines={2}>
        {request.description}
      </Text>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <Ionicons name="calendar-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.footerText}>{request.schedule}</Text>
        </View>
        {distanceKm !== undefined && (
          <View style={styles.footerItem}>
            <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.footerText}>
              {distanceKm < 1
                ? `${Math.round(distanceKm * 1000)} m`
                : `${distanceKm.toFixed(1)} km`}
            </Text>
          </View>
        )}
        {showStatus && <StatusBadge status={request.status} />}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  schoolIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerText: {
    flex: 1,
    marginRight: 8,
  },
  schoolName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  time: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  subjectRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  subjectBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  subjectText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  levelBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  levelText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});
