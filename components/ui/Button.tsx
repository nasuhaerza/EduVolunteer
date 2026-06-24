import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    ViewStyle,
} from 'react-native';
import { COLORS } from '../../constants';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const containerStyle = [
    styles.base,
    styles[variant],
    styles[`size_${size}`],
    fullWidth && styles.fullWidth,
    (disabled || isLoading) && styles.disabled,
    style,
  ];

  const labelStyle = [styles.label, styles[`label_${variant}`], styles[`labelSize_${size}`], textStyle];

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator
          color={variant === 'outline' ? COLORS.primary : COLORS.white}
          size="small"
        />
      ) : (
        <Text style={labelStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.5 },

  // Variants
  primary: { backgroundColor: COLORS.primary },
  secondary: { backgroundColor: COLORS.secondary },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  danger: { backgroundColor: COLORS.danger },
  ghost: { backgroundColor: 'transparent' },

  // Sizes
  size_sm: { paddingHorizontal: 12, paddingVertical: 7 },
  size_md: { paddingHorizontal: 20, paddingVertical: 12 },
  size_lg: { paddingHorizontal: 28, paddingVertical: 16 },

  // Labels
  label: { fontWeight: '600' },
  label_primary: { color: COLORS.white },
  label_secondary: { color: COLORS.white },
  label_outline: { color: COLORS.primary },
  label_danger: { color: COLORS.white },
  label_ghost: { color: COLORS.primary },

  labelSize_sm: { fontSize: 13 },
  labelSize_md: { fontSize: 15 },
  labelSize_lg: { fontSize: 17 },
});
