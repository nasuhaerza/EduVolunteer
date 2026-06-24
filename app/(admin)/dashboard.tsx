import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatCard } from '../../components/cards/StatCard';
import { COLORS } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import { matchingService } from '../../services/matchingService';
import type { AdminStats, Match } from '../../types';

export default function AdminDashboard() {
  const { appUser, signOut } = useAuth();
  const [stats, setStats] = useState<AdminStats>({
    total_volunteers: 0,
    total_schools: 0,
    total_requests: 0,
    total_matches: 0,
  });
  const [recentMatches, setRecentMatches] = useState<Match[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [s, m] = await Promise.all([
        matchingService.getAdminStats(),
        matchingService.getAllMatches(),
      ]);
      setStats(s);
      setRecentMatches(m.slice(0, 5));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSignOut = () => {
    Alert.alert('Keluar', 'Anda yakin ingin keluar?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Admin Panel</Text>
            <Text style={styles.name}>Education Volunteer Scout</Text>
          </View>
          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={22} color={COLORS.danger} />
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <StatCard
              icon="people-outline"
              iconColor="#7c3aed"
              iconBg="#ede9fe"
              value={stats.total_volunteers}
              label="Total Relawan"
            />
            <StatCard
              icon="school-outline"
              iconColor="#16a34a"
              iconBg="#dcfce7"
              value={stats.total_schools}
              label="Total Sekolah"
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              icon="document-text-outline"
              iconColor="#2563eb"
              iconBg="#dbeafe"
              value={stats.total_requests}
              label="Total Request"
            />
            <StatCard
              icon="flash-outline"
              iconColor="#ea580c"
              iconBg="#ffedd5"
              value={stats.total_matches}
              label="Total Match"
            />
          </View>
        </View>

        {/* Navigation Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monitoring</Text>
          <View style={styles.navGrid}>
            {[
              { icon: 'people', label: 'Data Relawan', route: '/(admin)/volunteers', color: '#7c3aed', bg: '#ede9fe' },
              { icon: 'school', label: 'Data Sekolah', route: '/(admin)/schools', color: '#16a34a', bg: '#dcfce7' },
              { icon: 'document-text', label: 'Semua Request', route: '/(admin)/requests', color: '#2563eb', bg: '#dbeafe' },
              { icon: 'flash', label: 'Semua Match', route: '/(admin)/requests', color: '#ea580c', bg: '#ffedd5' },
            ].map((item) => (
              <TouchableOpacity
                key={item.label}
                style={styles.navCard}
                onPress={() => router.push(item.route as any)}
                activeOpacity={0.85}
              >
                <View style={[styles.navIcon, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon as any} size={24} color={item.color} />
                </View>
                <Text style={styles.navLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Matches */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Match Terbaru</Text>
          {recentMatches.length === 0 ? (
            <Text style={styles.emptyText}>Belum ada match</Text>
          ) : (
            recentMatches.map((match) => (
              <View key={match.id} style={styles.matchRow}>
                <View style={styles.matchLeft}>
                  <Text style={styles.matchVolunteer} numberOfLines={1}>
                    {match.volunteer?.user?.name ?? '—'}
                  </Text>
                  <Text style={styles.matchRequest} numberOfLines={1}>
                    → {match.request?.subject_needed} @ {match.request?.school?.school_name ?? '—'}
                  </Text>
                </View>
                <View style={[styles.scorePill, { backgroundColor: match.match_score >= 80 ? '#dcfce7' : '#fef9c3' }]}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: match.match_score >= 80 ? '#16a34a' : '#ca8a04' }}>
                    {match.match_score}
                  </Text>
                </View>
              </View>
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
  greeting: { fontSize: 13, color: COLORS.textSecondary },
  name: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  signOutBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsGrid: { paddingHorizontal: 20, gap: 12, marginBottom: 20 },
  statsRow: { flexDirection: 'row', gap: 12 },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 14 },
  navGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  navCard: {
    width: '47%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  navIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text, textAlign: 'center' },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  matchLeft: { flex: 1 },
  matchVolunteer: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  matchRequest: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  scorePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  emptyText: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', paddingVertical: 16 },
});
