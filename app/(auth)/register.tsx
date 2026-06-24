import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
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
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { COLORS } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import type { UserRole } from '../../types';

const ROLES: { id: UserRole; label: string; icon: keyof typeof Ionicons.glyphMap; description: string }[] = [
  {
    id: 'volunteer',
    label: 'Relawan Pengajar',
    icon: 'person',
    description: 'Saya ingin mengajar di sekolah marginal',
  },
  {
    id: 'school',
    label: 'Sekolah',
    icon: 'school',
    description: 'Sekolah kami membutuhkan relawan pengajar',
  },
];

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('');
  const [role, setRole] = useState<UserRole>('volunteer');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Nama wajib diisi';
    if (!email.trim()) e.email = 'Email wajib diisi';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Format email tidak valid';
    if (!password) e.password = 'Password wajib diisi';
    else if (password.length < 6) e.password = 'Password minimal 6 karakter';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      await signUp({ name: name.trim(), email: email.trim(), password, role, city: city.trim() });
      Alert.alert(
        'Pendaftaran Berhasil',
        'Silakan cek email Anda untuk konfirmasi, lalu masuk.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login' as any) }]
      );
    } catch (err: any) {
      Alert.alert('Pendaftaran Gagal', err.message ?? 'Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        {/* Header */}
        <Text style={styles.title}>Buat Akun</Text>
        <Text style={styles.subtitle}>Bergabung dengan komunitas pendidikan Indonesia</Text>

        {/* Role selector */}
        <Text style={styles.sectionLabel}>Saya adalah...</Text>
        <View style={styles.roleRow}>
          {ROLES.map((r) => (
            <TouchableOpacity
              key={r.id}
              style={[
                styles.roleCard,
                role === r.id ? styles.activeRoleCard : styles.inactiveRoleCard,
              ]}
              onPress={() => setRole(r.id)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={r.icon}
                size={28}
                color={role === r.id ? COLORS.primary : COLORS.textSecondary}
              />
              <Text
                style={[
                  styles.roleLabel,
                  role === r.id ? styles.activeRoleLabel : styles.inactiveRoleLabel,
                ]}
              >
                {r.label}
              </Text>
              <Text style={styles.roleDescription}>{r.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Input
            label={role === 'school' ? 'Nama Sekolah' : 'Nama Lengkap'}
            placeholder={role === 'school' ? 'SDN Contoh 01' : 'Masukkan nama lengkap'}
            value={name}
            onChangeText={setName}
            leftIcon="person-outline"
            error={errors.name}
          />
          <Input
            label="Email"
            placeholder="nama@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon="mail-outline"
            error={errors.email}
          />
          <Input
            label="Password"
            placeholder="Minimal 6 karakter"
            value={password}
            onChangeText={setPassword}
            isPassword
            leftIcon="lock-closed-outline"
            error={errors.password}
          />
          <Input
            label="Kota"
            placeholder="Jakarta, Bandung, Surabaya..."
            value={city}
            onChangeText={setCity}
            leftIcon="location-outline"
          />

          <Button
            title="Daftar Sekarang"
            onPress={handleRegister}
            isLoading={isLoading}
            fullWidth
            size="lg"
            style={styles.registerBtn}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Sudah punya akun? </Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/login' as any)}>
            <Text style={styles.footerLink}>Masuk</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 28,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 12,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  roleCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
  },
  activeRoleCard: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  inactiveRoleCard: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
  },
  roleLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  activeRoleLabel: { color: COLORS.primary },
  inactiveRoleLabel: { color: COLORS.text },
  roleDescription: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  form: {},
  registerBtn: { marginTop: 8 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  footerText: { fontSize: 14, color: COLORS.textSecondary },
  footerLink: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
});
