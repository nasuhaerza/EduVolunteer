import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, SKILLS } from '../../constants';
import type { Skill } from '../../types';

interface SkillSelectorProps {
  selected: Skill[];
  onChange: (skills: Skill[]) => void;
  label?: string;
}

export function SkillSelector({ selected, onChange, label = 'Pilih Skill' }: SkillSelectorProps) {
  const toggle = (skill: Skill) => {
    if (selected.includes(skill)) {
      onChange(selected.filter((s) => s !== skill));
    } else {
      onChange([...selected, skill]);
    }
  };

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.grid}>
        {SKILLS.map((skill) => {
          const active = selected.includes(skill);
          return (
            <TouchableOpacity
              key={skill}
              style={[styles.chip, active ? styles.activeChip : styles.inactiveChip]}
              onPress={() => toggle(skill)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, active ? styles.activeText : styles.inactiveText]}>
                {skill}
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  activeChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  inactiveChip: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  activeText: { color: COLORS.white },
  inactiveText: { color: COLORS.textSecondary },
});
