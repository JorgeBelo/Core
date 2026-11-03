import React from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Label, colors } from '@core/ui';
type Icon = React.ComponentProps<typeof Ionicons>['name'];
export function IconButton({
  icon,
  label,
  onPress,
  disabled = false,
}: {
  icon: Icon;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      accessibilityState={{ disabled }}
      onPress={onPress}
      style={({ pressed }) => ({
        minWidth: 44,
        minHeight: 44,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.3 : pressed ? 0.6 : 1,
        backgroundColor: colors.elevated,
      })}
    >
      <Ionicons name={icon} size={19} color={colors.secondary} />
    </Pressable>
  );
}
export function ActionTile({
  icon,
  title,
  description,
  onPress,
  primary = false,
  compact = false,
  horizontal = false,
  style,
}: {
  icon: Icon;
  title: string;
  description?: string;
  onPress: () => void;
  primary?: boolean;
  compact?: boolean;
  horizontal?: boolean;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed, hovered }: any) => [
        {
          borderRadius: 18,
          borderWidth: 1,
          borderColor: primary ? '#76302F' : colors.border,
          backgroundColor: primary ? '#2D1B1F' : hovered ? '#28282F' : '#1B1B20',
          padding: compact ? 16 : 20,
          gap: compact ? 12 : 16,
          minHeight: horizontal ? 76 : compact ? 105 : 130,
          flexDirection: horizontal ? 'row' : 'column',
          alignItems: horizontal ? 'center' : undefined,
          opacity: pressed ? 0.8 : 1,
        },
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 13,
            backgroundColor: primary ? '#A20100' : '#2C2C34',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Ionicons name={icon} size={22} color={primary ? 'white' : '#DDDDE3'} />
        </View>
        {!horizontal && (
          <Ionicons name="arrow-forward" size={18} color={primary ? '#EAA4A0' : '#81818F'} />
        )}
      </View>
      <View style={{ gap: 3, flex: horizontal ? 1 : undefined }}>
        <Label style={{ fontWeight: '600', fontSize: 16 }}>{title}</Label>
        {description && !compact && (
          <Label muted style={{ fontSize: 12, lineHeight: 18 }}>
            {description}
          </Label>
        )}
      </View>
      {horizontal && (
        <Ionicons name="arrow-forward" size={18} color={primary ? '#EAA4A0' : '#81818F'} />
      )}
    </Pressable>
  );
}
