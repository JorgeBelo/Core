import React, { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Choice, Field, Heading, Label, Loading, Notice } from '@core/ui';
import { formatBRL, statusLabels, type FinanceStatus } from '@core/domain';
import { readableFinanceError } from '@core/api-client';
import { financeRepository } from '../lib/backend';
import { useSession } from '../lib/session';
import { FinanceModal, EntryForm } from './FinanceForms';
export function FinanceEntries({ direction }: { direction: 'receivable' | 'payable' }) {
  const { professional } = useSession();
  const [page, setPage] = useState(0),
    [search, setSearch] = useState(''),
    [term, setTerm] = useState(''),
    [status, setStatus] = useState<FinanceStatus | 'all'>('all'),
    [create, setCreate] = useState(false);
  const params = useLocalSearchParams<{ contractId?: string }>();
  const q = useQuery({
    queryKey: ['finance', professional?.id, direction, page, status, term, params.contractId],
    queryFn: () => financeRepository!.entries(direction, page, status, term, params.contractId),
    enabled: !!professional,
  });
  return (
    <>
      <View style={{ gap: 12 }}>
        <Heading level={2}>
          {direction === 'receivable' ? 'Contas a receber' : 'Contas a pagar'}
        </Heading>
        <Button onPress={() => setCreate(true)}>
          ＋ {direction === 'receivable' ? 'Nova cobrança prevista' : 'Nova despesa prevista'}
        </Button>
      </View>
      {params.contractId && <Notice>Exibindo as parcelas do contrato selecionado.</Notice>}
      <Card>
        <Field
          label="Buscar descrição"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => {
            setTerm(search);
            setPage(0);
          }}
        />
        <Button
          secondary
          onPress={() => {
            setTerm(search);
            setPage(0);
          }}
        >
          Buscar contas
        </Button>
        <Choice
          label="Situação"
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(0);
          }}
          options={[
            { value: 'all', label: 'Todas' },
            ...Object.entries(statusLabels).map(([value, label]) => ({
              value: value as FinanceStatus,
              label,
            })),
          ]}
        />
      </Card>
      {q.isPending ? (
        <Loading />
      ) : q.error ? (
        <>
          <Notice error>{readableFinanceError(q.error)}</Notice>
          <Button secondary onPress={() => q.refetch()}>
            Tentar novamente
          </Button>
        </>
      ) : (
        <>
          <Label muted>{q.data.count} conta(s)</Label>
          {q.data.items.length ? (
            q.data.items.map((e) => (
              <Card key={e.id}>
                <View style={{ gap: 6 }}>
                  <Heading level={3}>{e.description}</Heading>
                  <Label muted>{e.student_name || e.category}</Label>
                  <Label>
                    {statusLabels[e.status]} · Vencimento:{' '}
                    {e.due_date.split('-').reverse().join('/')}
                  </Label>
                </View>
                <Label>
                  Total: {formatBRL(e.total_cents)} ·{' '}
                  {direction === 'receivable' ? 'Recebido' : 'Pago'}: {formatBRL(e.settled_cents)}
                </Label>
                <Heading level={3}>Saldo: {formatBRL(e.balance_cents)}</Heading>
                <Button secondary onPress={() => router.push(`/finance/entries/${e.id}`)}>
                  Abrir conta
                </Button>
              </Card>
            ))
          ) : (
            <Card>
              <Heading level={2}>Nenhuma conta encontrada</Heading>
              <Label muted>
                Cadastre uma conta prevista ou gere parcelas a partir de um contrato. Isso não
                registra pagamentos.
              </Label>
            </Card>
          )}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
            <Button secondary disabled={page === 0} onPress={() => setPage((v) => v - 1)}>
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
        visible={create}
        title={direction === 'receivable' ? 'Nova conta a receber' : 'Nova conta a pagar'}
        onClose={() => setCreate(false)}
      >
        {create && (
          <EntryForm
            direction={direction}
            onClose={() => setCreate(false)}
            onDone={(id) => {
              setCreate(false);
              router.push(`/finance/entries/${id}`);
            }}
          />
        )}
      </FinanceModal>
    </>
  );
}
