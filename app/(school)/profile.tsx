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
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { COLORS } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import { useUserContext } from '../../contexts/UserContext';
import { useLocation } from '../../hooks/useLocation';
import { matchingService } from '../../services/matchingService';
import { getInitials } from '../../utils';

export default function SchoolProfileScreen() {
  const { appUser, signOut } = useAuth();
  const { schoolProfile, refreshProfile } = useUserContext();
  const { latitude, longitude, refreshLocation, isLoading: locLoading } = useLocation();

  const [schoolName, setSchoolName] = useState(schoolProfile?.school_name ?? '');
  const [address, setAddress] = useState(schoolProfile?.address ?? '');
  const [contactPerson, setContactPerson] = useState(schoolProfile?.contact_person ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!schoolProfile) return;
    setSaving(true);
    try {
      const lat = latitude ?? schoolProfile.latitude;
      const lng = longitude ?? schoolProfile.longitude;

      await matchingService.updateSchool(schoolProfile.id, {
        school_name: schoolName.trim(),
        address: address.trim(),
        contact_person: contactPerson.trim(),
        latitude: lat ?? 0,
        longitude: lng ?? 0,
      });
      await refreshProfile();
      Alert.alert('Berhasil', 'Profil sekolah berhasil disimpan!');
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

  const initials = getInitials(schoolProfile?.school_name ?? appUser?.name ?? 'S');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Avatar */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Ionicons name="school" size={36} color={COLORS.primary} />
          </View>
          <Text style={styles.name}>{schoolProfile?.school_name ?? appUser?.name}</Text>
          <Text style={styles.email}>{appUser?.email}</Text>
          <View style={styles.roleBadge}>
            <Ionicons name="school" size={14} color="#16a34a" />
            <Text style={styles.roleText}>Sekolah</Text>
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Input
            label="Nama Sekolah"
            value={schoolName}
            onChangeText={setSchoolName}
            leftIcon="school-outline"
            placeholder="Nama lengkap sekolah"
          />
          <Input
            label="Alamat"
            value={address}
            onChangeText={setAddress}
            leftIcon="location-outline"
            placeholder="Alamat lengkap sekolah"
            multiline
            numberOfLines={2}
          />
          <Input
            label="Nama Kontak"
            value={contactPerson}
            onChangeText={setContactPerson}
            leftIcon="person-outline"
            placeholder="Nama kepala sekolah / admin"
          />

          {/* Location */}
          <View style={styles.locationSection}>
            <View style={styles.locationHeader}>
              <Text style={styles.locationLabel}>Lokasi GPS</Text>
              <TouchableOpacity
                style={styles.refreshBtn}
                onPress={refreshLocation}
                disabled={locLoading}
              >
                <Ionicons name="refresh-outline" size={16} color={COLORS.primary} />
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
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  name: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 4, textAlign: 'center' },
  email: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 8 },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
  },
  roleText: { fontSize: 13, color: '#16a34a', fontWeight: '500' },
  form: { paddingHorizontal: 20 },
  locationSection: { marginBottom: 16 },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationLabel: { fontSize: 14, fontWeight: '500', color: COLORS.text },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
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
  },
  locationText: { fontSize: 13, color: COLORS.textSecondary },
  saveBtn: { marginHorizontal: 20, marginBottom: 12 },
});
