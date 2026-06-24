import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import {
    Dimensions,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';
import { COLORS } from '../../constants';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    icon: 'school' as const,
    iconColor: '#2563eb',
    iconBg: '#dbeafe',
    title: 'Education Volunteer Scout',
    subtitle: 'Platform pencocokan relawan pengajar dengan sekolah yang membutuhkan bantuan.',
  },
  {
    id: '2',
    icon: 'people' as const,
    iconColor: '#7c3aed',
    iconBg: '#ede9fe',
    title: 'Jadilah Relawan Pengajar',
    subtitle: 'Daftarkan skill dan ketersediaan waktu Anda. Kami akan mencocokkan dengan sekolah terdekat.',
  },
  {
    id: '3',
    icon: 'location' as const,
    iconColor: '#16a34a',
    iconBg: '#dcfce7',
    title: 'Berbasis Lokasi GPS',
    subtitle: 'Sistem kami menghitung jarak antara relawan dan sekolah untuk rekomendasi terbaik.',
  },
  {
    id: '4',
    icon: 'flash' as const,
    iconColor: '#ea580c',
    iconBg: '#ffedd5',
    title: 'Pencocokan Otomatis',
    subtitle: 'Agent AI kami mencocokkan skill, jarak, dan jadwal secara otomatis dan mengirim notifikasi.',
  },
];

export default function OnboardingScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatRef = useRef<FlatList>(null);
  const isDark = useColorScheme() === 'dark';

  const goNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      flatRef.current?.scrollToIndex({ index: activeIndex + 1 });
      setActiveIndex(activeIndex + 1);
    } else {
      router.replace('/(auth)/login' as any);
    }
  };

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <FlatList
        ref={flatRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setActiveIndex(index);
        }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={[styles.iconWrapper, { backgroundColor: item.iconBg }]}>
              <Ionicons name={item.icon} size={80} color={item.iconColor} />
            </View>
            <Text style={[styles.title, isDark && styles.titleDark]}>{item.title}</Text>
            <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>{item.subtitle}</Text>
          </View>
        )}
      />

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === activeIndex ? styles.activeDot : styles.inactiveDot]}
          />
        ))}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={goNext}
          activeOpacity={0.85}
        >
          <Text style={styles.nextText}>
            {activeIndex === SLIDES.length - 1 ? 'Mulai' : 'Lanjut'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
        </TouchableOpacity>

        {activeIndex < SLIDES.length - 1 && (
          <TouchableOpacity onPress={() => router.replace('/(auth)/login' as any)}>
            <Text style={styles.skipText}>Lewati</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 48,
  },
  containerDark: { backgroundColor: '#0f172a' },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
  },
  iconWrapper: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  titleDark: { color: '#f1f5f9' },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  subtitleDark: { color: '#94a3b8' },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 32,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    width: 24,
    backgroundColor: COLORS.primary,
  },
  inactiveDot: {
    width: 8,
    backgroundColor: COLORS.border,
  },
  actions: {
    alignItems: 'center',
    gap: 16,
    width: '100%',
    paddingHorizontal: 24,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    width: '100%',
  },
  nextText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  skipText: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
});
