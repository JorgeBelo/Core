import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Card, Field, Heading, Label, Notice } from '@core/ui';
import { professionalProfileSchema } from '@core/domain';
import { readableError } from '@core/api-client';
import { useSession } from '../../src/lib/session';
import { supabase, repository } from '../../src/lib/backend';
export default function Account() {
  const { session, professional, updateProfessional } = useSession();
  const params = useLocalSearchParams<{ saved?: string }>();
  const [name, setName] = useState(professional?.display_name ?? ''),
    [cref, setCref] = useState(professional?.cref ?? ''),
    [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function exit() {
    setBusy(true);
    const { error } = await supabase!.auth.signOut();
    setBusy(false);
    if (error) setError('Não foi possível sair. Tente novamente.');
    else router.replace('/home');
  }
  async function saveProfile() {
    if (!professional || saving) return;
    const parsed = professionalProfileSchema.safeParse({ display_name: name, cref });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setSaving(true);
    setError('');
    try {
      const updated = await repository!.saveProfessional(parsed.data, professional);
      updateProfessional(updated);
      router.setParams({ saved: '1' });
    } catch (e) {
      setError(readableError(e));
    } finally {
      setSaving(false);
    }
  }
  return (
    <>
      <Heading>Minha conta</Heading>
      {error && <Notice error>{error}</Notice>}
      {params.saved === '1' && <Notice>Perfil salvo.</Notice>}
      <Card>
        <Heading level={2}>Cadastro profissional</Heading>
        <Field
          label="Nome do personal *"
          value={name}
          onChangeText={setName}
          editable={!saving}
          maxLength={120}
        />
        <Field
          label="CREF (opcional)"
          placeholder="Ex.: 123456-G/SP"
          value={cref}
          onChangeText={setCref}
          editable={!saving}
          maxLength={40}
        />
        <Label muted>
          Pode deixar o CREF em branco. Quando preenchido, ele aparece no relatório de alunos.
        </Label>
        <Button onPress={saveProfile} loading={saving}>
          Salvar perfil
        </Button>
        <Button secondary onPress={() => router.push('/messages')}>
          Mensagens e lembretes
        </Button>
      </Card>
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
