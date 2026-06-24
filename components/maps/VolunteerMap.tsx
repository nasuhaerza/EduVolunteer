import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';
import { COLORS } from '../../constants';
import type { MapMarker } from '../../types';

interface VolunteerMapProps {
  markers?: MapMarker[];
  initialLatitude?: number;
  initialLongitude?: number;
  height?: number;
}

const MARKER_ICONS: Record<MapMarker['type'], { color: string; name: keyof typeof Ionicons.glyphMap }> = {
  user: { color: COLORS.primary, name: 'person-circle' },
  school: { color: '#16a34a', name: 'school' },
  volunteer: { color: '#7c3aed', name: 'person' },
};

export function VolunteerMap({
  markers = [],
  initialLatitude = -6.2088,
  initialLongitude = 106.8456,
  height = 250,
}: VolunteerMapProps) {
  return (
    <View style={[styles.container, { height }]}>
      <MapView
        style={StyleSheet.absoluteFill}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
        initialRegion={{
          latitude: initialLatitude,
          longitude: initialLongitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation
        showsMyLocationButton
        showsCompass
      >
        {markers.map((marker) => {
          const icon = MARKER_ICONS[marker.type];
          return (
            <Marker
              key={marker.id}
              coordinate={{
                latitude: marker.latitude,
                longitude: marker.longitude,
              }}
              title={marker.title}
              description={marker.description}
              pinColor={icon.color}
            />
          );
        })}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#e5e7eb',
  },
});
