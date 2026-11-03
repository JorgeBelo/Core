import React, { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { Button, Card, Choice, Field, Heading, Label, Loading, Notice } from '@core/ui';
import {
  formatBRL,
  centsInput,
  parseBRL,
  localDate,
  financeDate,
  statusLabels,
  paymentMethods,
  type FinanceEntry,
  type FinancePayment,
} from '@core/domain';
import { readableFinanceError } from '@core/api-client';
import { financeRepository } from '../../../../src/lib/backend';
import { FinanceModal, EntryForm, useFinanceBusy } from '../../../../src/components/FinanceForms';
type Action = {
  type: 'payment' | 'reverse' | 'adjust' | 'cancel' | 'dispute' | 'resolve';
  payment?: FinancePayment;
  key: string;
};
function ActionForm({
  entry,
  action,
  onDone,
  onClose,
}: {
  entry: FinanceEntry;
  action: Action;
  onDone: () => void;
  onClose: () => void;
}) {
  const cache = useQueryClient();
  const [amount, setAmount] = useState(
      action.type === 'payment' ? centsInput(entry.balance_cents) : '',
    ),
    [date, setDate] = useState(localDate()),
    [method, setMethod] = useState<keyof typeof paymentMethods>('pix'),
    [reason, setReason] = useState(''),
    [kind, setKind] = useState<'discount' | 'fee' | 'interest'>('discount'),
    [error, setError] = useState('');
  const mutation = useMutation({
    mutationFn: async () => {
      if (action.type === 'payment')
        return financeRepository!.payment(
          entry.id,
          parseBRL(amount),
          date,
          method,
          reason,
          action.key,
        );
      if (action.type === 'reverse')
        return financeRepository!.reverse(action.payment!.id, date, reason, action.key);
      if (action.type === 'adjust')
        return financeRepository!.adjust(entry.id, kind, parseBRL(amount), reason, action.key);
      return financeRepository!.state(entry.id, action.type, reason);
    },
    onSuccess: async () => {
      await Promise.all([
        cache.invalidateQueries({ queryKey: ['finance'] }),
        cache.invalidateQueries({ queryKey: ['finance-report'] }),
        cache.invalidateQueries({ queryKey: ['finance-entry', entry.id] }),
        cache.invalidateQueries({ queryKey: ['finance-ledger', entry.id] }),
      ]);
      onDone();
    },
  });
  useFinanceBusy(mutation.isPending);
  function submit() {
    try {
      if (['payment', 'reverse'].includes(action.type) && !financeDate.safeParse(date).success)
        throw new Error('Informe uma data válida.');
      if (['payment', 'adjust'].includes(action.type)) parseBRL(amount);
      if (action.type !== 'payment' && reason.trim().length < 3)
        throw new Error('Informe uma justificativa com pelo menos 3 caracteres.');
      setError('');
      mutation.mutate();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  const title =
    action.type === 'payment'
      ? entry.direction === 'receivable'
        ? 'Confirmar recebimento'
        : 'Confirmar pagamento'
      : action.type === 'reverse'
        ? 'Registrar estorno integral'
        : action.type === 'adjust'
          ? 'Registrar ajuste'
          : action.type === 'cancel'
            ? 'Cancelar conta prevista'
            : action.type === 'dispute'
              ? 'Registrar contestação'
              : 'Resolver contestação';
  return (
    <>
      {error && <Notice error>{error}</Notice>}
      {mutation.error && <Notice error>{readableFinanceError(mutation.error)}</Notice>}
      <Label>{entry.description}</Label>
      {action.type === 'payment' && (
        <Notice>
          Confirme somente valores efetivamente{' '}
          {entry.direction === 'receivable' ? 'recebidos' : 'pagos'}. Este registro não movimenta
          dinheiro nem realiza cobrança bancária.
        </Notice>
      )}
      {action.type === 'reverse' && (
        <Notice>
          Será registrado o estorno integral de {formatBRL(action.payment!.amount_cents)}. O
          pagamento original permanecerá no histórico.
        </Notice>
      )}
      {action.type === 'cancel' && (
        <Notice>
          A conta permanece no histórico. Para cancelar uma conta com valor liquidado, primeiro
          registre os estornos correspondentes.
        </Notice>
      )}
      {['payment', 'adjust'].includes(action.type) && (
        <Field
          label="Valor em reais *"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="100,00"
        />
      )}
      {action.type === 'adjust' && (
        <Choice
          label="Tipo de ajuste"
          value={kind}
          onChange={setKind}
          options={[
            { value: 'discount', label: 'Desconto' },
            { value: 'fee', label: 'Multa / acréscimo' },
            { value: 'interest', label: 'Juros' },
          ]}
        />
      )}
      {['payment', 'reverse'].includes(action.type) && (
        <Field label="Data efetiva (AAAA-MM-DD) *" value={date} onChangeText={setDate} />
      )}
      {action.type === 'payment' && (
        <Choice
          label="Método informado"
          value={method}
          onChange={setMethod}
          options={Object.entries(paymentMethods).map(([value, label]) => ({
            value: value as keyof typeof paymentMethods,
            label,
          }))}
        />
      )}
      <Field
        label={
          action.type === 'payment' ? 'Observação / referência do comprovante' : 'Justificativa *'
        }
        value={reason}
        onChangeText={setReason}
        multiline
        maxLength={1000}
      />
      <Button onPress={submit} loading={mutation.isPending}>
        {title}
      </Button>
      <Button secondary disabled={mutation.isPending} onPress={onClose}>
        Voltar sem registrar
      </Button>
    </>
  );
}
export default function EntryDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const cache = useQueryClient();
  const [action, setAction] = useState<Action | null>(null),
    [edit, setEdit] = useState(false),
    [message, setMessage] = useState('');
  const q = useQuery({
    queryKey: ['finance-entry', id],
    queryFn: () => financeRepository!.entry(id),
  });
  const ledger = useQuery({
    queryKey: ['finance-ledger', id],
    queryFn: () => financeRepository!.ledger(id),
    enabled: !!q.data,
  });
  if (q.isPending) return <Loading />;
  if (q.error)
    return (
      <>
        <Notice error>{readableFinanceError(q.error)}</Notice>
        <Button secondary onPress={() => q.refetch()}>
          Tentar novamente
        </Button>
      </>
    );
  const e = q.data;
  function open(type: Action['type'], payment?: FinancePayment) {
    setMessage('');
    setAction({ type, payment, key: Crypto.randomUUID() });
  }
  const reversed = new Set(
    ledger.data?.payments.filter((p) => p.reverses_id).map((p) => p.reverses_id),
  );
  return (
    <>
      <Button
        secondary
        onPress={() =>
          router.push(e.direction === 'receivable' ? '/finance/receivables' : '/finance/payables')
        }
      >
        Voltar para contas
      </Button>
      <Heading level={2}>{e.description}</Heading>
      {message && <Notice>{message}</Notice>}
      <Card>
        <Label>
          {e.direction === 'receivable' ? 'A receber' : 'A pagar'} · {statusLabels[e.status]}
        </Label>
        <Label muted>{e.student_name || e.category}</Label>
        <Label>
          Vencimento: {e.due_date.split('-').reverse().join('/')} · Competência:{' '}
          {e.competence_date.split('-').reverse().join('/')}
        </Label>
        <Label>
          Valor original: {formatBRL(e.amount_cents)} · Ajustes: {formatBRL(e.adjustment_cents)}
        </Label>
        <Label>Total atualizado: {formatBRL(e.total_cents)}</Label>
        <Label>
          {e.direction === 'receivable' ? 'Recebido' : 'Pago'}: {formatBRL(e.settled_cents)}
        </Label>
        <Heading level={2}>Saldo em aberto: {formatBRL(e.balance_cents)}</Heading>
        {e.status !== 'cancelled' && (
          <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
            <Button disabled={e.balance_cents <= 0 || e.disputed} onPress={() => open('payment')}>
              {e.direction === 'receivable' ? 'Registrar recebimento' : 'Registrar pagamento'}
            </Button>
            <Button secondary onPress={() => setEdit(true)}>
              Editar descrição e datas
            </Button>
            <Button secondary onPress={() => open('adjust')}>
              Desconto, multa ou juros
            </Button>
            <Button secondary onPress={() => open(e.disputed ? 'resolve' : 'dispute')}>
              {e.disputed ? 'Resolver contestação' : 'Contestar conta'}
            </Button>
            <Button secondary onPress={() => open('cancel')}>
              Cancelar conta
            </Button>
          </View>
        )}
      </Card>
      <Card>
        <Heading level={2}>Histórico de confirmações e estornos</Heading>
        {ledger.isPending ? (
          <Loading />
        ) : ledger.error ? (
          <>
            <Notice error>{readableFinanceError(ledger.error)}</Notice>
            <Button secondary onPress={() => ledger.refetch()}>
              Atualizar histórico
            </Button>
          </>
        ) : ledger.data.payments.length ? (
          ledger.data.payments.map((p) => (
            <View
              key={p.id}
              style={{ gap: 8, borderTopWidth: 1, borderColor: '#34343B', paddingTop: 14 }}
            >
              <Heading level={3}>
                {p.amount_cents < 0 ? 'Estorno' : 'Confirmação'} · {formatBRL(p.amount_cents)}
              </Heading>
              <Label muted>
                {p.effective_date.split('-').reverse().join('/')} · {paymentMethods[p.method]}
              </Label>
              {!!p.note && <Label>{p.note}</Label>}
              {p.amount_cents > 0 && !reversed.has(p.id) && (
                <Button secondary onPress={() => open('reverse', p)}>
                  Estornar este registro
                </Button>
              )}
            </View>
          ))
        ) : (
          <Label muted>Nenhum valor foi confirmado nesta conta.</Label>
        )}
      </Card>
      {!!ledger.data?.adjustments.length && (
        <Card>
          <Heading level={2}>Ajustes do título</Heading>
          {ledger.data.adjustments.map((a) => (
            <View key={a.id} style={{ gap: 5 }}>
              <Label>
                {a.kind === 'discount'
                  ? 'Desconto'
                  : a.kind === 'interest'
                    ? 'Juros'
                    : 'Multa / acréscimo'}{' '}
                · {formatBRL(a.amount_cents)}
              </Label>
              <Label muted>{a.reason}</Label>
            </View>
          ))}
        </Card>
      )}
      {!!ledger.data?.events.length && (
        <Card>
          <Heading level={2}>Alterações e justificativas</Heading>
          {ledger.data.events.map((v) => (
            <View key={v.id} style={{ gap: 5, paddingVertical: 8 }}>
              <Label>
                {v.action === 'edit'
                  ? 'Cadastro atualizado'
                  : v.action === 'cancel'
                    ? 'Cancelamento'
                    : v.action === 'dispute'
                      ? 'Contestação'
                      : 'Resolução de contestação'}{' '}
                · {new Date(v.created_at).toLocaleString('pt-BR')}
              </Label>
              {!!v.reason && <Label muted>{v.reason}</Label>}
              {v.previous_values && v.current_values && (
                <>
                  {v.previous_values.description !== v.current_values.description && (
                    <Label muted>Descrição anterior: {String(v.previous_values.description)}</Label>
                  )}
                  {v.previous_values.due_date !== v.current_values.due_date && (
                    <Label muted>
                      Vencimento: {String(v.previous_values.due_date)} →{' '}
                      {String(v.current_values.due_date)}
                    </Label>
                  )}
                </>
              )}
            </View>
          ))}
        </Card>
      )}
      <FinanceModal
        visible={!!action}
        title="Registrar movimento financeiro"
        onClose={() => setAction(null)}
      >
        {action && (
          <ActionForm
            key={action.key}
            entry={e}
            action={action}
            onClose={() => setAction(null)}
            onDone={() => {
              setAction(null);
              setMessage('Operação financeira registrada. Os saldos foram atualizados.');
            }}
          />
        )}
      </FinanceModal>
      <FinanceModal visible={edit} title="Editar conta prevista" onClose={() => setEdit(false)}>
        {edit && (
          <EntryForm
            direction={e.direction}
            existing={e}
            onClose={() => setEdit(false)}
            onDone={async () => {
              await cache.invalidateQueries({ queryKey: ['finance-entry', id] });
              await cache.invalidateQueries({ queryKey: ['finance-ledger', id] });
              setEdit(false);
              setMessage('Dados da conta atualizados. O histórico foi preservado.');
            }}
          />
        )}
      </FinanceModal>
    </>
  );
}
