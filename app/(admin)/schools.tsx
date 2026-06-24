import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/ui/EmptyState';
import { COLORS } from '../../constants';
import { matchingService } from '../../services/matchingService';
import type { School } from '../../types';

export default function AdminSchoolsScreen() {
  const [schools, setSchools] = useState<School[]>([]);
  const [filtered, setFiltered] = useState<School[]>([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const data = await matchingService.getAllSchools();
    setSchools(data);
    setFiltered(data);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!search.trim()) { setFiltered(schools); return; }
    const q = search.toLowerCase();
    setFiltered(
      schools.filter(
        (s) =>
          s.school_name.toLowerCase().includes(q) ||
          s.address.toLowerCase().includes(q)
      )
    );
  }, [search, schools]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Data Sekolah</Text>
        <Text style={styles.count}>{filtered.length} sekolah</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color={COLORS.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari nama sekolah atau alamat..."
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
        ListEmptyComponent={<EmptyState icon="school-outline" title="Tidak ada sekolah" />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.iconWrapper}>
              <Ionicons name="school" size={22} color="#16a34a" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.schoolName}>{item.school_name}</Text>
              <Text style={styles.schoolAddress} numberOfLines={1}>{item.address}</Text>
              <View style={styles.coordRow}>
                <Ionicons name="location-outline" size={12} color={COLORS.textMuted} />
                <Text style={styles.coordText}>
                  {item.latitude !== 0
                    ? `${item.latitude.toFixed(3)}, ${item.longitude.toFixed(3)}`
                    : 'Lokasi belum diset'}
                </Text>
              </View>
            </View>
          </View>
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
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardContent: { flex: 1 },
  schoolName: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 3 },
  schoolAddress: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 },
  coordRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  coordText: { fontSize: 11, color: COLORS.textMuted },
});
