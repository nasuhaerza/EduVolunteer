import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VolunteerMap } from '../../components/maps/VolunteerMap';
import { UrgencyBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { COLORS } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import { useUserContext } from '../../contexts/UserContext';
import { matchingService } from '../../services/matchingService';
import { notificationService } from '../../services/notificationService';
import type { VolunteerRequest } from '../../types';
import { formatDate, formatDistance, haversineDistance } from '../../utils';

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { appUser } = useAuth();
  const { volunteerProfile } = useUserContext();
  const [request, setRequest] = useState<VolunteerRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    if (!id) return;
    matchingService.getRequestById(id).then((req) => {
      setRequest(req);
      setIsLoading(false);
    });

    // Check if already applied
    if (volunteerProfile) {
      matchingService
        .getMatchesByVolunteer(volunteerProfile.id)
        .then((matches) => {
          setHasApplied(matches.some((m) => m.request_id === id));
        });
    }
  }, [id, volunteerProfile]);

  const handleAccept = async () => {
    if (!volunteerProfile || !request || !appUser) return;

    Alert.alert(
      'Konfirmasi',
      `Anda yakin ingin mendaftar sebagai relawan untuk ${request.subject_needed} di ${request.school?.school_name}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Daftar',
          onPress: async () => {
            setAccepting(true);
            try {
              await matchingService.volunteerAcceptRequest(volunteerProfile.id, request.id);

              // Notify school
              if (request.school?.user_id) {
                await notificationService.createNotification({
                  user_id: request.school.user_id,
                  title: '✋ Relawan Mendaftar',
                  message: `${appUser.name} mendaftar untuk mengajar ${request.subject_needed} (${request.level}) di sekolah Anda.`,
                  type: 'match',
                  reference_id: request.id,
                });
              }

              setHasApplied(true);
              Alert.alert('Berhasil!', 'Pendaftaran Anda telah dikirim ke sekolah.');
            } catch (err: any) {
              Alert.alert('Gagal', err.message ?? 'Terjadi kesalahan');
            } finally {
              setAccepting(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading) return <LoadingScreen />;
  if (!request) return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={{ textAlign: 'center', marginTop: 40 }}>Request tidak ditemukan</Text>
    </SafeAreaView>
  );

  const school = request.school;
  const distanceKm = volunteerProfile && school
    ? haversineDistance(
        volunteerProfile.latitude,
        volunteerProfile.longitude,
        school.latitude,
        school.longitude
      )
    : null;

  const mapMarkers = school
    ? [
        {
          id: school.id,
          latitude: school.latitude,
          longitude: school.longitude,
          title: school.school_name,
          description: school.address,
          type: 'school' as const,
        },
      ]
    : [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detail Request</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.content}>
          {/* School info */}
          <View style={styles.schoolCard}>
            <View style={styles.schoolIcon}>
              <Ionicons name="school" size={28} color={COLORS.primary} />
            </View>
            <View style={styles.schoolInfo}>
              <Text style={styles.schoolName}>{school?.school_name ?? '—'}</Text>
              <Text style={styles.schoolAddress} numberOfLines={2}>
                {school?.address ?? '—'}
              </Text>
              {distanceKm !== null && (
                <View style={styles.distanceRow}>
                  <Ionicons name="location-outline" size={13} color={COLORS.primary} />
                  <Text style={styles.distanceText}>{formatDistance(distanceKm)} dari lokasi Anda</Text>
                </View>
              )}
            </View>
          </View>

          {/* Badges */}
          <View style={styles.badgesRow}>
            <View style={styles.subjectBadge}>
              <Text style={styles.subjectText}>{request.subject_needed}</Text>
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>{request.level}</Text>
            </View>
            <UrgencyBadge urgency={request.urgency} />
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Deskripsi Kebutuhan</Text>
            <Text style={styles.description}>{request.description}</Text>
          </View>

          {/* Schedule */}
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Jadwal</Text>
              <Text style={styles.infoValue}>{request.schedule}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={18} color={COLORS.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Kontak</Text>
              <Text style={styles.infoValue}>{school?.contact_person ?? '—'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={18} color={COLORS.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Diposting</Text>
              <Text style={styles.infoValue}>{formatDate(request.created_at)}</Text>
            </View>
          </View>

          {/* Map */}
          {school && school.latitude !== 0 && (
            <View style={styles.mapSection}>
              <Text style={styles.sectionTitle}>Lokasi Sekolah</Text>
              <VolunteerMap
                markers={mapMarkers}
                initialLatitude={school.latitude}
                initialLongitude={school.longitude}
                height={200}
              />
            </View>
          )}

          {/* Accept button */}
          <View style={styles.ctaSection}>
            {hasApplied ? (
              <View style={styles.appliedBanner}>
                <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                <Text style={styles.appliedText}>Anda sudah mendaftar untuk misi ini</Text>
              </View>
            ) : (
              <Button
                title="Daftar Sebagai Relawan"
                onPress={handleAccept}
                isLoading={accepting}
                fullWidth
                size="lg"
              />
            )}
          </View>
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
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  schoolCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  schoolIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  schoolInfo: { flex: 1 },
  schoolName: { fontSize: 17, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  schoolAddress: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  distanceRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  distanceText: { fontSize: 13, color: COLORS.primary, fontWeight: '500' },
  badgesRow: { flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  subjectBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  subjectText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  levelBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  levelText: { fontSize: 14, fontWeight: '500', color: COLORS.textSecondary },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  description: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 12, color: COLORS.textMuted, marginBottom: 2 },
  infoValue: { fontSize: 14, color: COLORS.text, fontWeight: '500' },
  mapSection: { marginBottom: 24 },
  ctaSection: { marginTop: 8 },
  appliedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  appliedText: { fontSize: 15, color: '#15803d', fontWeight: '500' },
});
