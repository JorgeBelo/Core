import React, { useState } from 'react';
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Heading, Label, Loading, Notice } from '@core/ui';
import { formatBRL, type CommercialPlan } from '@core/domain';
import { readableFinanceError } from '@core/api-client';
import { financeRepository } from '../../../src/lib/backend';
import { useSession } from '../../../src/lib/session';
import { FinanceModal, PlanForm } from '../../../src/components/FinanceForms';
export default function Plans() {
  const { professional } = useSession();
  const [page, setPage] = useState(0),
    [editor, setEditor] = useState<{ existing?: CommercialPlan } | null>(null);
  const q = useQuery({
    queryKey: ['finance-plans', professional?.id, page],
    queryFn: () => financeRepository!.plans(page),
    enabled: !!professional,
  });
  return (
    <>
      <Heading level={2}>Planos comerciais</Heading>
      <Button onPress={() => setEditor({})}>＋ Novo plano</Button>
      {q.isPending ? (
        <Loading />
      ) : q.error ? (
        <Notice error>{readableFinanceError(q.error)}</Notice>
      ) : (
        <>
          {q.data.items.length ? (
            q.data.items.map((p) => (
              <Card key={p.id}>
                <Heading level={3}>{p.name}</Heading>
                <Label>
                  {formatBRL(p.amount_cents)} por cobrança · {p.modality}
                </Label>
                <Label muted>
                  {p.active ? 'Ativo' : 'Arquivado'} · Duração sugerida: {p.duration_months} mês(es)
                </Label>
                <Button secondary onPress={() => setEditor({ existing: p })}>
                  Editar plano
                </Button>
              </Card>
            ))
          ) : (
            <Card>
              <Heading level={2}>Defina sua oferta de acompanhamento</Heading>
              <Label muted>Crie planos presenciais, online, em dupla ou personalizados.</Label>
            </Card>
          )}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Button secondary disabled={!page} onPress={() => setPage((v) => v - 1)}>
              Anterior
            </Button>
            <Button
              secondary
              disabled={(page + 1) * 20 >= q.data.count}
              onPress={() => setPage((v) => v + 1)}
            >
              Próxima
            </Button>
          </View>
        </>
      )}
      <FinanceModal
        visible={!!editor}
        title={editor?.existing ? 'Editar plano' : 'Novo plano'}
        onClose={() => setEditor(null)}
      >
        {editor && (
          <PlanForm
            existing={editor.existing}
            onClose={() => setEditor(null)}
            onDone={() => setEditor(null)}
          />
        )}
      </FinanceModal>
    </>
  );
}
