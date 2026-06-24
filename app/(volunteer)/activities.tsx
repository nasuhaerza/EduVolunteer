import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBadge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { COLORS } from '../../constants';
import { useUserContext } from '../../contexts/UserContext';
import { matchingService } from '../../services/matchingService';
import type { Match, MatchStatus } from '../../types';
import { formatTimeAgo } from '../../utils';

const TABS: { key: MatchStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'Semua' },
  { key: 'pending', label: 'Menunggu' },
  { key: 'accepted', label: 'Diterima' },
  { key: 'active', label: 'Aktif' },
  { key: 'completed', label: 'Selesai' },
];

export default function ActivitiesScreen() {
  const { volunteerProfile } = useUserContext();
  const [matches, setMatches] = useState<Match[]>([]);
  const [tab, setTab] = useState<MatchStatus | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const loadMatches = async () => {
    if (!volunteerProfile) return;
    const data = await matchingService.getMatchesByVolunteer(volunteerProfile.id);
    setMatches(data);
  };

  useEffect(() => {
    loadMatches();
  }, [volunteerProfile]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMatches();
    setRefreshing(false);
  };

  const filtered =
    tab === 'all' ? matches : matches.filter((m) => m.status === tab);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Aktivitas Saya</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map((t) => {
          const count =
            t.key === 'all'
              ? matches.length
              : matches.filter((m) => m.status === t.key).length;
          return (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, tab === t.key && styles.activeTab]}
              onPress={() => setTab(t.key)}
            >
              <Text style={[styles.tabText, tab === t.key && styles.activeTabText]}>
                {t.label}
              </Text>
              {count > 0 && (
                <View style={[styles.tabBadge, tab === t.key && styles.activeTabBadge]}>
                  <Text style={[styles.tabBadgeText, tab === t.key && styles.activeTabBadgeText]}>
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="document-outline"
            title="Tidak ada aktivitas"
            subtitle="Misi yang Anda daftar akan muncul di sini."
          />
        }
        renderItem={({ item }) => {
          const req = item.request;
          const school = req?.school;
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.schoolIcon}>
                  <Ionicons name="school" size={18} color={COLORS.primary} />
                </View>
                <View style={styles.cardMeta}>
                  <Text style={styles.cardSchool} numberOfLines={1}>
                    {school?.school_name ?? '—'}
                  </Text>
                  <Text style={styles.cardTime}>{formatTimeAgo(item.created_at)}</Text>
                </View>
                <StatusBadge status={item.status} />
              </View>

              <View style={styles.subjectRow}>
                <View style={styles.subjectBadge}>
                  <Text style={styles.subjectText}>{req?.subject_needed ?? '—'}</Text>
                </View>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelText}>{req?.level ?? '—'}</Text>
                </View>
              </View>

              <View style={styles.scoreRow}>
                <Ionicons name="flash-outline" size={14} color={COLORS.textSecondary} />
                <Text style={styles.scoreText}>Skor kecocokan: {item.match_score}/100</Text>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 6,
    flexWrap: 'wrap',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: { fontSize: 12, fontWeight: '500', color: COLORS.textSecondary },
  activeTabText: { color: COLORS.white },
  tabBadge: {
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  activeTabBadge: { backgroundColor: 'rgba(255,255,255,0.3)' },
  tabBadgeText: { fontSize: 10, fontWeight: '600', color: COLORS.textSecondary },
  activeTabBadgeText: { color: COLORS.white },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
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
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  schoolIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cardMeta: { flex: 1, marginRight: 8 },
  cardSchool: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  cardTime: { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  subjectRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  subjectBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  subjectText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  levelBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  levelText: { fontSize: 12, fontWeight: '500', color: COLORS.textSecondary },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  scoreText: { fontSize: 12, color: COLORS.textSecondary },
});
