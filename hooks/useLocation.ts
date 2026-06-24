import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  errorMsg: string | null;
  isLoading: boolean;
}

export function useLocation() {
  const [state, setState] = useState<LocationState>({
    latitude: null,
    longitude: null,
    errorMsg: null,
    isLoading: true,
  });

  useEffect(() => {
    let isMounted = true;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (isMounted) {
          setState((s) => ({
            ...s,
            errorMsg: 'Izin lokasi ditolak',
            isLoading: false,
          }));
        }
        return;
      }

      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (isMounted) {
          setState({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            errorMsg: null,
            isLoading: false,
          });
        }
      } catch {
        if (isMounted) {
          setState((s) => ({
            ...s,
            errorMsg: 'Gagal mendapatkan lokasi',
            isLoading: false,
          }));
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const refreshLocation = async () => {
    setState((s) => ({ ...s, isLoading: true }));
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setState({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        errorMsg: null,
        isLoading: false,
      });
    } catch {
      setState((s) => ({
        ...s,
        errorMsg: 'Gagal mendapatkan lokasi',
        isLoading: false,
      }));
    }
  };

  return { ...state, refreshLocation };
}
