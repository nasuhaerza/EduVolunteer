import React, { useEffect, useState } from 'react';
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RequestCard } from '../../components/cards/RequestCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { COLORS } from '../../constants';
import { matchingService } from '../../services/matchingService';
import type { VolunteerRequest } from '../../types';

export default function AdminRequestsScreen() {
  const [requests, setRequests] = useState<VolunteerRequest[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const data = await matchingService.getAllRequests();
    setRequests(data);
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const openCount = requests.filter((r) => r.status === 'open').length;
  const matchedCount = requests.filter((r) => r.status === 'matched').length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Semua Request</Text>
        <Text style={styles.count}>{requests.length} total</Text>
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{openCount}</Text>
          <Text style={styles.summaryLabel}>Terbuka</Text>
        </View>
        <View style={styles.summarySep} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{matchedCount}</Text>
          <Text style={styles.summaryLabel}>Dicocokkan</Text>
        </View>
        <View style={styles.summarySep} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{requests.length - openCount - matchedCount}</Text>
          <Text style={styles.summaryLabel}>Lainnya</Text>
        </View>
      </View>

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        ListEmptyComponent={<EmptyState icon="document-outline" title="Belum ada request" />}
        renderItem={({ item }) => (
          <RequestCard request={item} showStatus onPress={() => {}} />
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
  summary: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 14,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summarySep: { width: 1, backgroundColor: COLORS.border },
  summaryValue: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  summaryLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
});
