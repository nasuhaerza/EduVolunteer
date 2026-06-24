import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RequestCard } from '../../components/cards/RequestCard';
import { VolunteerCard } from '../../components/cards/VolunteerCard';
import { StatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { COLORS } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import { useUserContext } from '../../contexts/UserContext';
import { matchingService } from '../../services/matchingService';
import { notificationService } from '../../services/notificationService';
import type { Match, VolunteerRequest } from '../../types';

export default function ManageRequestsScreen() {
  const { schoolProfile } = useUserContext();
  const { appUser } = useAuth();
  const [requests, setRequests] = useState<VolunteerRequest[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<VolunteerRequest | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  const loadRequests = useCallback(async () => {
    if (!schoolProfile) return;
    const data = await matchingService.getRequestsBySchool(schoolProfile.id);
    setRequests(data);
  }, [schoolProfile]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  };

  const openRequest = async (req: VolunteerRequest) => {
    setSelectedRequest(req);
    const m = await matchingService.getMatchesByRequest(req.id);
    setMatches(m);
    setModalVisible(true);
  };

  const handleAcceptVolunteer = async (match: Match) => {
    if (!match.volunteer?.user_id && !match.volunteer?.user?.id) return;
    const volunteerId = match.volunteer?.user?.id ?? match.volunteer?.user_id;

    Alert.alert('Terima Relawan', `Terima relawan ${match.volunteer?.user?.name}?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Terima',
        onPress: async () => {
          try {
            await matchingService.updateMatchStatus(match.id, 'accepted');
            if (selectedRequest) {
              await matchingService.updateRequestStatus(selectedRequest.id, 'matched');
            }
            if (volunteerId) {
              await notificationService.createNotification({
                user_id: volunteerId,
                title: '🎉 Selamat! Request Diterima',
                message: `Sekolah ${selectedRequest?.school?.school_name ?? ''} menerima Anda sebagai pengajar ${selectedRequest?.subject_needed}.`,
                type: 'accept',
                reference_id: selectedRequest?.id,
              });
            }
            // Refresh matches
            if (selectedRequest) {
              const updated = await matchingService.getMatchesByRequest(selectedRequest.id);
              setMatches(updated);
            }
            await loadRequests();
            Alert.alert('Berhasil', 'Relawan berhasil diterima!');
          } catch (err: any) {
            Alert.alert('Gagal', err.message);
          }
        },
      },
    ]);
  };

  const handleRejectVolunteer = async (match: Match) => {
    const volunteerId = match.volunteer?.user?.id;
    Alert.alert('Tolak Relawan', 'Tolak relawan ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Tolak',
        style: 'destructive',
        onPress: async () => {
          try {
            await matchingService.updateMatchStatus(match.id, 'rejected');
            if (volunteerId) {
              await notificationService.createNotification({
                user_id: volunteerId,
                title: 'Pendaftaran Ditolak',
                message: `Maaf, ${selectedRequest?.school?.school_name ?? 'Sekolah'} tidak dapat menerima Anda saat ini.`,
                type: 'reject',
                reference_id: selectedRequest?.id,
              });
            }
            if (selectedRequest) {
              const updated = await matchingService.getMatchesByRequest(selectedRequest.id);
              setMatches(updated);
            }
          } catch (err: any) {
            Alert.alert('Gagal', err.message);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Kelola Request</Text>
        <Text style={styles.count}>{requests.length} request</Text>
      </View>

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="document-outline"
            title="Belum ada request"
            subtitle="Buat request untuk mencari relawan pengajar."
          />
        }
        renderItem={({ item }) => (
          <RequestCard
            request={item}
            showStatus
            onPress={() => openRequest(item)}
          />
        )}
      />

      {/* Match Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modal} edges={['top']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Pendaftar</Text>
            <View style={{ width: 24 }} />
          </View>

          {selectedRequest && (
            <View style={styles.requestInfo}>
              <View style={styles.subjectBadge}>
                <Text style={styles.subjectText}>{selectedRequest.subject_needed}</Text>
              </View>
              <Text style={styles.levelText}>{selectedRequest.level}</Text>
              <StatusBadge status={selectedRequest.status} />
            </View>
          )}

          <ScrollView contentContainerStyle={styles.modalList}>
            {matches.length === 0 ? (
              <EmptyState
                icon="people-outline"
                title="Belum ada pendaftar"
                subtitle="Relawan yang mendaftar akan muncul di sini."
              />
            ) : (
              matches.map((match) => (
                <View key={match.id} style={styles.matchItem}>
                  {match.volunteer && (
                    <VolunteerCard
                      volunteer={match.volunteer}
                      matchScore={match.match_score}
                    />
                  )}
                  <View style={styles.matchActions}>
                    <StatusBadge status={match.status} />
                    {match.status === 'pending' && (
                      <View style={styles.actionBtns}>
                        <Button
                          title="Terima"
                          onPress={() => handleAcceptVolunteer(match)}
                          size="sm"
                          style={{ flex: 1 }}
                        />
                        <Button
                          title="Tolak"
                          onPress={() => handleRejectVolunteer(match)}
                          variant="outline"
                          size="sm"
                          style={{ flex: 1 }}
                        />
                      </View>
                    )}
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  modal: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: { fontSize: 17, fontWeight: '600', color: COLORS.text },
  requestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  subjectBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  subjectText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  levelText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  modalList: { padding: 20, paddingBottom: 40 },
  matchItem: { marginBottom: 16 },
  matchActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: -4,
    paddingHorizontal: 4,
  },
  actionBtns: { flexDirection: 'row', gap: 8, flex: 1, justifyContent: 'flex-end' },
});
