import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Circle, Marker, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants';
import { useLocation } from '../../hooks/useLocation';
import { matchingService } from '../../services/matchingService';
import type { School, VolunteerRequest } from '../../types';

export default function MapScreen() {
  const { latitude, longitude, isLoading: locLoading } = useLocation();
  const [schools, setSchools] = useState<School[]>([]);
  const [requests, setRequests] = useState<VolunteerRequest[]>([]);

  useEffect(() => {
    Promise.all([
      matchingService.getAllSchools(),
      matchingService.getOpenRequests(),
    ]).then(([s, r]) => {
      setSchools(s.filter((sc) => sc.latitude !== 0));
      setRequests(r);
    });
  }, []);

  if (locLoading) {
    return (
      <SafeAreaView style={styles.centered} edges={['top']}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Mendeteksi lokasi...</Text>
      </SafeAreaView>
    );
  }

  const lat = latitude ?? -6.2088;
  const lng = longitude ?? 106.8456;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Peta</Text>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: '#16a34a' }]} />
            <Text style={styles.legendText}>Sekolah</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: COLORS.primary }]} />
            <Text style={styles.legendText}>Anda</Text>
          </View>
        </View>
      </View>

      <MapView
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
        initialRegion={{
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.15,
          longitudeDelta: 0.15,
        }}
        showsUserLocation
        showsMyLocationButton
        showsCompass
      >
        {/* 50km radius circle */}
        {latitude && longitude && (
          <Circle
            center={{ latitude: lat, longitude: lng }}
            radius={50000}
            strokeColor={`${COLORS.primary}40`}
            fillColor={`${COLORS.primary}08`}
            strokeWidth={1.5}
          />
        )}

        {/* School markers */}
        {schools.map((school) => (
          <Marker
            key={school.id}
            coordinate={{ latitude: school.latitude, longitude: school.longitude }}
            title={school.school_name}
            description={school.address}
            pinColor="#16a34a"
          />
        ))}
      </MapView>

      {/* Stats overlay */}
      <View style={styles.overlay}>
        <View style={styles.overlayCard}>
          <Text style={styles.overlayValue}>{schools.length}</Text>
          <Text style={styles.overlayLabel}>Sekolah</Text>
        </View>
        <View style={styles.overlaySep} />
        <View style={styles.overlayCard}>
          <Text style={styles.overlayValue}>{requests.length}</Text>
          <Text style={styles.overlayLabel}>Request Aktif</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.background,
  },
  loadingText: { fontSize: 14, color: COLORS.textSecondary },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  legend: { flexDirection: 'row', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: COLORS.textSecondary },
  map: { flex: 1 },
  overlay: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  overlayCard: { flex: 1, alignItems: 'center' },
  overlaySep: { width: 1, height: 32, backgroundColor: COLORS.border },
  overlayValue: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  overlayLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
});
