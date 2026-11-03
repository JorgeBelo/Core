import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { Button, Card, Choice, Field, Heading, Label, Loading, Notice } from '@core/ui';
import {
  contractSchema,
  formatBRL,
  localDate,
  type ContractInput,
  type CommercialContract,
  type CommercialPlan,
  type Student,
} from '@core/domain';
import { readableFinanceError } from '@core/api-client';
import { financeRepository } from '../../../src/lib/backend';
import { useSession } from '../../../src/lib/session';
import { FinanceModal, useFinanceBusy } from '../../../src/components/FinanceForms';
import { RecordPicker } from '../../../src/components/RecordPicker';
function CreateContract({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const cache = useQueryClient();
  const [key] = useState(() => Crypto.randomUUID());
  const [plan, setPlan] = useState<CommercialPlan | null>(null),
    [planPage, setPlanPage] = useState(0),
    [student, setStudent] = useState<Student | null>(null),
    [pick, setPick] = useState(false),
    [error, setError] = useState(''),
    [review, setReview] = useState(false),
    [input, setInput] = useState<ContractInput>({
      plan_id: '',
      student_id: '',
      starts_on: localDate(),
      ends_on: localDate(),
      first_due_date: localDate(),
      installments: 1,
      interval_months: 1,
    });
  const plans = useQuery({
    queryKey: ['finance-plans', 'contract-picker', planPage],
    queryFn: () => financeRepository!.plans(planPage),
  });
  const save = useMutation({
    mutationFn: () => financeRepository!.createContract(contractSchema.parse(input), key),
    onSuccess: async () => {
      await Promise.all([
        cache.invalidateQueries({ queryKey: ['finance-contracts'] }),
        cache.invalidateQueries({ queryKey: ['finance'] }),
        cache.invalidateQueries({ queryKey: ['finance-report'] }),
      ]);
      onDone();
    },
  });
  useFinanceBusy(save.isPending);
  function validate() {
    const v = contractSchema.safeParse(input);
    if (!v.success) {
      setError(
        'Selecione plano e aluno e confira as datas, a quantidade de parcelas e o intervalo.',
      );
      return;
    }
    setError('');
    setReview(true);
  }
  return (
    <>
      {error && <Notice error>{error}</Notice>}
      {save.error && <Notice error>{readableFinanceError(save.error)}</Notice>}
      {review ? (
        <>
          <Heading level={3}>Revise antes de gerar as parcelas</Heading>
          <Label>
            {student?.full_name} · {plan?.name}
          </Label>
          <Label>
            {input.installments} cobrança(s) de {formatBRL(plan!.amount_cents)}
          </Label>
          <Label>
            Total contratado: {formatBRL(BigInt(plan!.amount_cents) * BigInt(input.installments))}
          </Label>
          <Label>
            Primeiro vencimento: {input.first_due_date} · Intervalo: {input.interval_months} mês(es)
          </Label>
          <Label>
            Vigência: {input.starts_on} a {input.ends_on}
          </Label>
          <Label>{plan?.terms || 'Sem condições adicionais cadastradas.'}</Label>
          <Notice>
            Serão criadas contas previstas, sem confirmar pagamentos. Este é um registro gerencial
            de contrato, sem assinatura eletrônica.
          </Notice>
          <Button loading={save.isPending} onPress={() => save.mutate()}>
            Confirmar contrato e gerar parcelas
          </Button>
          <Button secondary disabled={save.isPending} onPress={() => setReview(false)}>
            Voltar à revisão dos dados
          </Button>
        </>
      ) : (
        <>
          <Heading level={3}>Escolha um plano ativo</Heading>
          {plans.isPending ? (
            <Loading />
          ) : plans.error ? (
            <Notice error>{readableFinanceError(plans.error)}</Notice>
          ) : (
            <>
              {plans.data.items
                .filter((p) => p.active)
                .map((p) => (
                  <Button
                    key={p.id}
                    secondary={plan?.id !== p.id}
                    onPress={() => {
                      setPlan(p);
                      setInput((v) => ({ ...v, plan_id: p.id }));
                    }}
                  >
                    {p.name} · {formatBRL(p.amount_cents)} por parcela
                  </Button>
                ))}
              <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'space-between' }}>
                <Button secondary disabled={!planPage} onPress={() => setPlanPage((v) => v - 1)}>
                  Planos anteriores
                </Button>
                <Button
                  secondary
                  disabled={(planPage + 1) * 20 >= plans.data.count}
                  onPress={() => setPlanPage((v) => v + 1)}
                >
                  Mais planos
                </Button>
              </View>
              {!plans.data.items.length && (
                <Label muted>Cadastre um plano na seção Planos antes de criar o contrato.</Label>
              )}
            </>
          )}
          <Label>Aluno: {student?.full_name || 'Não selecionado'}</Label>
          <Button secondary onPress={() => setPick(true)}>
            Selecionar aluno do contrato
          </Button>
          <Field
            label="Início da vigência (AAAA-MM-DD)"
            value={input.starts_on}
            onChangeText={(v) => setInput((f) => ({ ...f, starts_on: v }))}
          />
          <Field
            label="Fim da vigência (AAAA-MM-DD)"
            value={input.ends_on}
            onChangeText={(v) => setInput((f) => ({ ...f, ends_on: v }))}
          />
          <Field
            label="Primeiro vencimento (AAAA-MM-DD)"
            value={input.first_due_date}
            onChangeText={(v) => setInput((f) => ({ ...f, first_due_date: v }))}
          />
          <Field
            label="Quantidade de parcelas"
            value={String(input.installments)}
            keyboardType="number-pad"
            onChangeText={(v) => setInput((f) => ({ ...f, installments: Number(v) }))}
          />
          <Field
            label="Intervalo entre parcelas em meses"
            value={String(input.interval_months)}
            keyboardType="number-pad"
            onChangeText={(v) => setInput((f) => ({ ...f, interval_months: Number(v) }))}
          />
          <Button onPress={validate}>Revisar contrato</Button>
        </>
      )}
      <Button secondary disabled={save.isPending} onPress={onClose}>
        Cancelar
      </Button>
      <RecordPicker
        kind="student"
        visible={pick}
        onClose={() => setPick(false)}
        onSelect={(r) => {
          const s = r as Student;
          setStudent(s);
          setInput((f) => ({ ...f, student_id: s.id }));
        }}
      />
    </>
  );
}
function CancelContract({
  contract,
  onClose,
  onDone,
}: {
  contract: CommercialContract;
  onClose: () => void;
  onDone: () => void;
}) {
  const cache = useQueryClient();
  const [reason, setReason] = useState(''),
    [cancelUnpaid, setCancelUnpaid] = useState(true),
    [error, setError] = useState('');
  const cancel = useMutation({
    mutationFn: () => financeRepository!.cancelContract(contract.id, reason, cancelUnpaid),
    onSuccess: async () => {
      await Promise.all([
        cache.invalidateQueries({ queryKey: ['finance-contracts'] }),
        cache.invalidateQueries({ queryKey: ['finance'] }),
        cache.invalidateQueries({ queryKey: ['finance-report'] }),
      ]);
      onDone();
    },
  });
  useFinanceBusy(cancel.isPending);
  return (
    <>
      <Label>
        {contract.snapshot.name} · {contract.student_name}
      </Label>
      <Notice>
        Parcelas já pagas ou parcialmente pagas permanecem no histórico e não são estornadas
        automaticamente.
      </Notice>
      <Choice
        label="Contas sem pagamentos líquidos"
        value={cancelUnpaid ? 'cancel' : 'keep'}
        onChange={(v) => setCancelUnpaid(v === 'cancel')}
        options={[
          { value: 'cancel', label: 'Cancelar também' },
          { value: 'keep', label: 'Manter a receber' },
        ]}
      />
      <Field
        label="Justificativa do cancelamento"
        value={reason}
        onChangeText={setReason}
        multiline
        maxLength={1000}
      />
      {error && <Notice error>{error}</Notice>}
      {cancel.error && <Notice error>{readableFinanceError(cancel.error)}</Notice>}
      <Button
        loading={cancel.isPending}
        onPress={() => {
          if (reason.trim().length < 3) {
            setError('Informe a justificativa.');
            return;
          }
          cancel.mutate();
        }}
      >
        Confirmar cancelamento do contrato
      </Button>
      <Button secondary disabled={cancel.isPending} onPress={onClose}>
        Voltar sem cancelar
      </Button>
    </>
  );
}
export default function Contracts() {
  const { professional } = useSession();
  const [page, setPage] = useState(0),
    [create, setCreate] = useState(false),
    [cancel, setCancel] = useState<CommercialContract | null>(null),
    [message, setMessage] = useState('');
  const q = useQuery({
    queryKey: ['finance-contracts', professional?.id, page],
    queryFn: () => financeRepository!.contracts(page),
    enabled: !!professional,
  });
  return (
    <>
      <Heading level={2}>Contratos e parcelas</Heading>
      {message && <Notice>{message}</Notice>}
      <Button onPress={() => setCreate(true)}>＋ Novo contrato</Button>
      {q.isPending ? (
        <Loading />
      ) : q.error ? (
        <Notice error>{readableFinanceError(q.error)}</Notice>
      ) : (
        <>
          {q.data.items.length ? (
            q.data.items.map((c) => (
              <Card key={c.id}>
                <Heading level={3}>{c.snapshot.name}</Heading>
                <Label>{c.student_name}</Label>
                <Label>
                  {c.installments} × {formatBRL(c.snapshot.amount_cents)} ·{' '}
                  {c.cancelled_at
                    ? 'Cancelado'
                    : c.ends_on < localDate()
                      ? 'Vigência encerrada'
                      : 'Vigente'}
                </Label>
                <Label muted>
                  Vigência: {c.starts_on} a {c.ends_on}
                </Label>
                <Label>{c.snapshot.terms || 'Sem condições adicionais.'}</Label>
                <Label muted>
                  Cancelamento: {c.snapshot.cancellation_notice_hours}h · Até{' '}
                  {c.snapshot.makeups_per_month} reposições/mês · Validade{' '}
                  {c.snapshot.makeup_expiry_days} dias
                </Label>
                <Button
                  secondary
                  onPress={() =>
                    router.push({ pathname: '/finance/receivables', params: { contractId: c.id } })
                  }
                >
                  Ver parcelas do contrato
                </Button>
                {!c.cancelled_at && (
                  <Button secondary onPress={() => setCancel(c)}>
                    Cancelar contrato
                  </Button>
                )}
                {c.cancellation_reason && <Label muted>Motivo: {c.cancellation_reason}</Label>}
              </Card>
            ))
          ) : (
            <Card>
              <Heading level={2}>Nenhum contrato registrado</Heading>
              <Label muted>
                Um contrato preserva as condições do plano e gera as parcelas previstas sob sua
                confirmação.
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
      <FinanceModal visible={create} title="Novo contrato" onClose={() => setCreate(false)}>
        {create && (
          <CreateContract
            onClose={() => setCreate(false)}
            onDone={() => {
              setCreate(false);
              setMessage(
                'Contrato e parcelas previstos registrados. Nenhum pagamento foi confirmado.',
              );
            }}
          />
        )}
      </FinanceModal>
      <FinanceModal visible={!!cancel} title="Cancelar contrato" onClose={() => setCancel(null)}>
        {cancel && (
          <CancelContract
            contract={cancel}
            onClose={() => setCancel(null)}
            onDone={() => {
              setCancel(null);
              setMessage('Contrato cancelado. O histórico financeiro foi preservado.');
            }}
          />
        )}
      </FinanceModal>
    </>
  );
}
