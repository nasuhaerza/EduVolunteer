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
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { COLORS } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import { useUserContext } from '../../contexts/UserContext';
import { useLocation } from '../../hooks/useLocation';
import { matchingService } from '../../services/matchingService';
import { supabase } from '../../services/supabase';

export default function SchoolProfileScreen() {
  const { appUser, signOut, refreshUser } = useAuth();
  const { schoolProfile, refreshProfile, isLoading: profileLoading } = useUserContext();
  const { latitude, longitude, refreshLocation, isLoading: locLoading } = useLocation();

  const [schoolName, setSchoolName] = useState('');
  const [address, setAddress] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sync form when profile loads
  useEffect(() => {
    if (schoolProfile) {
      setSchoolName(schoolProfile.school_name ?? '');
      setAddress(schoolProfile.address ?? '');
      setContactPerson(schoolProfile.contact_person ?? '');
    }
  }, [schoolProfile]);

  useEffect(() => {
    if (appUser) {
      setPhone(appUser.phone ?? '');
      setCity(appUser.city ?? '');
    }
  }, [appUser]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!schoolName.trim()) e.schoolName = 'Nama sekolah wajib diisi';
    if (!contactPerson.trim()) e.contactPerson = 'Nama kontak wajib diisi';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!appUser) return;
    if (!validate()) return;

    setSaving(true);
    try {
      const lat = latitude ?? schoolProfile?.latitude ?? 0;
      const lng = longitude ?? schoolProfile?.longitude ?? 0;

      if (schoolProfile?.id) {
        // Update existing school profile
        await matchingService.updateSchool(schoolProfile.id, {
          school_name: schoolName.trim(),
          address: address.trim(),
          contact_person: contactPerson.trim(),
          latitude: lat,
          longitude: lng,
        });
      } else {
        // Create new school profile
        const { error } = await supabase.from('schools').insert({
          user_id: appUser.id,
          school_name: schoolName.trim(),
          address: address.trim(),
          latitude: lat,
          longitude: lng,
          contact_person: contactPerson.trim(),
        });
        if (error) throw error;
      }

      // Update user info
      await matchingService.updateUser(appUser.id, {
        name: schoolName.trim(),
        phone: phone.trim() || undefined,
        city: city.trim() || undefined,
      });

      await Promise.all([refreshProfile(), refreshUser()]);
      setHasChanges(false);
      Alert.alert('✅ Berhasil', 'Profil sekolah berhasil disimpan!');
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

  const locationText = latitude
    ? `${latitude.toFixed(5)}, ${longitude?.toFixed(5)}`
    : schoolProfile?.latitude && schoolProfile.latitude !== 0
    ? `${schoolProfile.latitude.toFixed(5)}, ${schoolProfile.longitude?.toFixed(5)}`
    : null;

  const isProfileComplete =
    schoolName.trim().length > 0 &&
    address.trim().length > 0 &&
    contactPerson.trim().length > 0 &&
    locationText !== null;

  const change = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setHasChanges(true);
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
          {/* ── Header ── */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarWrapper}>
              <View style={styles.avatar}>
                <Ionicons name="school" size={38} color="#16a34a" />
              </View>
              {isProfileComplete && (
                <View style={styles.completeBadge}>
                  <Ionicons name="checkmark" size={12} color="#fff" />
                </View>
              )}
            </View>
            <Text style={styles.schoolNameDisplay} numberOfLines={2}>
              {schoolName || appUser?.name || 'Nama Sekolah'}
            </Text>
            <Text style={styles.email}>{appUser?.email}</Text>
            <View style={styles.roleBadge}>
              <Ionicons name="school" size={13} color="#16a34a" />
              <Text style={styles.roleText}>Sekolah</Text>
            </View>
          </View>

          {/* ── Profile incomplete warning ── */}
          {!isProfileComplete && (
            <View style={styles.warningBanner}>
              <Ionicons name="alert-circle-outline" size={18} color="#ea580c" />
              <Text style={styles.warningText}>
                Lengkapi profil sekolah agar relawan dapat menemukan dan mempercayai sekolah Anda.
              </Text>
            </View>
          )}

          {/* ── Stats row ── */}
          {schoolProfile && (
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="location" size={18} color={locationText ? '#16a34a' : COLORS.textMuted} />
                <Text style={styles.statLabel}>{locationText ? 'GPS Aktif' : 'Belum GPS'}</Text>
              </View>
              <View style={styles.statSep} />
              <View style={styles.statItem}>
                <Ionicons name="checkmark-circle" size={18} color={isProfileComplete ? '#16a34a' : COLORS.textMuted} />
                <Text style={styles.statLabel}>{isProfileComplete ? 'Profil Lengkap' : 'Belum Lengkap'}</Text>
              </View>
              <View style={styles.statSep} />
              <View style={styles.statItem}>
                <Ionicons name="mail" size={18} color={COLORS.primary} />
                <Text style={styles.statLabel} numberOfLines={1}>{city || 'Kota -'}</Text>
              </View>
            </View>
          )}

          {/* ── Identitas Sekolah ── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🏫 Identitas Sekolah</Text>
            <Input
              label="Nama Sekolah"
              placeholder="Contoh: SDN Harapan 01"
              value={schoolName}
              onChangeText={change(setSchoolName)}
              leftIcon="school-outline"
              error={errors.schoolName}
            />
            <Input
              label="Alamat Lengkap"
              placeholder="Jalan, RT/RW, Kelurahan, Kecamatan, Kota"
              value={address}
              onChangeText={change(setAddress)}
              leftIcon="map-outline"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              style={styles.addressInput}
            />
            <Input
              label="Nama Kontak (Kepala Sekolah / Admin)"
              placeholder="Nama lengkap penanggung jawab"
              value={contactPerson}
              onChangeText={change(setContactPerson)}
              leftIcon="person-outline"
              error={errors.contactPerson}
            />
          </View>

          {/* ── Kontak & Wilayah ── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📞 Kontak & Wilayah</Text>
            <Input
              label="Nomor Telepon"
              placeholder="021xxxxxxx atau 08xxxxxxxxxx"
              value={phone}
              onChangeText={change(setPhone)}
              keyboardType="phone-pad"
              leftIcon="call-outline"
            />
            <Input
              label="Kota / Kabupaten"
              placeholder="Jakarta Timur, Bandung, ..."
              value={city}
              onChangeText={change(setCity)}
              leftIcon="location-outline"
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
                size={20}
                color={locationText ? '#16a34a' : COLORS.textMuted}
              />
              <View style={styles.locationInfo}>
                <Text style={[styles.locationText, !locationText && styles.locationEmpty]}>
                  {locationText ?? 'Lokasi belum terdeteksi'}
                </Text>
                {locationText && (
                  <Text style={styles.locationHint}>
                    Digunakan agar relawan dapat menghitung jarak ke sekolah
                  </Text>
                )}
                {!locationText && (
                  <Text style={styles.locationHint}>
                    Tap "Perbarui" untuk mendeteksi lokasi sekolah secara otomatis
                  </Text>
                )}
              </View>
            </View>
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

  profileHeader: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  avatarWrapper: { position: 'relative', marginBottom: 12 },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#16a34a',
  },
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
  schoolNameDisplay: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  email: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 8 },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
  },
  roleText: { fontSize: 13, color: '#16a34a', fontWeight: '600' },

  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 14,
    gap: 8,
  },
  warningText: { flex: 1, fontSize: 13, color: '#9a3412', lineHeight: 18 },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statSep: { width: 1, backgroundColor: COLORS.border },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, textAlign: 'center' },

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
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 14 },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },

  addressInput: { height: 72, paddingTop: 8 },

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
    backgroundColor: '#f0fdf4',
    borderColor: '#16a34a',
  },
  locationInfo: { flex: 1 },
  locationText: { fontSize: 13, color: COLORS.text, fontWeight: '500' },
  locationEmpty: { color: COLORS.textMuted, fontStyle: 'italic' },
  locationHint: { fontSize: 11, color: COLORS.textSecondary, marginTop: 3, lineHeight: 16 },

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

  actions: { paddingHorizontal: 16, marginTop: 8 },
  signOutBtn: { marginTop: 10 },
});
