import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RequestCard } from '../../components/cards/RequestCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { COLORS, URGENCY_LABELS, URGENCY_LEVELS } from '../../constants';
import { useUserContext } from '../../contexts/UserContext';
import { useRealtimeRequests } from '../../hooks/useRealtime';
import { matchingService } from '../../services/matchingService';
import type { RequestUrgency, Skill, VolunteerRequest } from '../../types';
import { haversineDistance } from '../../utils';

const RADIUS_OPTIONS = [5, 10, 25, 50];
const SKILL_OPTIONS: Skill[] = ['Matematika', 'Bahasa Inggris', 'IPA', 'IPS', 'Fisika', 'Kimia'];

export default function MissionsScreen() {
  const { volunteerProfile } = useUserContext();
  const [requests, setRequests] = useState<VolunteerRequest[]>([]);
  const [filtered, setFiltered] = useState<VolunteerRequest[]>([]);
  const [search, setSearch] = useState('');
  const [skillFilter, setSkillFilter] = useState<Skill | null>(null);
  const [urgencyFilter, setUrgencyFilter] = useState<RequestUrgency | null>(null);
  const [radiusKm, setRadiusKm] = useState(50);
  const [refreshing, setRefreshing] = useState(false);

  // Use ref so realtime callback always has latest requests
  const requestsRef = useRef<VolunteerRequest[]>([]);
  requestsRef.current = requests;

  const loadRequests = useCallback(async () => {
    try {
      const data = await matchingService.getOpenRequests();
      setRequests(data);
    } catch (err) {
      console.error('[Missions] loadRequests error:', err);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // Realtime: prepend new requests, avoid duplicates
  useRealtimeRequests((newReq) => {
    setRequests((prev) => {
      const alreadyExists = prev.some((r) => r.id === newReq.id);
      if (alreadyExists) return prev;
      return [newReq, ...prev];
    });
  });

  // Apply filters
  useEffect(() => {
    let result = [...requests];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.subject_needed.toLowerCase().includes(q) ||
          (r.school?.school_name?.toLowerCase().includes(q) ?? false) ||
          r.description.toLowerCase().includes(q)
      );
    }

    if (skillFilter) {
      result = result.filter((r) => r.subject_needed === skillFilter);
    }

    if (urgencyFilter) {
      result = result.filter((r) => r.urgency === urgencyFilter);
    }

    if (volunteerProfile && volunteerProfile.latitude !== 0) {
      result = result.filter((r) => {
        if (!r.school || r.school.latitude === 0) return true;
        const d = haversineDistance(
          volunteerProfile.latitude,
          volunteerProfile.longitude,
          r.school.latitude,
          r.school.longitude
        );
        return d <= radiusKm;
      });
    }

    setFiltered(result);
  }, [requests, search, skillFilter, urgencyFilter, radiusKm, volunteerProfile]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  };

  const getDistance = (req: VolunteerRequest): number | undefined => {
    if (!volunteerProfile || !req.school || volunteerProfile.latitude === 0) return undefined;
    if (req.school.latitude === 0) return undefined;
    return (
      Math.round(
        haversineDistance(
          volunteerProfile.latitude,
          volunteerProfile.longitude,
          req.school.latitude,
          req.school.longitude
        ) * 10
      ) / 10
    );
  };

  const clearAllFilters = () => {
    setSearch('');
    setSkillFilter(null);
    setUrgencyFilter(null);
    setRadiusKm(50);
  };

  const hasActiveFilter =
    search.trim().length > 0 || skillFilter !== null || urgencyFilter !== null || radiusKm !== 50;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Misi Tersedia</Text>
        <View style={styles.headerRight}>
          {hasActiveFilter && (
            <TouchableOpacity style={styles.clearBtn} onPress={clearAllFilters}>
              <Text style={styles.clearText}>Reset</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.count}>{filtered.length} misi</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search-outline"
          size={18}
          color={COLORS.textMuted}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari mata pelajaran atau sekolah..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter chips — scrollable horizontal */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {/* Urgency filters */}
        {URGENCY_LEVELS.map((u) => (
          <TouchableOpacity
            key={`urgency-${u}`}
            style={[styles.chip, urgencyFilter === u ? styles.activeChip : styles.inactiveChip]}
            onPress={() => setUrgencyFilter(urgencyFilter === u ? null : u)}
          >
            <Text
              style={[
                styles.chipText,
                urgencyFilter === u ? styles.activeChipText : styles.inactiveChipText,
              ]}
            >
              {URGENCY_LABELS[u]}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Divider */}
        <View style={styles.chipDivider} />

        {/* Skill filters */}
        {SKILL_OPTIONS.map((s) => (
          <TouchableOpacity
            key={`skill-${s}`}
            style={[styles.chip, skillFilter === s ? styles.activeChip : styles.inactiveChip]}
            onPress={() => setSkillFilter(skillFilter === s ? null : s)}
          >
            <Text
              style={[
                styles.chipText,
                skillFilter === s ? styles.activeChipText : styles.inactiveChipText,
              ]}
            >
              {s}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Divider */}
        <View style={styles.chipDivider} />

        {/* Radius filters */}
        {RADIUS_OPTIONS.map((r) => (
          <TouchableOpacity
            key={`radius-${r}`}
            style={[styles.chip, radiusKm === r ? styles.activeChip : styles.inactiveChip]}
            onPress={() => setRadiusKm(r)}
          >
            <Text
              style={[
                styles.chipText,
                radiusKm === r ? styles.activeChipText : styles.inactiveChipText,
              ]}
            >
              {r} km
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="search-outline"
            title="Tidak ada misi"
            subtitle={
              hasActiveFilter
                ? 'Tidak ada misi yang cocok dengan filter. Coba ubah filter.'
                : 'Belum ada misi tersedia. Cek lagi nanti.'
            }
          />
        }
        renderItem={({ item }) => (
          <RequestCard
            request={item}
            distanceKm={getDistance(item)}
            onPress={() =>
              router.push({
                pathname: '/(volunteer)/request-detail' as any,
                params: { id: item.id },
              })
            }
          />
        )}
      />
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  count: { fontSize: 14, color: COLORS.textSecondary },
  clearBtn: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  clearText: { fontSize: 12, color: '#dc2626', fontWeight: '600' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 14,
    color: COLORS.text,
  },
  filterRow: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipDivider: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.border,
    marginHorizontal: 2,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  activeChip: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  inactiveChip: { backgroundColor: COLORS.white, borderColor: COLORS.border },
  chipText: { fontSize: 12, fontWeight: '500' },
  activeChipText: { color: COLORS.white },
  inactiveChipText: { color: COLORS.textSecondary },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
});
