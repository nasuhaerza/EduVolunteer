import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RequestCard } from '../../components/cards/RequestCard';
import { StatCard } from '../../components/cards/StatCard';
import { COLORS } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import { useUserContext } from '../../contexts/UserContext';
import { matchingService } from '../../services/matchingService';
import type { Match, VolunteerRequest } from '../../types';
import { haversineDistance } from '../../utils';

export default function VolunteerHome() {
  const { appUser } = useAuth();
  const { volunteerProfile } = useUserContext();
  const [requests, setRequests] = useState<VolunteerRequest[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const activeCount = matches.filter((m) => m.status === 'active').length;
  const completedCount = matches.filter((m) => m.status === 'completed').length;

  const loadData = async () => {
    try {
      const [reqs, myMatches] = await Promise.all([
        matchingService.getOpenRequests(),
        volunteerProfile
          ? matchingService.getMatchesByVolunteer(volunteerProfile.id)
          : Promise.resolve([]),
      ]);
      setRequests(reqs.slice(0, 5));
      setMatches(myMatches);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, [volunteerProfile]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getDistance = (req: VolunteerRequest) => {
    if (!volunteerProfile || !req.school) return undefined;
    return Math.round(
      haversineDistance(
        volunteerProfile.latitude,
        volunteerProfile.longitude,
        req.school.latitude,
        req.school.longitude
      ) * 10
    ) / 10;
  };

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Selamat Pagi' : hour < 17 ? 'Selamat Siang' : 'Selamat Malam';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.name} numberOfLines={1}>
              {appUser?.name ?? 'Relawan'} 👋
            </Text>
          </View>
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => router.push('/(volunteer)/notifications' as any)}
          >
            <Ionicons name="notifications-outline" size={22} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Banner agent */}
        <View style={styles.banner}>
          <View style={styles.bannerIcon}>
            <Ionicons name="flash" size={22} color={COLORS.white} />
          </View>
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>Agent Aktif 🤖</Text>
            <Text style={styles.bannerSub}>
              Agent pencocokan berjalan otomatis untuk menemukan misi terbaik Anda.
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard
            icon="checkmark-circle-outline"
            iconColor="#16a34a"
            iconBg="#dcfce7"
            value={completedCount}
            label="Selesai"
          />
          <StatCard
            icon="time-outline"
            iconColor="#2563eb"
            iconBg="#dbeafe"
            value={activeCount}
            label="Aktif"
          />
          <StatCard
            icon="star-outline"
            iconColor="#f59e0b"
            iconBg="#fef3c7"
            value={volunteerProfile?.rating?.toFixed(1) ?? '0.0'}
            label="Rating"
          />
        </View>

        {/* Recent Requests */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Request Terbaru</Text>
            <TouchableOpacity onPress={() => router.push('/(volunteer)/missions' as any)}>
              <Text style={styles.seeAll}>Lihat Semua</Text>
            </TouchableOpacity>
          </View>

          {requests.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={32} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>Belum ada request tersedia</Text>
            </View>
          ) : (
            requests.map((req) => (
              <RequestCard
                key={req.id}
                request={req}
                distanceKm={getDistance(req)}
                onPress={() =>
                  router.push({
                    pathname: '/(volunteer)/request-detail' as any,
                    params: { id: req.id },
                  })
                }
              />
            ))
          )}
        </View>

        {/* Profile CTA if incomplete */}
        {volunteerProfile &&
          volunteerProfile.skills.length === 0 && (
            <TouchableOpacity
              style={styles.profileCta}
              onPress={() => router.push('/(volunteer)/profile' as any)}
            >
              <Ionicons name="alert-circle-outline" size={20} color="#ea580c" />
              <Text style={styles.profileCtaText}>
                Lengkapi profil Anda agar agent dapat menemukan misi terbaik
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#ea580c" />
            </TouchableOpacity>
          )}
      </ScrollView>
    </SafeAreaView>
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
  greeting: { fontSize: 14, color: COLORS.textSecondary },
  name: { fontSize: 22, fontWeight: '700', color: COLORS.text, maxWidth: 220 },
  notifBtn: {
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
  banner: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 12,
    alignItems: 'center',
  },
  bannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerText: { flex: 1 },
  bannerTitle: { fontSize: 15, fontWeight: '700', color: COLORS.white },
  bannerSub: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  seeAll: { fontSize: 14, color: COLORS.primary, fontWeight: '500' },
  empty: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyText: { fontSize: 14, color: COLORS.textMuted },
  profileCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 20,
    marginBottom: 24,
    gap: 8,
  },
  profileCtaText: {
    flex: 1,
    fontSize: 13,
    color: '#9a3412',
    lineHeight: 18,
  },
});
