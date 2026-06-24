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
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role, phone, city },
      },
    });
    if (error) throw error;

    if (data.user) {
      // Insert into users table
      const { error: insertError } = await supabase.from('users').insert({
        id: data.user.id,
        name,
        email,
        role,
        phone: phone ?? null,
        city: city ?? null,
      });
      if (insertError) throw insertError;

      // If volunteer, create empty profile
      if (role === 'volunteer') {
        await supabase.from('volunteer_profiles').insert({
          user_id: data.user.id,
          skills: [],
          availability: [],
          latitude: 0,
          longitude: 0,
          experience: '',
        });
      }

      // If school, create empty school record
      if (role === 'school') {
        await supabase.from('schools').insert({
          user_id: data.user.id,
          school_name: name,
          address: city ?? '',
          latitude: 0,
          longitude: 0,
          contact_person: name,
        });
      }
    }

    return data;
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
