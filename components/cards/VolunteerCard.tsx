import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../../constants';
import type { VolunteerProfile } from '../../types';
import { formatDistance, getInitials } from '../../utils';

interface VolunteerCardProps {
  volunteer: VolunteerProfile;
  onPress?: () => void;
  distanceKm?: number;
  matchScore?: number;
}

export function VolunteerCard({
  volunteer,
  onPress,
  distanceKm,
  matchScore,
}: VolunteerCardProps) {
  const name = volunteer.user?.name ?? 'Relawan';
  const initials = getInitials(name);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
      disabled={!onPress}
    >
      {/* Avatar */}
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          {matchScore !== undefined && (
            <View
              style={[
                styles.scoreBadge,
                { backgroundColor: matchScore >= 80 ? '#dcfce7' : '#fef9c3' },
              ]}
            >
              <Text
                style={[
                  styles.scoreText,
                  { color: matchScore >= 80 ? '#16a34a' : '#ca8a04' },
                ]}
              >
                {matchScore}%
              </Text>
            </View>
          )}
        </View>

        {/* Skills */}
        <View style={styles.skillsRow}>
          {volunteer.skills.slice(0, 3).map((skill) => (
            <View key={skill} style={styles.skillChip}>
              <Text style={styles.skillText}>{skill}</Text>
            </View>
          ))}
          {volunteer.skills.length > 3 && (
            <Text style={styles.moreSkills}>+{volunteer.skills.length - 3}</Text>
          )}
        </View>

        {/* Meta */}
        <View style={styles.meta}>
          {distanceKm !== undefined && (
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={13} color={COLORS.textSecondary} />
              <Text style={styles.metaText}>{formatDistance(distanceKm)}</Text>
            </View>
          )}
          {volunteer.rating !== undefined && volunteer.rating > 0 && (
            <View style={styles.metaItem}>
              <Ionicons name="star" size={13} color="#f59e0b" />
              <Text style={styles.metaText}>{volunteer.rating.toFixed(1)}</Text>
            </View>
          )}
          {volunteer.total_hours !== undefined && volunteer.total_hours > 0 && (
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={13} color={COLORS.textSecondary} />
              <Text style={styles.metaText}>{volunteer.total_hours} jam</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  content: { flex: 1 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
    marginRight: 8,
  },
  scoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '700',
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 8,
  },
  skillChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  skillText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  moreSkills: {
    fontSize: 11,
    color: COLORS.textMuted,
    alignSelf: 'center',
  },
  meta: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});
