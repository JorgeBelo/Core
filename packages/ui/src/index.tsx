import React from 'react';
import {
  Text,
  View,
  Pressable,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
export const colors = {
  background: '#111114',
  surface: '#202024',
  elevated: '#27272C',
  border: '#34343B',
  red: '#A20100',
  redHover: '#C02020',
  text: '#FFFFFF',
  secondary: '#A3A3AD',
  green: '#91C9AC',
  paleRed: '#E9A1A0',
};
export function Label({
  children,
  muted = false,
  style,
}: {
  children: React.ReactNode;
  muted?: boolean;
  style?: any;
}) {
  return (
    <Text
      style={[
        { color: muted ? colors.secondary : colors.text, fontSize: 14, lineHeight: 22 },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
export function Heading({ children, level = 1 }: { children: React.ReactNode; level?: 1 | 2 | 3 }) {
  return (
    <Text
      accessibilityRole="header"
      style={{
        color: colors.text,
        fontSize: level === 1 ? 30 : level === 2 ? 20 : 16,
        fontWeight: '700',
        letterSpacing: -0.5,
        lineHeight: level === 1 ? 38 : 28,
      }}
    >
      {children}
    </Text>
  );
}
export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}
export function Button({
  children,
  onPress,
  secondary = false,
  disabled = false,
  loading = false,
  accessibilityLabel,
}: {
  children: React.ReactNode;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed, hovered }: any) => [
        styles.button,
        {
          backgroundColor: secondary ? colors.elevated : hovered ? colors.redHover : colors.red,
          opacity: disabled ? 0.45 : pressed ? 0.8 : 1,
          borderWidth: secondary ? 1 : 0,
          borderColor: colors.border,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color="white" />
      ) : (
        <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>{children}</Text>
      )}
    </Pressable>
  );
}
export function Field({
  label,
  error,
  ...props
}: TextInputProps & { label: string; error?: string }) {
  return (
    <View style={{ gap: 7, flexGrow: 1 }}>
      <Label style={{ fontSize: 13, fontWeight: '500' }}>{label}</Label>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#777781"
        {...props}
        style={[
          styles.input,
          props.multiline ? { minHeight: 90, textAlignVertical: 'top' } : {},
          props.style,
          error ? { borderColor: colors.paleRed } : {},
        ]}
      />
      {error && <Label style={{ color: colors.paleRed, fontSize: 12 }}>{error}</Label>}
    </View>
  );
}
export function Choice<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Label style={{ fontSize: 13 }}>{label}</Label>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {options.map((o) => (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: value === o.value }}
            onPress={() => onChange(o.value)}
            style={{
              paddingVertical: 11,
              paddingHorizontal: 14,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: value === o.value ? '#B94B49' : colors.border,
              backgroundColor: value === o.value ? '#3B2023' : colors.background,
            }}
          >
            <Label style={{ fontSize: 13 }}>{o.label}</Label>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
export function Notice({
  children,
  error = false,
}: {
  children: React.ReactNode;
  error?: boolean;
}) {
  return (
    <View
      accessibilityRole="alert"
      style={{
        padding: 16,
        backgroundColor: error ? '#3B2023' : '#242930',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: error ? '#7E3436' : colors.border,
      }}
    >
      <Label style={{ color: error ? '#F3B7B6' : '#CBD0DB' }}>{children}</Label>
    </View>
  );
}
export function Loading() {
  return (
    <View style={{ padding: 40, alignItems: 'center', gap: 16 }}>
      <ActivityIndicator color="#E0A09E" />
      <Label muted>Carregando seus dados…</Label>
    </View>
  );
}
export const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 22,
    gap: 16,
  },
  button: {
    minHeight: 46,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: 'white',
    fontSize: 15,
  },
});
