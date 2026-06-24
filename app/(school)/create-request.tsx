import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
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
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { COLORS, SKILLS, SUBJECT_LEVELS, URGENCY_LABELS, URGENCY_LEVELS } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import { useUserContext } from '../../contexts/UserContext';
import { matchingService } from '../../services/matchingService';
import type { RequestUrgency, Skill, SubjectLevel } from '../../types';

export default function CreateRequestScreen() {
  const { appUser } = useAuth();
  const { schoolProfile, isLoading: profileLoading, refreshProfile } = useUserContext();

  const [subject, setSubject] = useState<Skill | null>(null);
  const [level, setLevel] = useState<SubjectLevel | null>(null);
  const [urgency, setUrgency] = useState<RequestUrgency>('medium');
  const [description, setDescription] = useState('');
  const [schedule, setSchedule] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!subject) e.subject = 'Pilih mata pelajaran';
    if (!level) e.level = 'Pilih tingkat kelas';
    if (!description.trim()) e.description = 'Deskripsi wajib diisi';
    if (!schedule.trim()) e.schedule = 'Jadwal wajib diisi';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const ensureSchoolProfile = async (): Promise<string | null> => {
    // If schoolProfile already loaded, use it
    if (schoolProfile?.id) return schoolProfile.id;

    if (!appUser) return null;

    // Try refresh once more
    await refreshProfile();

    // Re-read from service directly (refreshProfile updates context async)
    const school = await matchingService.getSchoolByUserId(appUser.id);
    if (school?.id) return school.id;

    // Still no profile — create one now
    const { data, error } = await (await import('../../services/supabase')).supabase
      .from('schools')
      .insert({
        user_id: appUser.id,
        school_name: appUser.name ?? 'Sekolah',
        address: appUser.city ?? '',
        latitude: 0,
        longitude: 0,
        contact_person: appUser.name ?? '',
      })
      .select('id')
      .single();

    if (error) throw new Error('Gagal membuat profil sekolah: ' + error.message);
    await refreshProfile();
    return data.id as string;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const schoolId = await ensureSchoolProfile();
      if (!schoolId) {
        Alert.alert(
          'Profil Sekolah Belum Ada',
          'Lengkapi profil sekolah Anda terlebih dahulu di halaman Profil sebelum membuat request.',
          [{ text: 'OK' }]
        );
        return;
      }

      await matchingService.createRequest({
        school_id: schoolId,
        subject_needed: subject!,
        level: level!,
        urgency,
        description: description.trim(),
        schedule: schedule.trim(),
        status: 'open',
      });

      Alert.alert(
        '✅ Request Dipublikasikan!',
        'Request Anda telah dipublikasikan. Agent pencocokan akan segera mencari relawan terbaik.',
        [{ text: 'OK', onPress: () => router.replace('/(school)/manage-requests' as any) }]
      );

      // Reset form
      setSubject(null);
      setLevel(null);
      setUrgency('medium');
      setDescription('');
      setSchedule('');
      setErrors({});
    } catch (err: any) {
      console.error('[CreateRequest]', err);
      Alert.alert('Gagal Mempublikasikan', err.message ?? 'Terjadi kesalahan. Coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  if (profileLoading) {
    return <LoadingScreen message="Memuat profil sekolah..." />;
  }

  const urgencyColors: Record<RequestUrgency, string> = {
    low: '#16a34a',
    medium: '#f59e0b',
    high: '#dc2626',
  };

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
          {/* Header */}
          <Text style={styles.title}>Buat Request Pengajar</Text>
          <Text style={styles.subtitle}>
            Isi informasi kebutuhan pengajar untuk sekolah{' '}
            <Text style={styles.schoolName}>
              {schoolProfile?.school_name ?? appUser?.name ?? ''}
            </Text>
          </Text>

          {/* No school profile warning */}
          {!schoolProfile && (
            <View style={styles.warningBanner}>
              <Ionicons name="alert-circle-outline" size={18} color="#ea580c" />
              <Text style={styles.warningText}>
                Profil sekolah belum lengkap. Request tetap bisa dibuat, namun disarankan melengkapi
                profil di halaman Profil.
              </Text>
            </View>
          )}

          {/* Mata Pelajaran */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Mata Pelajaran <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.chipGrid}>
              {SKILLS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.chip, subject === s ? styles.activeChip : styles.inactiveChip]}
                  onPress={() => { setSubject(s); setErrors((e) => ({ ...e, subject: '' })); }}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.chipText,
                      subject === s ? styles.activeChipText : styles.inactiveChipText,
                    ]}
                  >
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.subject ? <Text style={styles.errorText}>{errors.subject}</Text> : null}
          </View>

          {/* Tingkat Kelas */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Tingkat Kelas <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.row}>
              {SUBJECT_LEVELS.map((l) => (
                <TouchableOpacity
                  key={l}
                  style={[
                    styles.levelBtn,
                    level === l ? styles.activeLevelBtn : styles.inactiveLevelBtn,
                  ]}
                  onPress={() => { setLevel(l); setErrors((e) => ({ ...e, level: '' })); }}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.levelText,
                      level === l ? styles.activeLevelText : styles.inactiveLevelText,
                    ]}
                  >
                    {l}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.level ? <Text style={styles.errorText}>{errors.level}</Text> : null}
          </View>

          {/* Urgensi */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Urgensi</Text>
            <View style={styles.row}>
              {URGENCY_LEVELS.map((u) => {
                const active = urgency === u;
                const color = urgencyColors[u];
                return (
                  <TouchableOpacity
                    key={u}
                    style={[
                      styles.urgencyBtn,
                      active
                        ? { backgroundColor: color, borderColor: color }
                        : { ...styles.inactiveUrgencyBtn, borderColor: color },
                    ]}
                    onPress={() => setUrgency(u)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.urgencyText,
                        active ? { color: '#fff' } : { color },
                      ]}
                    >
                      {URGENCY_LABELS[u]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Jadwal */}
          <Input
            label="Jadwal"
            placeholder="Contoh: Senin 09:00-11:00, Rabu 13:00-15:00"
            value={schedule}
            onChangeText={(v) => { setSchedule(v); setErrors((e) => ({ ...e, schedule: '' })); }}
            leftIcon="calendar-outline"
            error={errors.schedule}
          />

          {/* Deskripsi */}
          <Input
            label="Deskripsi Kebutuhan"
            placeholder="Jelaskan kebutuhan pengajar, topik/materi, jumlah siswa, kondisi sekolah, dll."
            value={description}
            onChangeText={(v) => { setDescription(v); setErrors((e) => ({ ...e, description: '' })); }}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            style={styles.textArea}
            error={errors.description}
          />

          {/* Preview */}
          {subject && level && (
            <View style={styles.previewCard}>
              <Text style={styles.previewTitle}>Preview Request</Text>
              <View style={styles.previewRow}>
                <Ionicons name="book-outline" size={15} color={COLORS.primary} />
                <Text style={styles.previewText}>{subject} · {level}</Text>
              </View>
              {schedule.trim() ? (
                <View style={styles.previewRow}>
                  <Ionicons name="calendar-outline" size={15} color={COLORS.primary} />
                  <Text style={styles.previewText}>{schedule}</Text>
                </View>
              ) : null}
              <View style={styles.previewRow}>
                <Ionicons name="flag-outline" size={15} color={urgencyColors[urgency]} />
                <Text style={[styles.previewText, { color: urgencyColors[urgency] }]}>
                  Urgensi {URGENCY_LABELS[urgency]}
                </Text>
              </View>
            </View>
          )}

          <Button
            title={saving ? 'Mempublikasikan...' : 'Publikasikan Request'}
            onPress={handleSubmit}
            isLoading={saving}
            fullWidth
            size="lg"
            style={styles.submitBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 48 },

  title: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 20, lineHeight: 20 },
  schoolName: { fontWeight: '600', color: COLORS.text },

  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    gap: 8,
  },
  warningText: { flex: 1, fontSize: 13, color: '#9a3412', lineHeight: 18 },

  fieldGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 10 },
  required: { color: COLORS.danger },

  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5 },
  activeChip: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  inactiveChip: { backgroundColor: COLORS.white, borderColor: COLORS.border },
  chipText: { fontSize: 13, fontWeight: '500' },
  activeChipText: { color: COLORS.white },
  inactiveChipText: { color: COLORS.textSecondary },

  row: { flexDirection: 'row', gap: 10 },

  levelBtn: {
    flex: 1, height: 46, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1.5,
  },
  activeLevelBtn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  inactiveLevelBtn: { backgroundColor: COLORS.white, borderColor: COLORS.border },
  levelText: { fontSize: 14, fontWeight: '700' },
  activeLevelText: { color: COLORS.white },
  inactiveLevelText: { color: COLORS.textSecondary },

  urgencyBtn: {
    flex: 1, height: 46, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1.5,
  },
  inactiveUrgencyBtn: { backgroundColor: COLORS.white },
  urgencyText: { fontSize: 13, fontWeight: '700' },

  textArea: { height: 110, paddingTop: 10 },

  errorText: { fontSize: 12, color: COLORS.danger, marginTop: 6 },

  previewCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: `${COLORS.primary}30`,
  },
  previewTitle: { fontSize: 12, fontWeight: '700', color: COLORS.primary, marginBottom: 4 },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  previewText: { fontSize: 13, color: COLORS.text, fontWeight: '500' },

  submitBtn: { marginTop: 4 },
});
