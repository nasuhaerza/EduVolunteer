import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    type TextInputProps,
} from 'react-native';
import { COLORS } from '../../constants';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  isPassword?: boolean;
}

export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  isPassword = false,
  style,
  ...props
}: InputProps) {
  const [secure, setSecure] = useState(isPassword);

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.container, error ? styles.errorBorder : styles.normalBorder]}>
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={18}
            color={COLORS.textSecondary}
            style={styles.leftIcon}
          />
        )}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={COLORS.textMuted}
          secureTextEntry={secure}
          {...props}
        />
        {isPassword ? (
          <TouchableOpacity onPress={() => setSecure(!secure)} style={styles.rightIcon}>
            <Ionicons
              name={secure ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>
        ) : rightIcon ? (
          <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
            <Ionicons name={rightIcon} size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 6,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
  },
  normalBorder: { borderColor: COLORS.border },
  errorBorder: { borderColor: COLORS.danger },
  input: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: COLORS.text,
  },
  leftIcon: { marginRight: 8 },
  rightIcon: { marginLeft: 8, padding: 4 },
  errorText: {
    fontSize: 12,
    color: COLORS.danger,
    marginTop: 4,
  },
});
