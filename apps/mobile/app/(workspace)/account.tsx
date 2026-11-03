import React, { useState } from 'react';
import { router } from 'expo-router';
import { Button, Card, Heading, Label, Notice } from '@core/ui';
import { useSession } from '../../src/lib/session';
import { supabase } from '../../src/lib/backend';
export default function Account() {
  const { session, professional } = useSession();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function exit() {
    setBusy(true);
    const { error } = await supabase!.auth.signOut();
    setBusy(false);
    if (error) setError('Não foi possível sair. Tente novamente.');
    else router.replace('/home');
  }
  return (
    <>
      <Heading>Minha conta</Heading>
      {error && <Notice error>{error}</Notice>}
      <Card>
        <Heading level={2}>{professional?.display_name}</Heading>
        <Label muted>{session?.user.email}</Label>
        <Label>Perfil: personal trainer</Label>
        <Label muted>
          O acesso é individual. No navegador, recarregar ou fechar a página encerra a sessão local.
          Em dispositivos móveis, a sessão é protegida pelo armazenamento do sistema.
        </Label>
        <Button secondary onPress={() => router.push('/recover')}>
          Alterar senha por e-mail
        </Button>
        <Button onPress={exit} loading={busy}>
          Sair da conta
        </Button>
      </Card>
    </>
  );
}
