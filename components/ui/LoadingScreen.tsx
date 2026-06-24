import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../constants';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = 'Memuat...' }: LoadingScreenProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    gap: 12,
  },
  text: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
});
