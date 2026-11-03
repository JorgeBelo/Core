import React, { useState } from 'react';
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Heading, Label, Loading, Notice } from '@core/ui';
import { formatBRL, statusLabels, paymentMethods } from '@core/domain';
import { readableFinanceError } from '@core/api-client';
import { financeRepository } from '../lib/backend';

const date = (value: string) => value.split('-').reverse().join('/');
export function StudentFinance({ studentId, onBack }: { studentId: string; onBack: () => void }) {
  const [page, setPage] = useState(0),
    [selected, setSelected] = useState<string | null>(null);
  const entries = useQuery({
    queryKey: ['student-finance', studentId, page],
    queryFn: () => financeRepository!.studentEntries(studentId, page),
  });
  const ledger = useQuery({
    queryKey: ['student-finance-ledger', studentId, selected],
    queryFn: () => financeRepository!.ledger(selected!, false),
    enabled: !!selected,
  });
  return (
    <>
      <Button secondary onPress={onBack}>
        Voltar ao início
      </Button>
      <Heading>Meu financeiro</Heading>
      <Label muted>Consulte suas cobranças e as confirmações registradas pelo seu personal.</Label>
      {entries.isPending ? (
        <Loading />
      ) : entries.error ? (
        <>
          <Notice error>{readableFinanceError(entries.error)}</Notice>
          <Button secondary onPress={() => entries.refetch()}>
            Tentar novamente
          </Button>
        </>
      ) : (
        <>
          {!entries.data.items.length && (
            <Card>
              <Heading level={2}>Nenhuma cobrança registrada</Heading>
              <Label muted>As cobranças do seu acompanhamento aparecerão aqui.</Label>
            </Card>
          )}
          {entries.data.items.map((e) => (
            <Card key={e.id}>
              <Heading level={2}>{e.description}</Heading>
              <Label>
                {statusLabels[e.status]} · Vencimento: {date(e.due_date)}
              </Label>
              <Label>Total atualizado: {formatBRL(e.total_cents)}</Label>
              <Label>Recebimentos líquidos: {formatBRL(e.settled_cents)}</Label>
              <Label>
                {e.status === 'cancelled'
                  ? 'Cobrança cancelada'
                  : `Saldo em aberto: ${formatBRL(e.balance_cents)}`}
              </Label>
              <Button secondary onPress={() => setSelected(selected === e.id ? null : e.id)}>
                {selected === e.id ? 'Ocultar movimentações' : 'Ver movimentações'}
              </Button>
              {selected === e.id &&
                (ledger.isPending ? (
                  <Loading />
                ) : ledger.error ? (
                  <>
                    <Notice error>{readableFinanceError(ledger.error)}</Notice>
                    <Button secondary onPress={() => ledger.refetch()}>
                      Tentar carregar movimentações
                    </Button>
                  </>
                ) : (
                  <>
                    <Heading level={3}>Movimentações da cobrança</Heading>
                    {!ledger.data.payments.length && (
                      <Label muted>Nenhum recebimento confirmado.</Label>
                    )}
                    {ledger.data.payments.map((p) => (
                      <View key={p.id} style={{ gap: 5 }}>
                        <Label>
                          {p.reverses_id ? 'Estorno' : 'Recebimento'}: {formatBRL(p.amount_cents)}
                        </Label>
                        <Label muted>
                          {date(p.effective_date)} · {paymentMethods[p.method]}
                        </Label>
                      </View>
                    ))}
                    {ledger.data.adjustments.map((a) => (
                      <View key={a.id} style={{ gap: 5 }}>
                        <Label>
                          {a.kind === 'discount'
                            ? 'Desconto'
                            : a.kind === 'fee'
                              ? 'Multa'
                              : 'Juros'}
                          : {formatBRL(a.amount_cents)}
                        </Label>
                        <Label muted>{a.reason}</Label>
                      </View>
                    ))}
                  </>
                ))}
            </Card>
          ))}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
            <Button
              secondary
              disabled={!page}
              onPress={() => {
                setSelected(null);
                setPage((v) => v - 1);
              }}
            >
              Anteriores
            </Button>
            <Button
              secondary
              disabled={(page + 1) * 20 >= entries.data.count}
              onPress={() => {
                setSelected(null);
                setPage((v) => v + 1);
              }}
            >
              Próximas
            </Button>
          </View>
        </>
      )}
    </>
  );
}
