import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
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
import { BADGES, COLORS } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import { useUserContext } from '../../contexts/UserContext';
import { useLocation } from '../../hooks/useLocation';
import { matchingService } from '../../services/matchingService';
import type { AvailabilityDay, Skill } from '../../types';
import { getInitials } from '../../utils';

export default function ProfileScreen() {
  const { appUser, signOut } = useAuth();
  const { volunteerProfile, refreshProfile } = useUserContext();
  const { latitude, longitude, refreshLocation, isLoading: locLoading } = useLocation();

  const [skills, setSkills] = useState<Skill[]>(volunteerProfile?.skills ?? []);
  const [availability, setAvailability] = useState<AvailabilityDay[]>(
    volunteerProfile?.availability ?? []
  );
  const [experience, setExperience] = useState(volunteerProfile?.experience ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!appUser) return;
    setSaving(true);
    try {
      // Update location
      const lat = latitude ?? volunteerProfile?.latitude ?? 0;
      const lng = longitude ?? volunteerProfile?.longitude ?? 0;

      await matchingService.upsertVolunteerProfile(appUser.id, {
        skills,
        availability,
        experience,
        latitude: lat,
        longitude: lng,
      });
      await refreshProfile();
      Alert.alert('Berhasil', 'Profil berhasil disimpan!');
    } catch (err: any) {
      Alert.alert('Gagal', err.message ?? 'Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Keluar', 'Anda yakin ingin keluar?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: signOut },
    ]);
  };

  const initials = getInitials(appUser?.name ?? 'U');
  const earnedBadges =
    volunteerProfile?.badges?.map((bid) => BADGES.find((b) => b.id === bid)).filter(Boolean) ?? [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Avatar & Name */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{appUser?.name}</Text>
          <Text style={styles.email}>{appUser?.email}</Text>
          <View style={styles.roleBadge}>
            <Ionicons name="person" size={14} color={COLORS.primary} />
            <Text style={styles.roleText}>Relawan Pengajar</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {volunteerProfile?.total_hours ?? 0}
            </Text>
            <Text style={styles.statLabel}>Jam Mengajar</Text>
          </View>
          <View style={styles.statSep} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {volunteerProfile?.rating?.toFixed(1) ?? '0.0'}
            </Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statSep} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{skills.length}</Text>
            <Text style={styles.statLabel}>Skill</Text>
          </View>
        </View>

        {/* Badges */}
        {earnedBadges.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏆 Pencapaian</Text>
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

        {/* Location */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Lokasi GPS</Text>
            <TouchableOpacity
              style={styles.refreshBtn}
              onPress={refreshLocation}
              disabled={locLoading}
            >
              <Ionicons
                name="refresh-outline"
                size={16}
                color={COLORS.primary}
              />
              <Text style={styles.refreshText}>Perbarui</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.locationCard}>
            <Ionicons name="location" size={18} color={COLORS.primary} />
            <Text style={styles.locationText}>
              {latitude
                ? `${latitude.toFixed(4)}, ${longitude?.toFixed(4)}`
                : 'Lokasi belum terdeteksi'}
            </Text>
          </View>
        </View>

        {/* Experience */}
        <View style={styles.section}>
          <Input
            label="Pengalaman"
            placeholder="Ceritakan pengalaman mengajar Anda..."
            value={experience}
            onChangeText={setExperience}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            style={{ height: 80 }}
          />
        </View>

        {/* Skills */}
        <View style={styles.section}>
          <SkillSelector selected={skills} onChange={setSkills} label="Keahlian Mengajar" />
        </View>

        {/* Availability */}
        <View style={styles.section}>
          <AvailabilitySelector
            selected={availability}
            onChange={setAvailability}
            label="Ketersediaan Waktu"
          />
        </View>

        <Button
          title="Simpan Profil"
          onPress={handleSave}
          isLoading={saving}
          fullWidth
          size="lg"
          style={styles.saveBtn}
        />

        <Button
          title="Keluar"
          onPress={handleSignOut}
          variant="outline"
          fullWidth
          style={styles.signOutBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingBottom: 40 },
  profileHeader: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: '700', color: COLORS.primary },
  name: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  email: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 8 },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
  },
  roleText: { fontSize: 13, color: COLORS.primary, fontWeight: '500' },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statSep: { width: 1, backgroundColor: COLORS.border },
  statValue: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  section: { paddingHorizontal: 20, marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 12 },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  refreshText: { fontSize: 13, color: COLORS.primary },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  locationText: { fontSize: 13, color: COLORS.textSecondary },
  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef9c3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  badgeIcon: { fontSize: 16 },
  badgeLabel: { fontSize: 12, fontWeight: '500', color: '#713f12' },
  saveBtn: { marginHorizontal: 20, marginTop: 12, marginBottom: 12 },
  signOutBtn: { marginHorizontal: 20 },
});
