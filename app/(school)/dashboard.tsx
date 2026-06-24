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

export default function SchoolDashboard() {
  const { appUser } = useAuth();
  const { schoolProfile } = useUserContext();
  const [requests, setRequests] = useState<VolunteerRequest[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    if (!schoolProfile) return;
    try {
      const [reqs, allMatches] = await Promise.all([
        matchingService.getRequestsBySchool(schoolProfile.id),
        matchingService.getAllMatches(),
      ]);
      setRequests(reqs);
      // Filter matches for this school's requests
      const myRequestIds = new Set(reqs.map((r) => r.id));
      setMatches(allMatches.filter((m) => m.request_id && myRequestIds.has(m.request_id)));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, [schoolProfile]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const openRequests = requests.filter((r) => r.status === 'open').length;
  const filledRequests = requests.filter((r) => r.status === 'filled').length;
  const pendingMatches = matches.filter((m) => m.status === 'pending').length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Selamat datang,</Text>
            <Text style={styles.name} numberOfLines={1}>
              {schoolProfile?.school_name ?? appUser?.name ?? 'Sekolah'} 🏫
            </Text>
          </View>
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => router.push('/(school)/notifications' as any)}
          >
            <Ionicons name="notifications-outline" size={22} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard
            icon="document-text-outline"
            iconColor="#2563eb"
            iconBg="#dbeafe"
            value={requests.length}
            label="Total Request"
          />
          <StatCard
            icon="radio-button-on-outline"
            iconColor="#ea580c"
            iconBg="#ffedd5"
            value={openRequests}
            label="Terbuka"
          />
          <StatCard
            icon="checkmark-circle-outline"
            iconColor="#16a34a"
            iconBg="#dcfce7"
            value={filledRequests}
            label="Terisi"
          />
        </View>

        {/* Pending matches banner */}
        {pendingMatches > 0 && (
          <TouchableOpacity
            style={styles.pendingBanner}
            onPress={() => router.push('/(school)/manage-requests' as any)}
          >
            <View style={styles.bannerIcon}>
              <Ionicons name="people" size={20} color={COLORS.white} />
            </View>
            <View style={styles.bannerContent}>
              <Text style={styles.bannerTitle}>
                {pendingMatches} relawan menunggu konfirmasi
              </Text>
              <Text style={styles.bannerSub}>Tap untuk melihat dan menerima relawan</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.white} />
          </TouchableOpacity>
        )}

        {/* Create request CTA */}
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => router.push('/(school)/create-request' as any)}
        >
          <Ionicons name="add-circle" size={22} color={COLORS.primary} />
          <Text style={styles.createBtnText}>Buat Request Pengajar Baru</Text>
          <Ionicons name="chevron-forward" size={18} color={COLORS.primary} />
        </TouchableOpacity>

        {/* Recent Requests */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Request Terbaru</Text>
            <TouchableOpacity onPress={() => router.push('/(school)/manage-requests' as any)}>
              <Text style={styles.seeAll}>Lihat Semua</Text>
            </TouchableOpacity>
          </View>

          {requests.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="document-outline" size={32} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>Belum ada request</Text>
            </View>
          ) : (
            requests.slice(0, 4).map((req) => (
              <RequestCard
                key={req.id}
                request={req}
                showStatus
                onPress={() =>
                  router.push({
                    pathname: '/(school)/manage-requests' as any,
                    params: { requestId: req.id },
                  })
                }
              />
            ))
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  greeting: { fontSize: 14, color: COLORS.textSecondary },
  name: { fontSize: 20, fontWeight: '700', color: COLORS.text, maxWidth: 220 },
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
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  pendingBanner: {
    flexDirection: 'row',
    backgroundColor: '#7c3aed',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    gap: 12,
    alignItems: 'center',
  },
  bannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerContent: { flex: 1 },
  bannerTitle: { fontSize: 14, fontWeight: '700', color: COLORS.white },
  bannerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    gap: 10,
  },
  createBtnText: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.primary },
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
});
