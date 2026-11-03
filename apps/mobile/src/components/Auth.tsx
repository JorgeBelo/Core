import React, { useState } from 'react';
import { View, ScrollView, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Field, Heading, Label, Notice, colors } from '@core/ui';
import { readableError } from '@core/api-client';
import { configured, supabase } from '../lib/backend';
export function Wordmark() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}>
      <Label style={{ fontSize: 40, lineHeight: 48, fontWeight: '900', letterSpacing: -2 }}>
        Core<Label style={{ fontSize: 40, color: '#D24B47' }}>.</Label>
      </Label>
      <Label muted style={{ fontSize: 10, letterSpacing: 2 }}>
        PERSONAL
      </Label>
    </View>
  );
}
export function Auth() {
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  async function login() {
    setError('');
    if (!/^\S+@\S+\.\S+$/.test(email.trim()) || !password) {
      setError('Informe seu e-mail e sua senha.');
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase!.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
    } catch (e) {
      setError(readableError(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ flexGrow: 1, minHeight: '100%' }}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      <View style={{ flex: 1, flexDirection: wide ? 'row' : 'column' }}>
        <View
          style={{
            flex: wide ? 1.15 : undefined,
            backgroundColor: '#19191D',
            padding: wide ? 64 : 28,
            justifyContent: 'space-between',
            gap: wide ? 80 : 28,
            borderRightWidth: wide ? 1 : 0,
            borderColor: colors.border,
          }}
        >
          <Wordmark />
          {wide ? (
            <>
              <View style={{ gap: 24, maxWidth: 570 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View
                    style={{ height: 6, width: 6, borderRadius: 3, backgroundColor: '#D24B47' }}
                  />
                  <Label style={{ fontSize: 11, letterSpacing: 2, color: '#C9C9CF' }}>
                    SEU TRABALHO. NO CENTRO.
                  </Label>
                </View>
                <Heading>
                  Mais presença.{'\n'}Mais evolução.{'\n'}
                  <Label
                    style={{
                      fontSize: wide ? 52 : 36,
                      lineHeight: wide ? 60 : 44,
                      fontWeight: '700',
                      color: '#B5B5BE',
                    }}
                  >
                    Tudo começa no Core.
                  </Label>
                </Heading>
                <Label muted style={{ fontSize: 16, lineHeight: 26, maxWidth: 430 }}>
                  Um espaço para cuidar dos seus alunos e organizar sua rotina profissional.
                </Label>
                {wide && (
                  <View style={{ flexDirection: 'row', gap: 16, marginTop: 20 }}>
                    {['Alunos', 'Treinamento', 'Gestão'].map((t, i) => (
                      <View
                        key={t}
                        style={{
                          flex: 1,
                          borderTopWidth: 1,
                          borderColor: '#404047',
                          paddingTop: 15,
                          gap: 8,
                        }}
                      >
                        <Label muted style={{ fontSize: 11 }}>
                          0{i + 1}
                        </Label>
                        <Label>{t}</Label>
                      </View>
                    ))}
                  </View>
                )}
              </View>
              <Label muted style={{ fontSize: 11 }}>
                CORE PERSONAL · ACESSO PROFISSIONAL E DO ALUNO
              </Label>
            </>
          ) : (
            <Label muted>Seu trabalho. No centro.</Label>
          )}
        </View>
        <View
          style={{
            flex: 1,
            padding: wide ? 60 : 24,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <View style={{ width: '100%', maxWidth: 400, gap: 24 }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                backgroundColor: '#342124',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="finger-print-outline" size={26} color="#E0A09E" />
            </View>
            <View style={{ gap: 8 }}>
              <Heading>Seu próximo passo.</Heading>
              <Label muted>Entre na sua conta para continuar.</Label>
            </View>
            {!configured ? (
              <Card>
                <Heading level={3}>Conecte seu ambiente</Heading>
                <Label muted>
                  O backend ainda não foi configurado. Não há dados de demonstração ou cadastros
                  locais.
                </Label>
                <Label>
                  Configure as duas variáveis públicas do Supabase em apps/mobile/.env e aplique as
                  migrações. O passo a passo está no README do projeto.
                </Label>
                <Label muted style={{ fontSize: 12 }}>
                  A conexão é necessária para autenticar e persistir os dados com segurança.
                </Label>
              </Card>
            ) : (
              <>
                {error && <Notice error>{error}</Notice>}
                <Field
                  label="E-mail"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="seu@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
                <Field
                  label="Senha"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Sua senha"
                  secureTextEntry
                  autoComplete="current-password"
                  onSubmitEditing={login}
                />
                <Button onPress={login} loading={busy}>
                  Entrar no Core
                </Button>
                <Button secondary onPress={() => router.push('/recover')}>
                  Esqueci minha senha
                </Button>
                <Label muted style={{ fontSize: 12, textAlign: 'center' }}>
                  O acesso é liberado pelo responsável pelo Core.{'\n'}Não possui uma conta? Entre
                  em contato com seu personal.
                </Label>
              </>
            )}
            <Label muted style={{ fontSize: 11, textAlign: 'center' }}>
              Seus dados fazem parte do seu cuidado.
            </Label>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
