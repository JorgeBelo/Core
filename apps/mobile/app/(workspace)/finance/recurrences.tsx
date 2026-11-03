import React, { useState } from 'react';
import { View } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Choice, Field, Heading, Label, Loading, Notice } from '@core/ui';
import {
  formatBRL,
  parseBRL,
  localDate,
  recurrenceSchema,
  financeDate,
  type RecurrenceInput,
} from '@core/domain';
import { readableFinanceError } from '@core/api-client';
import { financeRepository } from '../../../src/lib/backend';
import { useSession } from '../../../src/lib/session';
import { FinanceModal, useFinanceBusy } from '../../../src/components/FinanceForms';
function CreateRecurrence({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const { professional } = useSession();
  const cache = useQueryClient();
  const [input, setInput] = useState<RecurrenceInput>({
      direction: 'payable',
      student_id: null,
      description: '',
      amount_cents: 0,
      category: 'Outras despesas',
      first_due_date: localDate(),
      interval_months: 1,
      ends_on: null,
    }),
    [amount, setAmount] = useState(''),
    [error, setError] = useState('');
  const save = useMutation({
    mutationFn: (v: RecurrenceInput) => financeRepository!.createRecurrence(v, professional!.id),
    onSuccess: async () => {
      await cache.invalidateQueries({ queryKey: ['finance-recurrences'] });
      onDone();
    },
  });
  useFinanceBusy(save.isPending);
  return (
    <>
      <Choice
        label="Tipo de previsão"
        value={input.direction}
        onChange={(v) => setInput((f) => ({ ...f, direction: v }))}
        options={[
          { value: 'payable', label: 'Despesa recorrente' },
          { value: 'receivable', label: 'Receita recorrente avulsa' },
        ]}
      />
      <Field
        label="Descrição da recorrência"
        value={input.description}
        onChangeText={(v) => setInput((f) => ({ ...f, description: v }))}
      />
      <Field
        label="Valor por ocorrência em reais"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
      />
      <Field
        label="Categoria"
        value={input.category}
        onChangeText={(v) => setInput((f) => ({ ...f, category: v }))}
      />
      <Field
        label="Primeiro vencimento (AAAA-MM-DD)"
        value={input.first_due_date}
        onChangeText={(v) => setInput((f) => ({ ...f, first_due_date: v }))}
      />
      <Field
        label="Intervalo em meses"
        value={String(input.interval_months)}
        keyboardType="number-pad"
        onChangeText={(v) => setInput((f) => ({ ...f, interval_months: Number(v) }))}
      />
      <Field
        label="Fim opcional (AAAA-MM-DD)"
        value={input.ends_on ?? ''}
        onChangeText={(v) => setInput((f) => ({ ...f, ends_on: v || null }))}
      />
      <Notice>
        Salvar a recorrência não gera pagamentos. Você escolhe depois até que data criar as contas
        previstas.
      </Notice>
      {error && <Notice error>{error}</Notice>}
      {save.error && <Notice error>{readableFinanceError(save.error)}</Notice>}
      <Button
        loading={save.isPending}
        onPress={() => {
          try {
            const v = recurrenceSchema.safeParse({ ...input, amount_cents: parseBRL(amount) });
            if (!v.success) throw new Error('Confira a descrição, categoria, datas e intervalo.');
            setError('');
            save.mutate(v.data);
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      >
        Salvar recorrência
      </Button>
      <Button secondary disabled={save.isPending} onPress={onClose}>
        Cancelar
      </Button>
    </>
  );
}
export default function Recurrences() {
  const { professional } = useSession();
  const cache = useQueryClient();
  const [page, setPage] = useState(0),
    [create, setCreate] = useState(false),
    [until, setUntil] = useState(localDate()),
    [message, setMessage] = useState(''),
    [error, setError] = useState('');
  const q = useQuery({
    queryKey: ['finance-recurrences', professional?.id, page],
    queryFn: () => financeRepository!.recurrences(page),
    enabled: !!professional,
  });
  const generate = useMutation({
    mutationFn: (id: string) => financeRepository!.generate(id, until),
    onSuccess: async (count) => {
      await Promise.all([
        cache.invalidateQueries({ queryKey: ['finance-recurrences'] }),
        cache.invalidateQueries({ queryKey: ['finance'] }),
        cache.invalidateQueries({ queryKey: ['finance-report'] }),
      ]);
      setMessage(`${count} conta(s) prevista(s) gerada(s), sem confirmar pagamentos.`);
    },
  });
  const pause = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      financeRepository!.pauseRecurrence(id, active),
    onSuccess: async () => {
      await cache.invalidateQueries({ queryKey: ['finance-recurrences'] });
    },
  });
  return (
    <>
      <Heading level={2}>Recorrências previstas</Heading>
      <Button onPress={() => setCreate(true)}>＋ Nova recorrência</Button>
      <Card>
        <Field label="Gerar vencimentos até (AAAA-MM-DD)" value={until} onChangeText={setUntil} />
        <Label muted>
          Até 60 ocorrências por operação e horizonte máximo de dois anos. Nenhuma geração confirma
          recebimentos ou despesas pagas.
        </Label>
      </Card>
      {message && <Notice>{message}</Notice>}
      {error && <Notice error>{error}</Notice>}
      {(generate.error || pause.error) && (
        <Notice error>{readableFinanceError(generate.error || pause.error)}</Notice>
      )}
      {q.isPending ? (
        <Loading />
      ) : q.error ? (
        <Notice error>{readableFinanceError(q.error)}</Notice>
      ) : (
        <>
          {q.data.items.length ? (
            q.data.items.map((r) => (
              <Card key={r.id}>
                <Heading level={3}>{r.description}</Heading>
                <Label>
                  {r.direction === 'payable' ? 'Despesa' : 'Receita'} · {formatBRL(r.amount_cents)}{' '}
                  · A cada {r.interval_months} mês(es)
                </Label>
                <Label muted>
                  {r.active ? 'Ativa' : 'Pausada'} · {r.generated_count} ocorrência(s) já gerada(s)
                </Label>
                <Button
                  disabled={!r.active}
                  loading={generate.isPending && generate.variables === r.id}
                  onPress={() => {
                    if (!financeDate.safeParse(until).success) {
                      setError('Informe uma data válida.');
                      return;
                    }
                    setError('');
                    generate.mutate(r.id);
                  }}
                >
                  Gerar contas previstas
                </Button>
                <Button
                  secondary
                  disabled={pause.isPending || generate.isPending}
                  onPress={() => pause.mutate({ id: r.id, active: !r.active })}
                >
                  {r.active ? 'Pausar recorrência' : 'Reativar recorrência'}
                </Button>
              </Card>
            ))
          ) : (
            <Card>
              <Heading level={2}>Organize despesas fixas e previsões</Heading>
              <Label muted>
                Cadastre recorrências para academia, software, transporte ou outras categorias do
                seu trabalho.
              </Label>
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
      <FinanceModal visible={create} title="Nova recorrência" onClose={() => setCreate(false)}>
        {create && (
          <CreateRecurrence
            onClose={() => setCreate(false)}
            onDone={() => {
              setCreate(false);
              setMessage('Recorrência salva. Gere as contas quando desejar.');
            }}
          />
        )}
      </FinanceModal>
    </>
  );
}
