import type { UserRole } from '../types';
import { supabase } from './supabase';

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  city?: string;
}

export const authService = {
  async signUp({ name, email, password, role, phone, city }: RegisterPayload) {
    // Step 1: Create auth user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role, phone, city },
      },
    });
    if (error) throw error;

    // data.user bisa ada meski belum confirm email
    const userId = data.user?.id ?? data.session?.user?.id;
    if (!userId) {
      // Pendaftaran berhasil tapi menunggu konfirmasi email
      return data;
    }

    // Step 2: Sign in dulu agar ada session aktif sebelum insert (bypass RLS)
    // Kalau email confirmation dimatikan, session langsung ada
    // Kalau tidak, insert dilakukan setelah user login
    const sessionUserId = data.session?.user?.id;

    if (sessionUserId) {
      await this._createUserProfile({ id: sessionUserId, name, email, role, phone, city });
    }
    // Jika tidak ada session (email confirmation on), profile dibuat di onAuthStateChange

    return data;
  },

  async _createUserProfile({
    id,
    name,
    email,
    role,
    phone,
    city,
  }: {
    id: string;
    name: string;
    email: string;
    role: string;
    phone?: string;
    city?: string;
  }) {
    // Insert into users table
    const { error: insertError } = await supabase.from('users').insert({
      id,
      name,
      email,
      role,
      phone: phone ?? null,
      city: city ?? null,
    });
    // Abaikan error jika sudah ada (duplicate)
    if (insertError && !insertError.message.includes('duplicate')) {
      console.warn('[authService] users insert error:', insertError.message);
    }

    // Create role-specific profile
    if (role === 'volunteer') {
      await supabase.from('volunteer_profiles').insert({
        user_id: id,
        skills: [],
        availability: [],
        latitude: 0,
        longitude: 0,
        experience: '',
      });
    }

    if (role === 'school') {
      await supabase.from('schools').insert({
        user_id: id,
        school_name: name,
        address: city ?? '',
        latitude: 0,
        longitude: 0,
        contact_person: name,
      });
    }
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getSession() {
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  async getCurrentUser() {
    const { data } = await supabase.auth.getUser();
    return data.user;
  },

  onAuthStateChange(callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]) {
    return supabase.auth.onAuthStateChange(callback);
  },
};
