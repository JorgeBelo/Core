import React from 'react';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Heading, Label, Loading, Notice } from '@core/ui';
import { readableError } from '@core/api-client';
import { trainingRepository } from '../../../src/lib/backend';
import { useSession } from '../../../src/lib/session';
export default function History() {
  const { professional } = useSession();
  const query = useQuery({
    queryKey: ['training-sessions', professional?.id],
    queryFn: () => trainingRepository!.sessions(undefined, true),
    enabled: !!professional,
  });
  return (
    <>
      <Heading>Execução registrada</Heading>
      <Label muted>
        Até 30 sessões mais recentes da sua carteira. Os registros preservam a versão prescrita.
      </Label>
      <Button secondary onPress={() => router.push('/training')}>
        Voltar para treinos
      </Button>
      {query.isPending ? (
        <Loading />
      ) : query.error ? (
        <>
          <Notice error>{readableError(query.error)}</Notice>
          <Button secondary onPress={() => query.refetch()}>
            Tentar novamente
          </Button>
        </>
      ) : query.data.length ? (
        query.data.map((s) => (
          <Card key={s.id}>
            <Label>{new Date(s.performed_at).toLocaleString('pt-BR')}</Label>
            <Label muted>Aluno: {s.student_name || 'Aluno indisponível'}</Label>
            <Label>
              {s.results.reduce((total, e) => total + e.sets.filter((v) => v.completed).length, 0)}{' '}
              séries concluídas ·{' '}
              {s.duration_minutes ? s.duration_minutes + ' min' : 'Duração não informada'}
            </Label>
            {s.results.map((e) => (
              <Label muted key={e.exercise_id}>
                {s.exercise_names?.[e.exercise_id] || 'Exercício registrado'}:{' '}
                {e.sets
                  .filter((v) => v.completed)
                  .map((v) => `${v.repetitions} rep. × ${v.load_kg} kg`)
                  .join(' · ')}
              </Label>
            ))}
            {!!s.feedback && <Label>Feedback: {s.feedback}</Label>}
          </Card>
        ))
      ) : (
        <Card>
          <Heading level={2}>Nenhuma sessão registrada</Heading>
          <Label muted>Os registros aparecerão após o aluno executar um treino liberado.</Label>
        </Card>
      )}
    </>
  );
}
