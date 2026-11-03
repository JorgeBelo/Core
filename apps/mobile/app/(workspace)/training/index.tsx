import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Heading, Label, Loading, Notice } from '@core/ui';
import { readableError } from '@core/api-client';
import { trainingRepository } from '../../../src/lib/backend';
import { useSession } from '../../../src/lib/session';
import { ActionTile } from '../../../src/components/Visual';
export default function Training() {
  const { professional } = useSession();
  const [page, setPage] = useState(0);
  const query = useQuery({
    queryKey: ['programs', professional?.id, page],
    queryFn: () => trainingRepository!.programs(page),
    enabled: !!professional,
  });
  return (
    <>
      <View
        style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}
      >
        <View style={{ gap: 7 }}>
          <Heading>Treinos</Heading>
          <Label muted>Monte, ajuste e acompanhe os treinos dos seus alunos.</Label>
        </View>
        <Button onPress={() => router.push('/training/programs/new')}>＋ Criar treino</Button>
      </View>
      <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
        <ActionTile
          icon="barbell-outline"
          title="Biblioteca de exercícios"
          description="Seus exercícios e favoritos"
          onPress={() => router.push('/training/exercises')}
          style={{ flex: 1, minWidth: 145 }}
        />
        <ActionTile
          icon="time-outline"
          title="Histórico de execução"
          description="O que seus alunos realizaram"
          onPress={() => router.push('/training/history')}
          style={{ flex: 1, minWidth: 145 }}
        />
      </View>
      <Heading level={2}>Seus programas</Heading>
      {query.isPending ? (
        <Loading />
      ) : query.error ? (
        <>
          <Notice error>{readableError(query.error)}</Notice>
          <Button secondary onPress={() => query.refetch()}>
            Tentar novamente
          </Button>
        </>
      ) : query.data.items.length ? (
        <>
          {query.data.items.map((p) => (
            <Card key={p.id}>
              <Heading level={2}>{p.name}</Heading>
              <Label muted>
                {p.frequency}× por semana · {p.duration_weeks} semanas · {p.draft_days.length}{' '}
                treino(s)
              </Label>
              <Label muted style={{ fontSize: 12 }}>
                Rascunho atualizado em {new Date(p.updated_at).toLocaleString('pt-BR')}
              </Label>
              <Button secondary onPress={() => router.push(`/training/programs/${p.id}`)}>
                Editar treino
              </Button>
            </Card>
          ))}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Button secondary disabled={page === 0} onPress={() => setPage((v) => v - 1)}>
              Anterior
            </Button>
            <Button
              secondary
              disabled={(page + 1) * 20 >= query.data.count}
              onPress={() => setPage((v) => v + 1)}
            >
              Próxima
            </Button>
          </View>
        </>
      ) : (
        <Card>
          <Heading level={2}>Vamos criar o primeiro treino?</Heading>
          <Label muted>Escolha um aluno, adicione os exercícios e revise antes de liberar.</Label>
        </Card>
      )}
    </>
  );
}
