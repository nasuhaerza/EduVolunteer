import { Redirect } from 'expo-router';
import React from 'react';
import { LoadingScreen } from '../components/ui/LoadingScreen';
import { useAuth } from '../contexts/AuthContext';

export default function Index() {
  const { session, appUser, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen message="Education Volunteer Scout" />;
  }

  if (!session) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return <Redirect href={'/(auth)/onboarding' as any} />;
  }

  if (!appUser) {
    return <LoadingScreen message="Memuat profil..." />;
  }

  // Route based on role
  if (appUser.role === 'volunteer') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return <Redirect href={'/(volunteer)/home' as any} />;
  }
  if (appUser.role === 'school') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return <Redirect href={'/(school)/dashboard' as any} />;
  }
  if (appUser.role === 'admin') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return <Redirect href={'/(admin)/dashboard' as any} />;
  }

  return <LoadingScreen />;
}
