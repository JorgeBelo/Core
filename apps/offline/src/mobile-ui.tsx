import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import {
  SafeAreaProvider,
  SafeAreaView,
  initialWindowMetrics,
} from 'react-native-safe-area-context';
import { Button, Icon, Txt, colors, styles as ui } from './ui';

export function Intro({ onDone }: { onDone: () => void }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const done = useRef(onDone);
  const [imageReady, setImageReady] = useState(false);
  const [laidOut, setLaidOut] = useState(false);
  const { width, height } = useWindowDimensions();
  const logoSize = Math.min(width - 48, height - 48, 320);
  useEffect(() => {
    if (!imageReady || !laidOut) return;
    let stopped = false;
    const animation = Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 550, useNativeDriver: true }),
      Animated.delay(650),
    ]);
    void SplashScreen.hideAsync().finally(() => {
      if (!stopped)
        animation.start(({ finished }) => {
          if (finished) done.current();
        });
    });
    return () => {
      stopped = true;
      animation.stop();
    };
  }, [opacity, imageReady, laidOut]);
  return (
    <View
      testID="core-intro"
      onLayout={() => setLaidOut(true)}
      style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}
    >
      <Animated.View style={{ opacity, width: logoSize, height: logoSize }}>
        <Image
          testID="core-intro-logo"
          accessibilityLabel="Core, Gestão para Personal Trainers"
          source={require('../assets/logo-original.png')}
          resizeMode="contain"
          // Native Image supplies intrinsic bitmap dimensions; override BOTH axes.
          style={{ width: logoSize, height: logoSize }}
          onLoad={() => setImageReady(true)}
          onError={() => {
            SplashScreen.hide();
            done.current();
          }}
        />
      </Animated.View>
    </View>
  );
}

export function Sheet({
  title,
  closeLabel = 'Voltar',
  onClose,
  onSave,
  saving = false,
  children,
}: {
  title: string;
  closeLabel?: string;
  onClose: () => void;
  onSave?: () => void;
  saving?: boolean;
  children: React.ReactNode;
}) {
  // A native Modal is a separate window: it needs its own safe-area measurement.
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={sheet.root}>
        <View testID="sheet-header" style={sheet.header}>
          <Button
            title={closeLabel}
            secondary
            icon="chevron-back"
            iconOnly
            onPress={onClose}
            disabled={saving}
          />
          <Txt style={sheet.title}>{title}</Txt>
          {onSave ? (
            <Button title={saving ? 'Salvando…' : 'Salvar'} onPress={onSave} disabled={saving} />
          ) : (
            <View style={{ width: 48 }} />
          )}
        </View>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            testID="sheet-scroll"
            style={{ flex: 1 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            contentContainerStyle={sheet.content}
          >
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

export function Stepper({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix = '',
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <View style={{ gap: 10 }}>
      <Txt style={{ fontSize: 14, fontWeight: '600' }}>{label}</Txt>
      <View style={[ui.row, { backgroundColor: colors.field, borderRadius: 13, padding: 5 }]}>
        <Button
          title={`Diminuir ${label.toLowerCase()}`}
          icon="remove"
          iconOnly
          secondary
          disabled={value <= min}
          onPress={() => onChange(Math.max(min, value - step))}
        />
        <Txt
          accessibilityLabel={`${label}: ${value}${suffix}`}
          style={{ flex: 1, fontSize: 19, fontWeight: '700', textAlign: 'center' }}
        >
          {value}
          {suffix}
        </Txt>
        <Button
          title={`Aumentar ${label.toLowerCase()}`}
          icon="add"
          iconOnly
          secondary
          disabled={value >= max}
          onPress={() => onChange(Math.min(max, value + step))}
        />
      </View>
    </View>
  );
}

export function Avatar({
  photo,
  name,
  size = 58,
}: {
  photo?: string;
  name: string;
  size?: number;
}) {
  return photo ? (
    <Image source={{ uri: photo }} style={{ width: size, height: size, borderRadius: size / 2 }} />
  ) : (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#291615',
      }}
    >
      {name ? (
        <Txt style={{ color: colors.accent, fontWeight: '700', fontSize: size / 3 }}>
          {name
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((s) => s[0])
            .join('')
            .toUpperCase()}
        </Txt>
      ) : (
        <Icon name="person-outline" size={size / 2} color={colors.accent} />
      )}
    </View>
  );
}
const sheet = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 66,
    paddingTop: 10,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  title: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700' },
  content: {
    padding: 16,
    paddingBottom: 36,
    gap: 16,
    width: '100%',
    maxWidth: 650,
    alignSelf: 'center',
  },
});
