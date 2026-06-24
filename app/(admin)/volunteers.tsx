import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VolunteerCard } from '../../components/cards/VolunteerCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { COLORS } from '../../constants';
import { matchingService } from '../../services/matchingService';
import type { VolunteerProfile } from '../../types';

export default function AdminVolunteersScreen() {
  const [volunteers, setVolunteers] = useState<VolunteerProfile[]>([]);
  const [filtered, setFiltered] = useState<VolunteerProfile[]>([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const data = await matchingService.getAllVolunteers();
    setVolunteers(data);
    setFiltered(data);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!search.trim()) { setFiltered(volunteers); return; }
    const q = search.toLowerCase();
    setFiltered(
      volunteers.filter(
        (v) =>
          v.user?.name?.toLowerCase().includes(q) ||
          v.skills.some((s) => s.toLowerCase().includes(q)) ||
          v.user?.city?.toLowerCase().includes(q)
      )
    );
  }, [search, volunteers]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Data Relawan</Text>
        <Text style={styles.count}>{filtered.length} relawan</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color={COLORS.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari nama, skill, kota..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        ListEmptyComponent={<EmptyState icon="people-outline" title="Tidak ada relawan" />}
        renderItem={({ item }) => <VolunteerCard volunteer={item} />}
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
  title: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  count: { fontSize: 14, color: COLORS.textSecondary },
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
  searchInput: { flex: 1, height: 44, fontSize: 14, color: COLORS.text },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
});
