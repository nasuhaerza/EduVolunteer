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
import { COLORS, SKILLS, SUBJECT_LEVELS, URGENCY_LABELS, URGENCY_LEVELS } from '../../constants';
import { useUserContext } from '../../contexts/UserContext';
import { matchingService } from '../../services/matchingService';
import type { RequestUrgency, Skill, SubjectLevel } from '../../types';

export default function CreateRequestScreen() {
  const { schoolProfile } = useUserContext();

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

  const handleSubmit = async () => {
    if (!validate() || !schoolProfile) return;
    setSaving(true);
    try {
      await matchingService.createRequest({
        school_id: schoolProfile.id,
        subject_needed: subject!,
        level: level!,
        urgency,
        description: description.trim(),
        schedule: schedule.trim(),
        status: 'open',
      });
      Alert.alert(
        'Request Dibuat!',
        'Request Anda telah dipublikasikan. Agent pencocokan akan mencari relawan terbaik.',
        [{ text: 'OK', onPress: () => router.push('/(school)/manage-requests' as any) }]
      );
      // Reset
      setSubject(null);
      setLevel(null);
      setDescription('');
      setSchedule('');
    } catch (err: any) {
      Alert.alert('Gagal', err.message ?? 'Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
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
          <Text style={styles.title}>Buat Request Pengajar</Text>
          <Text style={styles.subtitle}>
            Isi informasi kebutuhan pengajar sekolah Anda
          </Text>

          {/* Subject */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Mata Pelajaran *</Text>
            <View style={styles.chipGrid}>
              {SKILLS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.chip,
                    subject === s ? styles.activeChip : styles.inactiveChip,
                  ]}
                  onPress={() => setSubject(s)}
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
            {errors.subject && <Text style={styles.errorText}>{errors.subject}</Text>}
          </View>

          {/* Level */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Tingkat Kelas *</Text>
            <View style={styles.row}>
              {SUBJECT_LEVELS.map((l) => (
                <TouchableOpacity
                  key={l}
                  style={[
                    styles.levelBtn,
                    level === l ? styles.activeLevelBtn : styles.inactiveLevelBtn,
                  ]}
                  onPress={() => setLevel(l)}
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
            {errors.level && <Text style={styles.errorText}>{errors.level}</Text>}
          </View>

          {/* Urgency */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Urgensi</Text>
            <View style={styles.row}>
              {URGENCY_LEVELS.map((u) => {
                const colors: Record<RequestUrgency, string> = {
                  low: '#16a34a',
                  medium: '#f59e0b',
                  high: '#dc2626',
                };
                const active = urgency === u;
                return (
                  <TouchableOpacity
                    key={u}
                    style={[
                      styles.urgencyBtn,
                      active
                        ? { backgroundColor: colors[u], borderColor: colors[u] }
                        : styles.inactiveUrgencyBtn,
                    ]}
                    onPress={() => setUrgency(u)}
                  >
                    <Text
                      style={[
                        styles.urgencyText,
                        active ? styles.activeUrgencyText : { color: colors[u] },
                      ]}
                    >
                      {URGENCY_LABELS[u]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Schedule */}
          <Input
            label="Jadwal *"
            placeholder="Contoh: Senin 09:00-11:00"
            value={schedule}
            onChangeText={setSchedule}
            leftIcon="calendar-outline"
            error={errors.schedule}
          />

          {/* Description */}
          <Input
            label="Deskripsi Kebutuhan *"
            placeholder="Jelaskan kebutuhan pengajar, materi yang dibutuhkan, kondisi sekolah, dll."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={{ height: 100 }}
            error={errors.description}
          />

          <Button
            title="Publikasikan Request"
            onPress={handleSubmit}
            isLoading={saving}
            fullWidth
            size="lg"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingHorizontal: 20, paddingVertical: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 24 },
  fieldGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '500', color: COLORS.text, marginBottom: 10 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  activeChip: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  inactiveChip: { backgroundColor: COLORS.white, borderColor: COLORS.border },
  chipText: { fontSize: 13, fontWeight: '500' },
  activeChipText: { color: COLORS.white },
  inactiveChipText: { color: COLORS.textSecondary },
  row: { flexDirection: 'row', gap: 10 },
  levelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  activeLevelBtn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  inactiveLevelBtn: { backgroundColor: COLORS.white, borderColor: COLORS.border },
  levelText: { fontSize: 14, fontWeight: '600' },
  activeLevelText: { color: COLORS.white },
  inactiveLevelText: { color: COLORS.textSecondary },
  urgencyBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  inactiveUrgencyBtn: { backgroundColor: COLORS.white, borderColor: COLORS.border },
  urgencyText: { fontSize: 13, fontWeight: '600' },
  activeUrgencyText: { color: COLORS.white },
  errorText: { fontSize: 12, color: COLORS.danger, marginTop: 6 },
});
