import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { COLORS } from '../../constants';
import { matchingService } from '../../services/matchingService';
import type { VolunteerProfile } from '../../types';
import { getInitials } from '../../utils';

export default function VolunteerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [volunteer, setVolunteer] = useState<VolunteerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    matchingService.getVolunteerProfile(id).then((v) => {
      setVolunteer(v);
      setIsLoading(false);
    });
  }, [id]);

  if (isLoading) return <LoadingScreen />;
  if (!volunteer) return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={{ textAlign: 'center', marginTop: 40 }}>Relawan tidak ditemukan</Text>
    </SafeAreaView>
  );

  const name = volunteer.user?.name ?? 'Relawan';
  const initials = getInitials(name);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profil Relawan</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.city}>{volunteer.user?.city ?? ''}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{volunteer.rating?.toFixed(1) ?? '0.0'}</Text>
              <View style={styles.statLabelRow}>
                <Ionicons name="star" size={12} color="#f59e0b" />
                <Text style={styles.statLabel}>Rating</Text>
              </View>
            </View>
            <View style={styles.statSep} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{volunteer.total_hours ?? 0}</Text>
              <Text style={styles.statLabel}>Jam Mengajar</Text>
            </View>
            <View style={styles.statSep} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{volunteer.skills.length}</Text>
              <Text style={styles.statLabel}>Skill</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {/* Skills */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Keahlian</Text>
            <View style={styles.skillsGrid}>
              {volunteer.skills.map((skill) => (
                <View key={skill} style={styles.skillChip}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Availability */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ketersediaan</Text>
            <View style={styles.availRow}>
              {volunteer.availability.map((day) => (
                <View key={day} style={styles.dayChip}>
                  <Text style={styles.dayText}>{day}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Experience */}
          {volunteer.experience && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pengalaman</Text>
              <Text style={styles.experienceText}>{volunteer.experience}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: COLORS.text },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: '700', color: COLORS.primary },
  name: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  city: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 16 },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    paddingHorizontal: 20,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statSep: { width: 1, backgroundColor: COLORS.border },
  statValue: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  statLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  statLabel: { fontSize: 12, color: COLORS.textSecondary },
  content: { padding: 20 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 12 },
  skillsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillChip: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  skillText: { fontSize: 13, fontWeight: '500', color: COLORS.primary },
  availRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  dayText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  experienceText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22 },
});
