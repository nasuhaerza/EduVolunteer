import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase project URL and anon key
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://gkhjxmnbupnwpovtawiq.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdraGp4bW5idXBud3BvdnRhd2lxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNzA1MDIsImV4cCI6MjA5Nzg0NjUwMn0.BKM73gNIcZBgUXbaPyHe4WV1cRfZnZau-vrp0hRhex4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
