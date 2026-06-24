import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react';
import { authService, type RegisterPayload } from '../services/authService';
import { matchingService } from '../services/matchingService';
import type { User } from '../types';

interface AuthContextValue {
  session: Session | null;
  supabaseUser: SupabaseUser | null;
  appUser: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (payload: RegisterPayload) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [appUser, setAppUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadAppUser = useCallback(async (userId: string) => {
    const user = await matchingService.getUserById(userId);
    setAppUser(user);
  }, []);

  useEffect(() => {
    // Get initial session
    authService.getSession().then((sess) => {
      setSession(sess);
      setSupabaseUser(sess?.user ?? null);
      if (sess?.user) {
        loadAppUser(sess.user.id).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange(
      async (event, sess) => {
        setSession(sess);
        setSupabaseUser(sess?.user ?? null);
        if (sess?.user) {
          // Saat SIGNED_IN: pastikan profile sudah ada di tabel users
          // (menangani kasus email confirmation atau first login)
          if (event === 'SIGNED_IN') {
            const existing = await matchingService.getUserById(sess.user.id);
            if (!existing) {
              // Profile belum dibuat (kasus email confirmation), buat sekarang
              const meta = sess.user.user_metadata ?? {};
              await authService._createUserProfile({
                id: sess.user.id,
                name: meta.name ?? sess.user.email ?? 'User',
                email: sess.user.email ?? '',
                role: meta.role ?? 'volunteer',
                phone: meta.phone,
                city: meta.city,
              });
            }
          }
          await loadAppUser(sess.user.id);
        } else {
          setAppUser(null);
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [loadAppUser]);

  const signIn = async (email: string, password: string) => {
    const data = await authService.signIn(email, password);
    if (data.user) await loadAppUser(data.user.id);
  };

  const signUp = async (payload: RegisterPayload) => {
    await authService.signUp(payload);
  };

  const signOut = async () => {
    await authService.signOut();
    setAppUser(null);
    setSession(null);
    setSupabaseUser(null);
  };

  const refreshUser = async () => {
    if (supabaseUser) await loadAppUser(supabaseUser.id);
  };

  return (
    <AuthContext.Provider
      value={{ session, supabaseUser, appUser, isLoading, signIn, signUp, signOut, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
