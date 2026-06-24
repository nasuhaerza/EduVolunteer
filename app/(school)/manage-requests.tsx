import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
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
import { StatusBadge, UrgencyBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { COLORS } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import { useUserContext } from '../../contexts/UserContext';
import { matchingService } from '../../services/matchingService';
import { notificationService } from '../../services/notificationService';
import type { Match, RequestStatus, VolunteerRequest } from '../../types';
import { formatDate } from '../../utils';

type FilterTab = 'all' | RequestStatus;

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'Semua' },
  { key: 'open', label: 'Terbuka' },
  { key: 'matched', label: 'Dicocokkan' },
  { key: 'filled', label: 'Terisi' },
  { key: 'closed', label: 'Ditutup' },
];

export default function ManageRequestsScreen() {
  const { schoolProfile, isLoading, refreshProfile } = useUserContext();
  const { appUser } = useAuth();

  const [requests, setRequests] = useState<VolunteerRequest[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);

  // Modal state
  const [selectedRequest, setSelectedRequest] = useState<VolunteerRequest | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [processingMatchId, setProcessingMatchId] = useState<string | null>(null);

  // ── Load requests ──────────────────────────────────────────────────────────

  const loadRequests = useCallback(async (schoolId?: string) => {
    const id = schoolId ?? schoolProfile?.id;
    if (!id) {
      console.warn('[ManageRequests] No school ID available, skipping load');
      return;
    }
    setIsLoadingRequests(true);
    try {
      const data = await matchingService.getRequestsBySchool(id);
      setRequests(data);
    } catch (err: any) {
      console.error('[ManageRequests] loadRequests error:', err.message);
      Alert.alert('Gagal memuat', err.message ?? 'Tidak dapat memuat request');
    } finally {
      setIsLoadingRequests(false);
    }
  }, [schoolProfile]);

  useEffect(() => {
    if (schoolProfile?.id) {
      loadRequests(schoolProfile.id);
    }
  }, [schoolProfile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // If schoolProfile still null after context loaded, try refreshing once
  useEffect(() => {
    if (!isLoading && !schoolProfile && appUser?.role === 'school') {
      refreshProfile();
    }
  }, [isLoading, schoolProfile, appUser]); // eslint-disable-line react-hooks/exhaustive-deps

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  };

  // ── Filtered list ──────────────────────────────────────────────────────────

  const filtered =
    activeFilter === 'all'
      ? requests
      : requests.filter((r) => r.status === activeFilter);

  const countByStatus = (status: RequestStatus) =>
    requests.filter((r) => r.status === status).length;

  // ── Open modal ─────────────────────────────────────────────────────────────

  const openModal = async (req: VolunteerRequest) => {
    setSelectedRequest(req);
    setMatches([]);
    setModalVisible(true);
    setLoadingMatches(true);
    try {
      const m = await matchingService.getMatchesByRequest(req.id);
      setMatches(m);
    } catch (err) {
      console.error('[ManageRequests] getMatchesByRequest', err);
    } finally {
      setLoadingMatches(false);
    }
  };

  const refreshMatches = async (requestId: string) => {
    const updated = await matchingService.getMatchesByRequest(requestId);
    setMatches(updated);
  };

  // ── Accept volunteer ───────────────────────────────────────────────────────

  const handleAccept = async (match: Match) => {
    const volunteerUserId = match.volunteer?.user?.id;
    const volunteerName = match.volunteer?.user?.name ?? 'Relawan';

    Alert.alert(
      'Terima Relawan',
      `Terima ${volunteerName} sebagai pengajar ${selectedRequest?.subject_needed}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Terima',
          onPress: async () => {
            setProcessingMatchId(match.id);
            try {
              await matchingService.updateMatchStatus(match.id, 'accepted');

              if (selectedRequest) {
                await matchingService.updateRequestStatus(selectedRequest.id, 'matched');
                // Update selected request status locally
                setSelectedRequest((prev) =>
                  prev ? { ...prev, status: 'matched' } : prev
                );
              }

              if (volunteerUserId) {
                await notificationService.createNotification({
                  user_id: volunteerUserId,
                  title: '🎉 Pendaftaran Diterima!',
                  message: `${selectedRequest?.school?.school_name ?? 'Sekolah'} menerima Anda sebagai pengajar ${selectedRequest?.subject_needed} (${selectedRequest?.level}).`,
                  type: 'accept',
                  reference_id: selectedRequest?.id,
                });
              }

              if (selectedRequest) await refreshMatches(selectedRequest.id);
              await loadRequests();
            } catch (err: any) {
              Alert.alert('Gagal', err.message ?? 'Terjadi kesalahan');
            } finally {
              setProcessingMatchId(null);
            }
          },
        },
      ]
    );
  };

  // ── Reject volunteer ───────────────────────────────────────────────────────

  const handleReject = async (match: Match) => {
    const volunteerUserId = match.volunteer?.user?.id;
    const volunteerName = match.volunteer?.user?.name ?? 'Relawan';

    Alert.alert('Tolak Relawan', `Tolak pendaftaran ${volunteerName}?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Tolak',
        style: 'destructive',
        onPress: async () => {
          setProcessingMatchId(match.id);
          try {
            await matchingService.updateMatchStatus(match.id, 'rejected');

            if (volunteerUserId) {
              await notificationService.createNotification({
                user_id: volunteerUserId,
                title: 'Pendaftaran Tidak Diterima',
                message: `Maaf, ${selectedRequest?.school?.school_name ?? 'Sekolah'} belum dapat menerima Anda untuk posisi ${selectedRequest?.subject_needed} saat ini.`,
                type: 'reject',
                reference_id: selectedRequest?.id,
              });
            }

            if (selectedRequest) await refreshMatches(selectedRequest.id);
          } catch (err: any) {
            Alert.alert('Gagal', err.message ?? 'Terjadi kesalahan');
          } finally {
            setProcessingMatchId(null);
          }
        },
      },
    ]);
  };

  // ── Close request ──────────────────────────────────────────────────────────

  const handleCloseRequest = async (req: VolunteerRequest) => {
    Alert.alert(
      'Tutup Request',
      'Tutup request ini? Request yang ditutup tidak akan muncul di daftar misi relawan.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Tutup Request',
          style: 'destructive',
          onPress: async () => {
            try {
              await matchingService.updateRequestStatus(req.id, 'closed');
              await loadRequests();
              setModalVisible(false);
            } catch (err: any) {
              Alert.alert('Gagal', err.message);
            }
          },
        },
      ]
    );
  };

  // ── Guards ─────────────────────────────────────────────────────────────────

  // Show loading while context is still fetching profile
  if (isLoading) {
    return <LoadingScreen message="Memuat data sekolah..." />;
  }

  // Only show "no profile" after loading is done AND profile is confirmed null
  if (!schoolProfile) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Kelola Request</Text>
        </View>
        <EmptyState
          icon="school-outline"
          title="Profil Sekolah Belum Ada"
          subtitle="Lengkapi profil sekolah Anda terlebih dahulu di halaman Profil."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Kelola Request</Text>
          <Text style={styles.subtitle}>{schoolProfile?.school_name ?? ''}</Text>
        </View>
        <View style={styles.totalBadge}>
          <Text style={styles.totalText}>{requests.length}</Text>
        </View>
      </View>

      {/* Stats row */}
      {requests.length > 0 && (
        <View style={styles.statsRow}>
          {(['open', 'matched', 'filled'] as RequestStatus[]).map((s) => {
            const count = countByStatus(s);
            const colors: Record<string, string> = {
              open: COLORS.primary,
              matched: '#7c3aed',
              filled: '#16a34a',
            };
            const labels: Record<string, string> = {
              open: 'Terbuka',
              matched: 'Dicocokkan',
              filled: 'Terisi',
            };
            return (
              <View key={s} style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors[s] }]}>{count}</Text>
                <Text style={styles.statLabel}>{labels[s]}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {FILTER_TABS.map((tab) => {
          const count = tab.key === 'all' ? requests.length : countByStatus(tab.key as RequestStatus);
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeFilter === tab.key && styles.activeTab]}
              onPress={() => setActiveFilter(tab.key)}
            >
              <Text style={[styles.tabText, activeFilter === tab.key && styles.activeTabText]}>
                {tab.label}
              </Text>
              {count > 0 && (
                <View style={[styles.tabBadge, activeFilter === tab.key && styles.activeTabBadge]}>
                  <Text style={[styles.tabBadgeText, activeFilter === tab.key && styles.activeTabBadgeText]}>
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

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
          isLoadingRequests ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
          ) : (
            <EmptyState
              icon="document-outline"
              title={activeFilter === 'all' ? 'Belum ada request' : `Tidak ada request ${FILTER_TABS.find(t => t.key === activeFilter)?.label.toLowerCase()}`}
              subtitle={activeFilter === 'all' ? 'Buat request untuk mencari relawan pengajar.' : 'Coba filter lain.'}
            />
          )
        }
        renderItem={({ item }) => (
          <RequestCard
            request={item}
            showStatus
            onPress={() => openModal(item)}
          />
        )}
      />

      {/* ── Match Detail Modal ── */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modal} edges={['top']}>
          {/* Modal header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={20} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Pendaftar Relawan</Text>
            <View style={{ width: 36 }} />
          </View>

          {/* Request info */}
          {selectedRequest && (
            <View style={styles.requestInfoCard}>
              <View style={styles.requestInfoTop}>
                <View style={styles.subjectBadge}>
                  <Text style={styles.subjectText}>{selectedRequest.subject_needed}</Text>
                </View>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelText}>{selectedRequest.level}</Text>
                </View>
                <UrgencyBadge urgency={selectedRequest.urgency} />
                <StatusBadge status={selectedRequest.status} />
              </View>
              <View style={styles.requestInfoRow}>
                <Ionicons name="calendar-outline" size={13} color={COLORS.textSecondary} />
                <Text style={styles.requestInfoText}>{selectedRequest.schedule}</Text>
              </View>
              <View style={styles.requestInfoRow}>
                <Ionicons name="time-outline" size={13} color={COLORS.textSecondary} />
                <Text style={styles.requestInfoText}>
                  Dibuat {formatDate(selectedRequest.created_at)}
                </Text>
              </View>

              {/* Close request button */}
              {(selectedRequest.status === 'open' || selectedRequest.status === 'matched') && (
                <TouchableOpacity
                  style={styles.closeRequestBtn}
                  onPress={() => handleCloseRequest(selectedRequest)}
                >
                  <Ionicons name="close-circle-outline" size={15} color={COLORS.danger} />
                  <Text style={styles.closeRequestText}>Tutup Request</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Matches list */}
          <ScrollView contentContainerStyle={styles.modalList}>
            {loadingMatches ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={COLORS.primary} />
                <Text style={styles.loadingText}>Memuat pendaftar...</Text>
              </View>
            ) : matches.length === 0 ? (
              <EmptyState
                icon="people-outline"
                title="Belum ada pendaftar"
                subtitle="Relawan yang mendaftar atau direkomendasikan oleh agent akan muncul di sini."
              />
            ) : (
              <>
                <Text style={styles.matchesCount}>
                  {matches.length} pendaftar · {matches.filter(m => m.status === 'pending').length} menunggu keputusan
                </Text>
                {matches.map((match) => (
                  <View key={match.id} style={styles.matchItem}>
                    {match.volunteer && (
                      <VolunteerCard
                        volunteer={match.volunteer}
                        matchScore={match.match_score}
                      />
                    )}

                    {/* Match actions */}
                    <View style={styles.matchFooter}>
                      <StatusBadge status={match.status} />
                      {match.status === 'pending' && (
                        processingMatchId === match.id ? (
                          <ActivityIndicator size="small" color={COLORS.primary} />
                        ) : (
                          <View style={styles.actionBtns}>
                            <Button
                              title="Tolak"
                              onPress={() => handleReject(match)}
                              variant="outline"
                              size="sm"
                              style={styles.rejectBtn}
                            />
                            <Button
                              title="Terima"
                              onPress={() => handleAccept(match)}
                              size="sm"
                              style={styles.acceptBtn}
                            />
                          </View>
                        )
                      )}
                      {match.status === 'accepted' && (
                        <View style={styles.acceptedBadge}>
                          <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                          <Text style={styles.acceptedText}>Diterima</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </>
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
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  totalBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  totalText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },

  filterRow: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
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
  activeTab: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
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

  // Modal
  modal: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },

  requestInfoCard: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 8,
  },
  requestInfoTop: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  subjectBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  subjectText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  levelBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  levelText: { fontSize: 13, fontWeight: '500', color: COLORS.textSecondary },
  requestInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  requestInfoText: { fontSize: 12, color: COLORS.textSecondary },
  closeRequestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
    marginTop: 4,
  },
  closeRequestText: { fontSize: 12, color: COLORS.danger, fontWeight: '600' },

  loadingContainer: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  loadingText: { fontSize: 14, color: COLORS.textSecondary },

  modalList: { padding: 16, paddingBottom: 48 },
  matchesCount: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: 12,
  },

  matchItem: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  matchFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionBtns: { flexDirection: 'row', gap: 8 },
  rejectBtn: { minWidth: 72 },
  acceptBtn: { minWidth: 72 },
  acceptedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  acceptedText: { fontSize: 12, color: '#16a34a', fontWeight: '600' },
});
