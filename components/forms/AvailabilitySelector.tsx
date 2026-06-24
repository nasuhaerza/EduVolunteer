import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AVAILABILITY_DAYS, COLORS } from '../../constants';
import type { AvailabilityDay } from '../../types';

interface AvailabilitySelectorProps {
  selected: AvailabilityDay[];
  onChange: (days: AvailabilityDay[]) => void;
  label?: string;
}

const DAY_SHORT: Record<AvailabilityDay, string> = {
  Senin: 'Sen',
  Selasa: 'Sel',
  Rabu: 'Rab',
  Kamis: 'Kam',
  Jumat: 'Jum',
  Sabtu: 'Sab',
  Minggu: 'Min',
};

export function AvailabilitySelector({
  selected,
  onChange,
  label = 'Hari Tersedia',
}: AvailabilitySelectorProps) {
  const toggle = (day: AvailabilityDay) => {
    if (selected.includes(day)) {
      onChange(selected.filter((d) => d !== day));
    } else {
      onChange([...selected, day]);
    }
  };

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.row}>
        {AVAILABILITY_DAYS.map((day) => {
          const active = selected.includes(day);
          return (
            <TouchableOpacity
              key={day}
              style={[styles.day, active ? styles.activeDay : styles.inactiveDay]}
              onPress={() => toggle(day)}
              activeOpacity={0.7}
            >
              <Text style={[styles.dayText, active ? styles.activeDayText : styles.inactiveDayText]}>
                {DAY_SHORT[day]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  day: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  activeDay: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  inactiveDay: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeDayText: { color: COLORS.white },
  inactiveDayText: { color: COLORS.textSecondary },
});
