import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AvailabilitySelector } from '../../components/forms/AvailabilitySelector';
import { SkillSelector } from '../../components/forms/SkillSelector';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { BADGES, COLORS } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import { useUserContext } from '../../contexts/UserContext';
import { useLocation } from '../../hooks/useLocation';
import { matchingService } from '../../services/matchingService';
import type { AvailabilityDay, Skill } from '../../types';
import { getInitials } from '../../utils';

export default function ProfileScreen() {
  const { appUser, signOut, refreshUser } = useAuth();
  const { volunteerProfile, refreshProfile, isLoading: profileLoading } = useUserContext();
  const { latitude, longitude, refreshLocation, isLoading: locLoading } = useLocation();

  // Form state — sync from volunteerProfile when it loads
  const [name, setName] = useState(appUser?.name ?? '');
  const [phone, setPhone] = useState(appUser?.phone ?? '');
  const [city, setCity] = useState(appUser?.city ?? '');
  const [skills, setSkills] = useState<Skill[]>([]);
  const [availability, setAvailability] = useState<AvailabilityDay[]>([]);
  const [experience, setExperience] = useState('');
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync form when profile loads
  useEffect(() => {
    if (volunteerProfile) {
      setSkills(volunteerProfile.skills ?? []);
      setAvailability(volunteerProfile.availability ?? []);
      setExperience(volunteerProfile.experience ?? '');
    }
  }, [volunteerProfile]);

  useEffect(() => {
    if (appUser) {
      setName(appUser.name ?? '');
      setPhone(appUser.phone ?? '');
      setCity(appUser.city ?? '');
    }
  }, [appUser]);

  const handleSave = async () => {
    if (!appUser) return;
    if (skills.length === 0) {
      Alert.alert('Perhatian', 'Pilih minimal satu keahlian mengajar.');
      return;
    }

    setSaving(true);
    try {
      const lat = latitude ?? volunteerProfile?.latitude ?? 0;
      const lng = longitude ?? volunteerProfile?.longitude ?? 0;

      // Update user info
      await matchingService.updateUser(appUser.id, {
        name: name.trim(),
        phone: phone.trim() || undefined,
        city: city.trim() || undefined,
      });

      // Upsert volunteer profile
      await matchingService.upsertVolunteerProfile(appUser.id, {
        skills,
        availability,
        experience: experience.trim(),
        latitude: lat,
        longitude: lng,
      });

      await Promise.all([refreshProfile(), refreshUser()]);
      setHasChanges(false);
      Alert.alert('✅ Berhasil', 'Profil berhasil disimpan!');
    } catch (err: any) {
      Alert.alert('Gagal', err.message ?? 'Terjadi kesalahan saat menyimpan.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Keluar', 'Anda yakin ingin keluar?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login' as any);
        },
      },
    ]);
  };

  if (profileLoading && !volunteerProfile) {
    return <LoadingScreen message="Memuat profil..." />;
  }

  const initials = getInitials(name || appUser?.name || 'U');
  const earnedBadges =
    volunteerProfile?.badges
      ?.map((bid) => BADGES.find((b) => b.id === bid))
      .filter(Boolean) ?? [];

  const locationText = latitude
    ? `${latitude.toFixed(5)}, ${longitude?.toFixed(5)}`
    : volunteerProfile?.latitude && volunteerProfile.latitude !== 0
    ? `${volunteerProfile.latitude.toFixed(5)}, ${volunteerProfile.longitude?.toFixed(5)}`
    : null;

  const isProfileComplete = skills.length > 0 && availability.length > 0 && locationText !== null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Header ── */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarWrapper}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              {isProfileComplete && (
                <View style={styles.completeBadge}>
                  <Ionicons name="checkmark" size={12} color="#fff" />
                </View>
              )}
            </View>
            <Text style={styles.email}>{appUser?.email}</Text>
            <View style={styles.roleBadge}>
              <Ionicons name="person" size={13} color={COLORS.primary} />
              <Text style={styles.roleText}>Relawan Pengajar</Text>
            </View>
          </View>

          {/* ── Stats ── */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{volunteerProfile?.total_hours ?? 0}</Text>
              <Text style={styles.statLabel}>Jam Mengajar</Text>
            </View>
            <View style={styles.statSep} />
            <View style={styles.statItem}>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={16} color="#f59e0b" />
                <Text style={styles.statValue}>
                  {volunteerProfile?.rating && volunteerProfile.rating > 0
                    ? volunteerProfile.rating.toFixed(1)
                    : '-'}
                </Text>
              </View>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statSep} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{skills.length}</Text>
              <Text style={styles.statLabel}>Keahlian</Text>
            </View>
            <View style={styles.statSep} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{availability.length}</Text>
              <Text style={styles.statLabel}>Hari Aktif</Text>
            </View>
          </View>

          {/* ── Profile incomplete warning ── */}
          {!isProfileComplete && (
            <View style={styles.warningBanner}>
              <Ionicons name="alert-circle-outline" size={18} color="#ea580c" />
              <Text style={styles.warningText}>
                Lengkapi profil agar agent dapat mencocokkan Anda dengan misi terbaik.
              </Text>
            </View>
          )}

          {/* ── Badges ── */}
          {earnedBadges.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🏆 Pencapaian</Text>
              <View style={styles.badgesGrid}>
                {earnedBadges.map((badge) => (
                  <View key={badge!.id} style={styles.badgeChip}>
                    <Text style={styles.badgeIcon}>{badge!.icon}</Text>
                    <Text style={styles.badgeLabel}>{badge!.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── Info Pribadi ── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>👤 Info Pribadi</Text>
            <Input
              label="Nama Lengkap"
              placeholder="Nama lengkap Anda"
              value={name}
              onChangeText={(v) => { setName(v); setHasChanges(true); }}
              leftIcon="person-outline"
            />
            <Input
              label="Nomor HP"
              placeholder="08xxxxxxxxxx"
              value={phone}
              onChangeText={(v) => { setPhone(v); setHasChanges(true); }}
              keyboardType="phone-pad"
              leftIcon="call-outline"
            />
            <Input
              label="Kota"
              placeholder="Jakarta, Bandung, ..."
              value={city}
              onChangeText={(v) => { setCity(v); setHasChanges(true); }}
              leftIcon="location-outline"
            />
          </View>

          {/* ── Pengalaman ── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📝 Pengalaman Mengajar</Text>
            <Input
              placeholder="Ceritakan pengalaman mengajar Anda, latar belakang pendidikan, dll..."
              value={experience}
              onChangeText={(v) => { setExperience(v); setHasChanges(true); }}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={styles.textArea}
            />
          </View>

          {/* ── Lokasi GPS ── */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>📍 Lokasi GPS</Text>
              <TouchableOpacity
                style={styles.refreshBtn}
                onPress={() => { refreshLocation(); setHasChanges(true); }}
                disabled={locLoading}
              >
                <Ionicons
                  name={locLoading ? 'hourglass-outline' : 'refresh-outline'}
                  size={15}
                  color={COLORS.primary}
                />
                <Text style={styles.refreshText}>
                  {locLoading ? 'Mendeteksi...' : 'Perbarui'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.locationCard, locationText ? styles.locationCardActive : {}]}>
              <Ionicons
                name={locationText ? 'location' : 'location-outline'}
                size={18}
                color={locationText ? COLORS.primary : COLORS.textMuted}
              />
              <View style={styles.locationInfo}>
                <Text style={[styles.locationText, !locationText && styles.locationEmpty]}>
                  {locationText ?? 'Lokasi belum terdeteksi'}
                </Text>
                {locationText && (
                  <Text style={styles.locationHint}>
                    Lokasi ini digunakan untuk mencocokkan dengan sekolah terdekat
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* ── Keahlian ── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🎓 Keahlian Mengajar</Text>
            {skills.length === 0 && (
              <Text style={styles.emptyHint}>Pilih minimal satu keahlian</Text>
            )}
            <SkillSelector
              selected={skills}
              onChange={(v) => { setSkills(v); setHasChanges(true); }}
            />
          </View>

          {/* ── Ketersediaan ── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📅 Ketersediaan Hari</Text>
            {availability.length === 0 && (
              <Text style={styles.emptyHint}>Pilih hari yang Anda tersedia mengajar</Text>
            )}
            <AvailabilitySelector
              selected={availability}
              onChange={(v) => { setAvailability(v); setHasChanges(true); }}
            />
          </View>

          {/* ── Actions ── */}
          <View style={styles.actions}>
            <Button
              title={saving ? 'Menyimpan...' : hasChanges ? 'Simpan Perubahan' : 'Profil Tersimpan'}
              onPress={handleSave}
              isLoading={saving}
              disabled={!hasChanges}
              fullWidth
              size="lg"
            />
            <Button
              title="Keluar"
              onPress={handleSignOut}
              variant="outline"
              fullWidth
              style={styles.signOutBtn}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingBottom: 40 },

  // Header
  profileHeader: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 16,
  },
  avatarWrapper: { position: 'relative', marginBottom: 12 },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  avatarText: { fontSize: 30, fontWeight: '700', color: COLORS.primary },
  completeBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  email: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 8 },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
  },
  roleText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },

  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statSep: { width: 1, backgroundColor: COLORS.border },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statValue: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, textAlign: 'center' },

  // Warning
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  warningText: { flex: 1, fontSize: 13, color: '#9a3412', lineHeight: 18 },

  // Cards
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyHint: {
    fontSize: 12,
    color: COLORS.danger,
    marginBottom: 8,
    fontStyle: 'italic',
  },

  // Text area
  textArea: {
    height: 90,
    paddingTop: 8,
  },

  // Location
  locationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  locationCardActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  locationInfo: { flex: 1 },
  locationText: { fontSize: 13, color: COLORS.text, fontWeight: '500' },
  locationEmpty: { color: COLORS.textMuted, fontStyle: 'italic' },
  locationHint: { fontSize: 11, color: COLORS.textSecondary, marginTop: 3 },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  refreshText: { fontSize: 12, color: COLORS.primary, fontWeight: '500' },

  // Badges
  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef9c3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 5,
  },
  badgeIcon: { fontSize: 16 },
  badgeLabel: { fontSize: 12, fontWeight: '600', color: '#713f12' },

  // Actions
  actions: { paddingHorizontal: 16, marginTop: 8 },
  signOutBtn: { marginTop: 10 },
});
