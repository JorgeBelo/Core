import React, { createContext, useContext } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
export const colors = {
  bg: '#080909',
  panel: '#141617',
  field: '#1e2022',
  line: '#303335',
  text: '#f5f5f3',
  muted: '#b4b4b4',
  red: '#a20100',
  accent: '#ff7069',
  green: '#8bd8af',
  amber: '#f1c67a',
};
export const Busy = createContext(false);
export type IconName = React.ComponentProps<typeof Ionicons>['name'];
export function Icon({
  name,
  color = colors.text,
  size = 22,
}: {
  name: IconName;
  color?: string;
  size?: number;
}) {
  return <Ionicons name={name} color={color} size={size} />;
}
export function Txt({
  children,
  muted = false,
  style,
}: {
  children: React.ReactNode;
  muted?: boolean;
  style?: any;
}) {
  return <Text style={[styles.text, muted && { color: colors.muted }, style]}>{children}</Text>;
}
export function Button({
  title,
  onPress,
  icon,
  secondary = false,
  danger = false,
  disabled = false,
  iconOnly = false,
}: {
  title: string;
  onPress: () => void;
  icon?: IconName;
  secondary?: boolean;
  danger?: boolean;
  disabled?: boolean;
  iconOnly?: boolean;
}) {
  const busy = useContext(Busy);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondary,
        danger && { backgroundColor: colors.red },
        (disabled || busy) && { opacity: 0.45 },
        pressed && { opacity: 0.7 },
      ]}
    >
      {icon && <Icon name={icon} size={19} />}
      {!iconOnly && <Txt style={{ fontWeight: '700', textAlign: 'center' }}>{title}</Txt>}
    </Pressable>
  );
}
export function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[styles.card, style]}>{children}</View>;
}
export function Field({
  label,
  value,
  onChange,
  keyboard = 'default',
  placeholder = '',
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  keyboard?: 'default' | 'phone-pad' | 'number-pad' | 'decimal-pad';
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Txt style={{ fontSize: 13, fontWeight: '600' }}>{label}</Txt>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboard}
        placeholder={placeholder}
        placeholderTextColor="#81878b"
        multiline={multiline}
        style={[styles.input, multiline && { minHeight: 90, textAlignVertical: 'top' }]}
      />
    </View>
  );
}
export function Heading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={[styles.row, { marginBottom: 6 }]}>
      <View style={{ flex: 1, gap: 7 }}>
        <Txt style={{ fontSize: 28, fontWeight: '700', letterSpacing: -0.8 }}>{title}</Txt>
        {subtitle && (
          <Txt muted style={{ fontSize: 14, lineHeight: 21 }}>
            {subtitle}
          </Txt>
        )}
      </View>
      {action}
    </View>
  );
}
export function Badge({
  label,
  tone = 'muted',
}: {
  label: string;
  tone?: 'muted' | 'green' | 'accent' | 'amber';
}) {
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        paddingVertical: 5,
        paddingHorizontal: 9,
        backgroundColor: colors.field,
        borderRadius: 7,
      }}
    >
      <Txt style={{ color: colors[tone], fontSize: 11, fontWeight: '700' }}>{label}</Txt>
    </View>
  );
}
export function Empty({
  title,
  detail,
  children,
}: {
  title: string;
  detail: string;
  children?: React.ReactNode;
}) {
  return (
    <Card style={{ gap: 13, paddingVertical: 30 }}>
      <Icon name="file-tray-outline" color={colors.muted} size={30} />
      <Txt style={{ fontSize: 18, fontWeight: '700' }}>{title}</Txt>
      <Txt muted style={{ lineHeight: 22 }}>
        {detail}
      </Txt>
      {children}
    </Card>
  );
}
export const styles = StyleSheet.create({
  text: { color: colors.text, fontSize: 15 },
  card: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    gap: 14,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  button: {
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.red,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 9,
  },
  secondary: { backgroundColor: colors.field, borderWidth: 1, borderColor: colors.line },
  input: {
    color: colors.text,
    backgroundColor: colors.field,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    minHeight: 49,
    fontSize: 16,
  },
});
