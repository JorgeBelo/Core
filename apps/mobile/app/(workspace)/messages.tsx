import React, { useEffect, useState } from 'react';
import { View, Linking } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button, Card, Choice, Field, Heading, Label, Loading, Notice } from '@core/ui';
import {
  businessDate,
  birthdayTemplateKey,
  defaultMessageTemplates,
  messageTemplatesSchema,
  renderMessage,
  whatsAppLink,
  formatBRL,
  type Student,
  type MessageTemplates,
} from '@core/domain';
import { readableError } from '@core/api-client';
import { financeRepository, repository } from '../../src/lib/backend';
import { useSession } from '../../src/lib/session';

export default function Messages() {
  const { professional, updateProfessional } = useSession();
  const params = useLocalSearchParams<{ saved?: string }>();
  const [tab, setTab] = useState<'due' | 'birthday' | 'models'>('due'),
    [date, setDate] = useState(businessDate()),
    [info, setInfo] = useState(''),
    [error, setError] = useState(''),
    [showSetup, setShowSetup] = useState(false),
    [templates, setTemplates] = useState<MessageTemplates>(
      professional?.message_templates ?? defaultMessageTemplates,
    );
  useEffect(() => {
    const timer = setInterval(() => setDate(businessDate()), 60000);
    return () => clearInterval(timer);
  }, []);
  const q = useQuery({
    queryKey: ['message-previews', professional?.id, date],
    queryFn: async () => {
      const [students, due] = await Promise.all([
        repository!.allStudents(professional!.id),
        financeRepository!.dueToday(professional!.id, date),
      ]);
      return { students, due };
    },
    enabled: !!professional,
  });
  const save = useMutation({
    mutationFn: () =>
      repository!.saveMessageTemplates(messageTemplatesSchema.parse(templates), professional!),
    onSuccess: (updated) => {
      updateProfessional(updated);
      setInfo('Modelos salvos.');
      router.setParams({ saved: '1' });
    },
  });
  if (!professional) return null;
  const stored = professional.message_templates;
  const byStudent = Object.fromEntries((q.data?.students ?? []).map((s) => [s.id, s]));
  const birthdays = (q.data?.students ?? []).filter(
    (s) => s.status === 'active' && s.birth_date && s.birth_date.slice(5) === date.slice(5),
  );
  async function openMessage(student: Student | undefined, message: string) {
    setError('');
    setInfo('');
    if (!student?.whatsapp_opt_in) {
      setError('Registre a autorização do aluno no cadastro antes de abrir a mensagem.');
      return;
    }
    const url = whatsAppLink(student.phone, message);
    if (!url) {
      setError('Confira o telefone do aluno no cadastro, incluindo DDD.');
      return;
    }
    try {
      await Linking.openURL(url);
      setInfo('Conversa aberta. Confira a mensagem e confirme o envio no WhatsApp.');
    } catch {
      setError('Não foi possível abrir o WhatsApp neste dispositivo.');
    }
  }
  function recipient(s: Student | undefined, message: string) {
    return (
      <>
        <Label>{message}</Label>
        {s ? (
          <>
            <Label muted style={{ fontSize: 12 }}>
              {s.phone || 'Telefone não cadastrado'}
              {!s.whatsapp_opt_in ? ' · Sem autorização para avisos' : ''}
            </Label>
            <Button
              secondary
              disabled={!s.whatsapp_opt_in || !whatsAppLink(s.phone, message)}
              onPress={() => openMessage(s, message)}
            >
              Abrir no WhatsApp
            </Button>
            {(!s.phone || !s.whatsapp_opt_in) && (
              <Label muted style={{ fontSize: 12 }}>
                Complete o telefone e a autorização no cadastro do aluno.
              </Label>
            )}
          </>
        ) : (
          <Label muted>Vincule esta cobrança a um aluno com telefone cadastrado.</Label>
        )}
      </>
    );
  }
  return (
    <>
      <Heading>Mensagens e lembretes</Heading>
      <Label muted>Mensagens prontas para os vencimentos e aniversários de hoje.</Label>
      <Card>
        <Heading level={3}>Envio automático: não conectado</Heading>
        <Label muted>
          Você já pode abrir as mensagens prontas no seu WhatsApp. Para enviar automaticamente, é
          necessário conectar a API oficial.
        </Label>
        <Button secondary onPress={() => setShowSetup((v) => !v)}>
          {showSetup ? 'Ocultar configuração' : 'Como ativar envio automático'}
        </Button>
        {showSetup && (
          <>
            <Label muted>
              A ativação exige uma conta na Plataforma WhatsApp Business, um número habilitado para
              API, modelos aprovados e um serviço de envio configurado. O aplicativo comum no
              celular, sozinho, não fornece esse envio automático.
            </Label>
            <Button
              secondary
              onPress={() =>
                Linking.openURL('https://business.whatsapp.com/products/business-platform')
              }
            >
              Conhecer a plataforma oficial
            </Button>
          </>
        )}
      </Card>
      {info && <Notice>{info}</Notice>}
      {params.saved === '1' && !info && <Notice>Modelos salvos.</Notice>}
      {error && <Notice error>{error}</Notice>}
      <Choice
        label="Mensagens"
        value={tab}
        onChange={(v) => {
          setTab(v);
          setInfo('');
          setError('');
        }}
        options={[
          { value: 'due', label: 'Vencimentos' },
          { value: 'birthday', label: 'Aniversários' },
          { value: 'models', label: 'Modelos' },
        ]}
      />
      {tab === 'models' ? (
        <>
          <Label muted>
            Use {'{nome}'} para o primeiro nome e {'{personal}'} para sua assinatura. A cobrança
            também aceita {'{valor}'} e {'{vencimento}'}.
          </Label>
          {(
            [
              { key: 'due', title: 'Aviso de vencimento' },
              { key: 'birthday_female', title: 'Aniversário - feminino' },
              { key: 'birthday_male', title: 'Aniversário - masculino' },
              { key: 'birthday_neutral', title: 'Aniversário - neutro' },
            ] as const
          ).map((t) => (
            <Card key={t.key}>
              <Field
                label={t.title}
                multiline
                maxLength={2000}
                value={templates[t.key]}
                onChangeText={(v) => setTemplates((f) => ({ ...f, [t.key]: v }))}
                editable={!save.isPending}
              />
            </Card>
          ))}
          {save.error && <Notice error>{readableError(save.error)}</Notice>}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            <Button
              secondary
              disabled={save.isPending}
              onPress={() => setTemplates(defaultMessageTemplates)}
            >
              Restaurar textos padrão
            </Button>
            <Button
              loading={save.isPending}
              onPress={() => {
                const parsed = messageTemplatesSchema.safeParse(templates);
                if (!parsed.success) {
                  setError(
                    'Confira os textos: use de 10 a 2000 caracteres e somente os campos indicados.',
                  );
                  return;
                }
                setError('');
                save.mutate();
              }}
            >
              Salvar modelos
            </Button>
          </View>
        </>
      ) : q.isPending ? (
        <Loading />
      ) : q.error ? (
        <>
          <Notice error>{readableError(q.error)}</Notice>
          <Button secondary onPress={() => q.refetch()}>
            Tentar novamente
          </Button>
        </>
      ) : tab === 'due' ? (
        <>
          {!q.data.due.length && (
            <Card>
              <Heading level={2}>Nenhum vencimento em aberto hoje</Heading>
              <Label muted>
                As cobranças com vencimento hoje e saldo pendente aparecerão aqui. Pagamentos
                confirmados e cobranças contestadas ou canceladas ficam fora dos lembretes.
              </Label>
            </Card>
          )}
          {q.data.due.map((e) => {
            const s = e.student_id ? byStudent[e.student_id] : undefined;
            const message = renderMessage(stored.due, {
              nome: s?.full_name.split(' ')[0] ?? 'aluno',
              personal: professional.display_name,
              valor: formatBRL(e.balance_cents),
              vencimento: e.due_date.split('-').reverse().join('/'),
            });
            return (
              <Card key={e.id}>
                <Heading level={2}>{s?.full_name ?? e.description}</Heading>
                <Label muted>
                  {e.description} · {formatBRL(e.balance_cents)}
                </Label>
                {recipient(s, message)}
              </Card>
            );
          })}
        </>
      ) : (
        <>
          {!birthdays.length && (
            <Card>
              <Heading level={2}>Nenhum aniversariante hoje</Heading>
              <Label muted>
                Preencha a data de nascimento no cadastro para preparar os parabéns no dia certo.
              </Label>
            </Card>
          )}
          {birthdays.map((s) => (
            <Card key={s.id}>
              <Heading level={2}>Parabéns, {s.full_name.split(' ')[0]}!</Heading>
              {recipient(
                s,
                renderMessage(stored[birthdayTemplateKey(s.gender)], {
                  nome: s.full_name.split(' ')[0],
                  personal: professional.display_name,
                }),
              )}
            </Card>
          ))}
        </>
      )}
    </>
  );
}
