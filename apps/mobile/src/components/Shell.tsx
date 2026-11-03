import React, { useState } from 'react';
import { View, Pressable, TextInput, useWindowDimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Heading, Label, Loading, Notice, colors } from '@core/ui';
import { initials } from '@core/domain';
import { useSession } from '../lib/session';
import { supabase } from '../lib/backend';
import { Auth, Wordmark } from './Auth';
import { StudentArea } from './StudentArea';
const nav = [
  { path: '/home', label: 'Início', icon: 'grid-outline' },
  { path: '/students', label: 'Alunos', icon: 'people-outline' },
  { path: '/training', label: 'Treinos', icon: 'barbell-outline' },
  { path: '/schedule', label: 'Agenda', icon: 'calendar-outline' },
  { path: '/finance', label: 'Financeiro', icon: 'wallet-outline' },
] as const;
export function Shell({ children }: { children: React.ReactNode }) {
  const session = useSession();
  const { width } = useWindowDimensions();
  const desktop = width >= 1000;
  const [collapsed, setCollapsed] = useState(false),
    [search, setSearch] = useState(''),
    [exitError, setExitError] = useState('');
  const path = usePathname();
  if (session.loading)
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <Loading />
      </SafeAreaView>
    );
  if (!session.session)
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <Auth />
      </SafeAreaView>
    );
  async function signOut() {
    const { error } = await supabase!.auth.signOut();
    if (error) setExitError('Não foi possível sair. Tente novamente.');
    else router.replace('/home');
  }
  if (session.error)
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, padding: 28, gap: 16 }}>
        <Notice error>{session.error}</Notice>
        <Button onPress={session.reload}>Tentar novamente</Button>
        <Button secondary onPress={signOut}>
          Sair
        </Button>
      </SafeAreaView>
    );
  if (!session.professional && session.student)
    return <StudentArea student={session.student} onSignOut={signOut} exitError={exitError} />;
  if (!session.professional)
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView
          contentContainerStyle={{
            padding: 28,
            gap: 24,
            maxWidth: 720,
            width: '100%',
            alignSelf: 'center',
          }}
        >
          <Wordmark />
          {exitError && <Notice error>{exitError}</Notice>}
          {session.student ? (
            <>
              <Heading>Olá, {session.student.full_name.split(' ')[0]}.</Heading>
              <Label muted>Seu espaço de acompanhamento</Label>
              <Card>
                <Heading level={2}>Meu cadastro</Heading>
                <Label>{session.student.full_name}</Label>
                <Label muted>{session.student.email || 'E-mail não informado'}</Label>
                <Label muted>Objetivo: {session.student.goal || 'Ainda não informado'}</Label>
              </Card>
              <Notice>
                Seu acesso ao próprio cadastro está ativo. Treinos, registros de execução, evolução
                e mensagens serão disponibilizados nas próximas etapas.
              </Notice>
            </>
          ) : (
            <>
              <Heading>Acesso em preparação</Heading>
              <Notice>
                Esta conta ainda não possui vínculo ativo. Solicite a liberação ao responsável pelo
                Core.
              </Notice>
              <Button secondary onPress={session.reload}>
                Verificar vínculo
              </Button>
            </>
          )}
          <Button secondary onPress={signOut}>
            Sair da conta
          </Button>
        </ScrollView>
      </SafeAreaView>
    );
  const name = session.professional.display_name;
  function navItem(item: (typeof nav)[number], small = false) {
    const active =
      item.path === '/students' || item.path === '/training'
        ? path.startsWith(item.path)
        : path === item.path;
    return (
      <Pressable
        key={item.path}
        accessibilityRole="link"
        accessibilityLabel={item.label}
        accessibilityState={{ selected: active }}
        onPress={() => router.push(item.path)}
        style={{
          flex: small ? 1 : undefined,
          flexDirection: small ? 'column' : 'row',
          alignItems: 'center',
          gap: small ? 4 : 14,
          paddingVertical: small ? 10 : 14,
          paddingHorizontal: small ? 2 : 16,
          borderRadius: 10,
          backgroundColor: active && !small ? '#392023' : 'transparent',
          minHeight: 48,
        }}
      >
        <Ionicons name={item.icon} size={21} color={active ? '#E28783' : colors.secondary} />
        {(!collapsed || small || !desktop) && (
          <Label
            style={{
              color: active ? '#FFFFFF' : colors.secondary,
              fontSize: small ? 10 : 14,
              fontWeight: active ? '600' : '400',
            }}
          >
            {item.label}
          </Label>
        )}
      </Pressable>
    );
  }
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, flexDirection: 'row' }}>
        {desktop && (
          <View
            style={{
              width: collapsed ? 82 : 232,
              borderRightWidth: 1,
              borderColor: colors.border,
              padding: collapsed ? 12 : 22,
              gap: 32,
              backgroundColor: '#17171B',
            }}
          >
            {collapsed ? <Heading>C.</Heading> : <Wordmark />}
            <View style={{ gap: 8 }}>
              {!collapsed && (
                <Label
                  muted
                  style={{ fontSize: 10, letterSpacing: 1.6, paddingLeft: 16, marginBottom: 8 }}
                >
                  ESPAÇO PROFISSIONAL
                </Label>
              )}
              {nav.map((i) => navItem(i))}
            </View>
            <View style={{ flex: 1 }} />
            {!collapsed && (
              <View
                style={{ borderTopWidth: 1, borderColor: colors.border, paddingTop: 20, gap: 7 }}
              >
                <Label style={{ fontSize: 12 }}>Construído para evoluir.</Label>
                <Label muted style={{ fontSize: 11 }}>
                  Fundação · versão 0.1
                </Label>
              </View>
            )}
            <Button
              secondary
              accessibilityLabel={collapsed ? 'Expandir menu' : 'Recolher menu'}
              onPress={() => setCollapsed((v) => !v)}
            >
              {collapsed ? '→' : '← Recolher menu'}
            </Button>
          </View>
        )}
        <View style={{ flex: 1, minWidth: 0 }}>
          <View
            style={{
              minHeight: 78,
              paddingHorizontal: desktop ? 36 : 20,
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderColor: colors.border,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16,
            }}
          >
            {desktop ? (
              <View
                style={{
                  flex: 1,
                  maxWidth: 420,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <Ionicons name="search-outline" size={19} color={colors.secondary} />
                <TextInput
                  accessibilityLabel="Busca global de alunos"
                  placeholder="Buscar aluno pelo nome…"
                  placeholderTextColor={colors.secondary}
                  value={search}
                  onChangeText={setSearch}
                  onSubmitEditing={() => {
                    router.push({ pathname: '/students', params: { q: search } });
                    setSearch('');
                  }}
                  returnKeyType="search"
                  style={{ color: 'white', fontSize: 14, flex: 1, minHeight: 44 }}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Buscar alunos"
                  onPress={() => {
                    router.push({ pathname: '/students', params: { q: search } });
                    setSearch('');
                  }}
                  style={{ padding: 10 }}
                >
                  <Ionicons name="arrow-forward" color={colors.secondary} size={18} />
                </Pressable>
              </View>
            ) : (
              <Label style={{ fontSize: 27, fontWeight: '800', letterSpacing: -1 }}>Core.</Label>
            )}
            <View style={{ flex: 1 }} />
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Minha conta"
              onPress={() => router.push('/account')}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 }}
            >
              {desktop && (
                <View>
                  <Label style={{ fontSize: 13, textAlign: 'right' }}>{name}</Label>
                  <Label muted style={{ fontSize: 11, textAlign: 'right' }}>
                    Personal trainer
                  </Label>
                </View>
              )}
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 13,
                  backgroundColor: '#343139',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Label style={{ fontSize: 13, fontWeight: '700' }}>{initials(name)}</Label>
              </View>
            </Pressable>
          </View>
          {exitError && <Notice error>{exitError}</Notice>}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              padding: desktop ? 36 : 20,
              gap: 24,
              paddingBottom: 36,
              maxWidth: 1440,
              width: '100%',
              alignSelf: 'center',
            }}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets
          >
            {children}
          </ScrollView>
          {!desktop && (
            <View
              style={{
                flexDirection: 'row',
                borderTopWidth: 1,
                borderColor: colors.border,
                backgroundColor: '#17171B',
                paddingHorizontal: 8,
              }}
            >
              {nav.map((i) => navItem(i, true))}
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
