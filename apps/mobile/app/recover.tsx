import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Field, Heading, Label, Notice, colors } from '@core/ui';
import { supabase } from '../src/lib/backend';
export default function Recover() {
  const [email, setEmail] = useState(''),
    [token, setToken] = useState(''),
    [password, setPassword] = useState(''),
    [sent, setSent] = useState(false),
    [message, setMessage] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  async function submit() {
    setError('');
    setMessage('');
    if (!supabase) {
      setError('Configure o backend primeiro.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Informe um e-mail válido.');
      return;
    }
    if (sent && (password.length < 12 || !token.trim())) {
      setError('Informe o código e uma senha com pelo menos 12 caracteres.');
      return;
    }
    setBusy(true);
    try {
      if (!sent) {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
        if (error) throw error;
        setSent(true);
        setMessage('Se a conta existir, enviaremos um código. Confira também a caixa de spam.');
      } else {
        const verification = await supabase.auth.verifyOtp({
          email: email.trim(),
          token: token.trim(),
          type: 'recovery',
        });
        if (verification.error) throw verification.error;
        try {
          const updated = await supabase.auth.updateUser({ password });
          if (updated.error) throw updated.error;
        } finally {
          // Recovery grants a session; close it even when updating the password fails.
          await supabase.auth.signOut();
        }
        setPassword('');
        setToken('');
        setSent(false);
        setMessage('Senha atualizada. Volte para entrar.');
      }
    } catch {
      setError(
        'Não foi possível concluir. Verifique o código, sua conexão ou solicite um novo envio.',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{
        flexGrow: 1,
        padding: 24,
        justifyContent: 'center',
        alignItems: 'center',
      }}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      <Card style={{ width: '100%', maxWidth: 480 }}>
        <Heading>Recupere seu acesso</Heading>
        <Label muted>Receba um código de recuperação no e-mail da sua conta.</Label>
        {message && <Notice>{message}</Notice>}
        {error && <Notice error>{error}</Notice>}
        <Field
          label="E-mail"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!sent}
        />
        {sent && (
          <>
            <Field
              label="Código do e-mail"
              value={token}
              onChangeText={setToken}
              autoComplete="one-time-code"
            />
            <Field
              label="Nova senha"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Pelo menos 12 caracteres"
            />
          </>
        )}
        <Button onPress={submit} loading={busy}>
          {sent ? 'Atualizar senha' : 'Enviar código'}
        </Button>
        {sent && (
          <Button
            secondary
            onPress={() => {
              setSent(false);
              setToken('');
              setPassword('');
            }}
          >
            Solicitar outro código
          </Button>
        )}
        <Button secondary onPress={() => router.replace('/home')}>
          Voltar para entrar
        </Button>
      </Card>
    </ScrollView>
  );
}
