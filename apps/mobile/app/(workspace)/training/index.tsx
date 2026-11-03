import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Heading, Label, Loading, Notice } from '@core/ui';
import { readableError } from '@core/api-client';
import { trainingRepository } from '../../../src/lib/backend';
import { useSession } from '../../../src/lib/session';
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
          <Label muted>PRESCRIÇÃO E ACOMPANHAMENTO</Label>
          <Heading>Treinos que fazem sentido.</Heading>
          <Label muted>Organize programas, revise e libere cada versão conscientemente.</Label>
        </View>
        <Button onPress={() => router.push('/training/programs/new')}>＋ Criar programa</Button>
      </View>
      <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
        <Button secondary onPress={() => router.push('/training/exercises')}>
          Biblioteca de exercícios
        </Button>
        <Button secondary onPress={() => router.push('/training/history')}>
          Histórico de execução
        </Button>
      </View>
      <Notice>
        Rascunhos ficam disponíveis apenas ao profissional. O aluno recebe uma versão somente após
        sua aprovação explícita.
      </Notice>
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
                divisão(ões)
              </Label>
              <Label muted style={{ fontSize: 12 }}>
                Rascunho atualizado em {new Date(p.updated_at).toLocaleString('pt-BR')}
              </Label>
              <Button secondary onPress={() => router.push(`/training/programs/${p.id}`)}>
                Abrir editor
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
          <Heading level={2}>Seu primeiro programa começa aqui</Heading>
          <Label muted>
            Cadastre exercícios na biblioteca, selecione um aluno e organize as divisões do treino.
          </Label>
        </Card>
      )}
      <Card>
        <Heading level={3}>Core AI</Heading>
        <Label muted>
          Integração desabilitada. A assistência de IA será disponibilizada em uma etapa posterior,
          com contexto autorizado e revisão profissional.
        </Label>
      </Card>
    </>
  );
}
