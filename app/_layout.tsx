import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MD3LightTheme, PaperProvider } from 'react-native-paper';
import { COLORS } from '../constants';
import { AuthProvider } from '../contexts/AuthContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { UserProvider } from '../contexts/UserContext';
import '../global.css';

SplashScreen.preventAutoHideAsync();

const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: COLORS.primary,
    secondary: COLORS.secondary,
  },
};

export default function RootLayout() {
  const [loaded] = useFonts({});

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <UserProvider>
          <NotificationProvider>
            <PaperProvider theme={paperTheme}>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(home)" />
                <Stack.Screen name="(volunteer)" />
                <Stack.Screen name="(school)" />
                <Stack.Screen name="(admin)" />
              </Stack>
              <StatusBar style="auto" />
            </PaperProvider>
          </NotificationProvider>
        </UserProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
