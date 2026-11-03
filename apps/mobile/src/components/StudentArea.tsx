import React, { useState } from 'react';
import { View, ScrollView, Pressable, Linking, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Field, Heading, Label, Loading, Notice, colors } from '@core/ui';
import {
  sessionResultsSchema,
  type Student,
  type ProgramVersion,
  type SessionResults,
} from '@core/domain';
import { readableError } from '@core/api-client';
import { trainingRepository } from '../lib/backend';
import { Wordmark } from './Auth';

export function StudentArea({
  student,
  onSignOut,
  exitError,
}: {
  student: Student;
  onSignOut: () => void;
  exitError: string;
}) {
  const cache = useQueryClient();
  const [tab, setTab] = useState<'home' | 'workout' | 'progress' | 'messages'>('home');
  const [execution, setExecution] = useState<{
      version: ProgramVersion;
      day: number;
      key: string;
      results: SessionResults;
    } | null>(null),
    [feedback, setFeedback] = useState(''),
    [duration, setDuration] = useState(''),
    [error, setError] = useState(''),
    [done, setDone] = useState(''),
    [discard, setDiscard] = useState(false);
  const versions = useQuery({
    queryKey: ['student-versions', student.id],
    queryFn: () => trainingRepository!.versions(student.id),
  });
  const sessions = useQuery({
    queryKey: ['student-sessions', student.id],
    queryFn: () => trainingRepository!.sessions(student.id),
  });
  const finish = useMutation({
    mutationFn: () =>
      trainingRepository!.finish(
        execution!.version.id,
        execution!.day,
        execution!.results,
        feedback,
        duration ? Number(duration) : null,
        execution!.key,
      ),
    onSuccess: async () => {
      setExecution(null);
      setFeedback('');
      setDuration('');
      setDone('Sessão registrada com sucesso. Seu personal poderá acompanhar o resultado.');
      await cache.invalidateQueries({ queryKey: ['student-sessions'] });
    },
  });
  function begin(version: ProgramVersion, day: number) {
    setError('');
    setDone('');
    setFeedback('');
    setDuration('');
    finish.reset();
    setExecution({
      version,
      day,
      key: Crypto.randomUUID(),
      results: version.snapshot.days[day].exercises.map((e) => ({
        exercise_id: e.exercise_id,
        sets: Array.from({ length: e.sets }, () => ({
          repetitions: 0,
          load_kg: 0,
          effort: null,
          completed: false,
        })),
      })),
    });
  }
  function change(
    exerciseIndex: number,
    setIndex: number,
    key: 'repetitions' | 'load_kg' | 'effort' | 'completed',
    value: number | boolean | null,
  ) {
    setExecution((v) =>
      v
        ? {
            ...v,
            results: v.results.map((e, i) =>
              i === exerciseIndex
                ? {
                    ...e,
                    sets: e.sets.map((s, j) => (j === setIndex ? { ...s, [key]: value } : s)),
                  }
                : e,
            ),
          }
        : v,
    );
  }
  function submit() {
    setError('');
    if (!sessionResultsSchema.safeParse(execution!.results).success) {
      setError('Revise repetições, cargas e esforço. Use números válidos.');
      return;
    }
    if (!execution!.results.some((e) => e.sets.some((s) => s.completed))) {
      setError('Marque pelo menos uma série concluída.');
      return;
    }
    if (
      duration &&
      (!Number.isInteger(Number(duration)) || Number(duration) < 1 || Number(duration) > 1440)
    ) {
      setError('Informe uma duração entre 1 e 1440 minutos.');
      return;
    }
    finish.mutate();
  }
  const latest = versions.data?.[0];
  const nav = [
    { key: 'home', label: 'Início', icon: 'home-outline' },
    { key: 'workout', label: 'Meu treino', icon: 'barbell-outline' },
    { key: 'progress', label: 'Evolução', icon: 'stats-chart-outline' },
    { key: 'messages', label: 'Mensagens', icon: 'chatbubble-outline' },
  ] as const;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingHorizontal: 24,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Wordmark />
      </View>
      <ScrollView
        contentContainerStyle={{
          padding: 24,
          gap: 20,
          maxWidth: 900,
          width: '100%',
          alignSelf: 'center',
          paddingBottom: 36,
        }}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        {exitError && <Notice error>{exitError}</Notice>}
        {done && <Notice>{done}</Notice>}
        {error && <Notice error>{error}</Notice>}
        {tab === 'home' && (
          <>
            <Heading>Olá, {student.full_name.split(' ')[0]}.</Heading>
            <Label muted>Seu cuidado, um treino por vez.</Label>
            <Card>
              <Heading level={2}>Meu cadastro</Heading>
              <Label>{student.full_name}</Label>
              <Label muted>{student.email || 'E-mail não informado'}</Label>
              <Label>Objetivo: {student.goal || 'Ainda não informado'}</Label>
            </Card>
            <Card>
              <Heading level={2}>
                {latest ? latest.snapshot.name : 'Seu treino está sendo preparado'}
              </Heading>
              <Label muted>
                {latest
                  ? 'Uma versão aprovada pelo seu personal está disponível.'
                  : 'Os programas aparecerão aqui depois da aprovação do seu personal.'}
              </Label>
              {latest && <Button onPress={() => setTab('workout')}>Abrir meu treino</Button>}
            </Card>
            <Button secondary onPress={onSignOut}>
              Sair da conta
            </Button>
          </>
        )}
        {tab === 'workout' && (
          <>
            <Heading>Meu treino</Heading>
            {versions.isPending ? (
              <Loading />
            ) : versions.error ? (
              <>
                <Notice error>{readableError(versions.error)}</Notice>
                <Button secondary onPress={() => versions.refetch()}>
                  Tentar novamente
                </Button>
              </>
            ) : !latest ? (
              <Card>
                <Heading level={2}>Nenhum programa liberado</Heading>
                <Label muted>Aguarde a revisão e a liberação do seu personal.</Label>
              </Card>
            ) : execution ? (
              <>
                <Card>
                  <Heading level={2}>{execution.version.snapshot.days[execution.day].name}</Heading>
                  <Label muted>
                    Prescrição: versão {execution.version.revision}. Registre abaixo o que você
                    realmente realizou.
                  </Label>
                  <Notice>
                    As séries permanecem apenas nesta tela até finalizar. Mantenha a página aberta.
                    Se a conexão falhar no envio, tente novamente sem recarregar.
                  </Notice>
                </Card>
                {execution.version.snapshot.days[execution.day].exercises.map((e, ei) => (
                  <Card key={e.exercise_id}>
                    <Heading level={2}>{e.name}</Heading>
                    <Label>
                      Prescrito: {e.sets} séries ·{' '}
                      {e.repetitions || 'Repetições conforme orientação'} · {e.rest_seconds}s de
                      intervalo
                    </Label>
                    {e.load_kg !== null && <Label muted>Carga de referência: {e.load_kg} kg</Label>}
                    {e.rpe !== null && <Label muted>RPE prescrito: {e.rpe}</Label>}
                    {e.rir !== null && <Label muted>RIR prescrito: {e.rir}</Label>}
                    {!!e.tempo && <Label muted>Tempo: {e.tempo}</Label>}
                    {!!e.instructions && <Label>{e.instructions}</Label>}
                    {!!e.notes && <Notice>{e.notes}</Notice>}
                    {!!e.video_url && (
                      <Button
                        secondary
                        onPress={() =>
                          Linking.openURL(e.video_url).catch(() =>
                            setError('Não foi possível abrir o vídeo.'),
                          )
                        }
                      >
                        Abrir demonstração
                      </Button>
                    )}
                    {execution.results[ei].sets.map((s, si) => (
                      <View
                        key={si}
                        style={{
                          gap: 10,
                          borderTopWidth: 1,
                          borderColor: colors.border,
                          paddingTop: 16,
                        }}
                      >
                        <Label style={{ fontWeight: '600' }}>Série {si + 1}</Label>
                        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                          <Field
                            label={`Repetições — série ${si + 1}`}
                            value={s.repetitions ? String(s.repetitions) : ''}
                            keyboardType="number-pad"
                            onChangeText={(v) => change(ei, si, 'repetitions', Number(v))}
                          />
                          <Field
                            label={`Carga em kg — série ${si + 1}`}
                            value={String(s.load_kg)}
                            keyboardType="decimal-pad"
                            onChangeText={(v) =>
                              change(ei, si, 'load_kg', Number(v.replace(',', '.')))
                            }
                          />
                          <Field
                            label={`Esforço RPE — série ${si + 1}`}
                            value={s.effort === null ? '' : String(s.effort)}
                            keyboardType="decimal-pad"
                            placeholder="Opcional, 1–10"
                            onChangeText={(v) =>
                              change(
                                ei,
                                si,
                                'effort',
                                v === '' ? null : Number(v.replace(',', '.')),
                              )
                            }
                          />
                        </View>
                        <Button secondary onPress={() => change(ei, si, 'completed', !s.completed)}>
                          {s.completed ? '✓ Série concluída — desmarcar' : 'Marcar série concluída'}
                        </Button>
                      </View>
                    ))}
                  </Card>
                ))}
                <Card>
                  <Field
                    label="Duração da sessão em minutos (opcional)"
                    value={duration}
                    onChangeText={setDuration}
                    keyboardType="number-pad"
                  />
                  <Field
                    label="Como foi o treino?"
                    value={feedback}
                    onChangeText={setFeedback}
                    multiline
                    maxLength={2000}
                  />
                  {finish.error && <Notice error>{readableError(finish.error)}</Notice>}
                  <Button onPress={submit} loading={finish.isPending}>
                    Finalizar e enviar sessão
                  </Button>
                  <Button secondary disabled={finish.isPending} onPress={() => setDiscard(true)}>
                    Descartar sessão não enviada
                  </Button>
                </Card>
              </>
            ) : (
              <>
                <Card>
                  <Heading level={2}>{latest.snapshot.name}</Heading>
                  <Label muted>
                    Versão {latest.revision} · {latest.snapshot.frequency}× por semana ·{' '}
                    {latest.snapshot.duration_weeks} semanas
                  </Label>
                  {!!latest.snapshot.notes && <Label>{latest.snapshot.notes}</Label>}
                </Card>
                {latest.snapshot.days.map((day, index) => (
                  <Card key={index}>
                    <Heading level={2}>{day.name}</Heading>
                    {day.exercises.map((e) => (
                      <Label key={e.exercise_id}>
                        {e.name} · {e.sets} × {e.repetitions}
                      </Label>
                    ))}
                    <Button onPress={() => begin(latest, index)}>Iniciar {day.name}</Button>
                  </Card>
                ))}
              </>
            )}
          </>
        )}
        {tab === 'progress' && (
          <>
            <Heading>Sua evolução</Heading>
            <Label muted>
              Até 30 sessões mais recentes. Registros reais, vinculados à versão executada.
            </Label>
            {sessions.isPending ? (
              <Loading />
            ) : sessions.error ? (
              <>
                <Notice error>{readableError(sessions.error)}</Notice>
                <Button secondary onPress={() => sessions.refetch()}>
                  Tentar novamente
                </Button>
              </>
            ) : sessions.data.length ? (
              sessions.data.map((s) => (
                <Card key={s.id}>
                  <Heading level={3}>{new Date(s.performed_at).toLocaleString('pt-BR')}</Heading>
                  <Label>
                    {s.results.reduce((n, e) => n + e.sets.filter((v) => v.completed).length, 0)}{' '}
                    séries concluídas
                  </Label>
                  {s.results.map((e) => {
                    const name =
                      versions.data
                        ?.flatMap((v) => v.snapshot.days.flatMap((d) => d.exercises))
                        .find((v) => v.exercise_id === e.exercise_id)?.name ||
                      'Exercício registrado';
                    return (
                      <View key={e.exercise_id}>
                        <Label>{name}</Label>
                        <Label muted>
                          {e.sets
                            .filter((v) => v.completed)
                            .map((v) => `${v.repetitions} rep. × ${v.load_kg} kg`)
                            .join(' · ')}
                        </Label>
                      </View>
                    );
                  })}
                  {!!s.feedback && <Label>{s.feedback}</Label>}
                </Card>
              ))
            ) : (
              <Card>
                <Heading level={2}>Sua história começa no primeiro treino</Heading>
                <Label muted>As sessões finalizadas aparecerão aqui.</Label>
              </Card>
            )}
          </>
        )}
        {tab === 'messages' && (
          <>
            <Heading>Mensagens</Heading>
            <Notice>
              Comunicação interna planejada para a fase 5. Este módulo ainda não está disponível.
            </Notice>
          </>
        )}
      </ScrollView>
      <View
        style={{
          flexDirection: 'row',
          borderTopWidth: 1,
          borderColor: colors.border,
          backgroundColor: '#17171B',
        }}
      >
        {nav.map((item) => (
          <Pressable
            key={item.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === item.key }}
            accessibilityLabel={item.label}
            onPress={() => setTab(item.key)}
            style={{ flex: 1, paddingVertical: 12, alignItems: 'center', gap: 5, minHeight: 55 }}
          >
            <Ionicons
              name={item.icon}
              size={22}
              color={tab === item.key ? '#E28783' : colors.secondary}
            />
            <Label style={{ fontSize: 11, color: tab === item.key ? 'white' : colors.secondary }}>
              {item.label}
            </Label>
          </Pressable>
        ))}
      </View>
      <Modal visible={discard} transparent onRequestClose={() => setDiscard(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: '#000B',
            padding: 24,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Card style={{ maxWidth: 420, width: '100%' }}>
            <Heading level={2}>Descartar esta sessão?</Heading>
            <Label muted>Os registros ainda não enviados serão perdidos.</Label>
            <Button secondary onPress={() => setDiscard(false)}>
              Continuar treinando
            </Button>
            <Button
              onPress={() => {
                setExecution(null);
                setDiscard(false);
              }}
            >
              Descartar registros
            </Button>
          </Card>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
