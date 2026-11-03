import React, { useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Choice, Field, Heading, Label, Loading, Notice } from '@core/ui';
import { formatBRL, localDate, periodStart, financeDate } from '@core/domain';
import { readableFinanceError } from '@core/api-client';
import { financeRepository } from '../lib/backend';
import { useSession } from '../lib/session';
export function FinanceReport({ detailed = false }: { detailed?: boolean }) {
  const { professional } = useSession();
  const { width } = useWindowDimensions();
  const today = new Date();
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>(detailed ? 'year' : 'month'),
    [from, setFrom] = useState(periodStart(detailed ? 'year' : 'month')),
    [to, setTo] = useState(
      localDate(
        new Date(today.getFullYear(), detailed ? 11 : today.getMonth() + 1, detailed ? 31 : 0),
      ),
    ),
    [range, setRange] = useState({ from, to }),
    [error, setError] = useState('');
  const q = useQuery({
    queryKey: ['finance-report', professional?.id, range.from, range.to],
    queryFn: () => financeRepository!.report(range.from, range.to),
    enabled: !!professional,
  });
  function preset(v: typeof period) {
    setPeriod(v);
    const start = periodStart(v);
    const end = localDate(
      new Date(
        today.getFullYear(),
        v === 'year'
          ? 11
          : v === 'quarter'
            ? Math.floor(today.getMonth() / 3) * 3 + 3
            : today.getMonth() + 1,
        v === 'year' ? 31 : 0,
      ),
    );
    setFrom(start);
    setTo(end);
    setRange({ from: start, to: end });
    setError('');
  }
  function apply() {
    if (!financeDate.safeParse(from).success || !financeDate.safeParse(to).success || from > to) {
      setError('Informe um intervalo válido de datas.');
      return;
    }
    setRange({ from, to });
    setError('');
  }
  return (
    <>
      <Card>
        <Choice
          label="Período"
          value={period}
          onChange={preset}
          options={[
            { value: 'month', label: 'Mês' },
            { value: 'quarter', label: 'Trimestre' },
            { value: 'year', label: 'Ano' },
          ]}
        />
        <View style={{ flexDirection: width > 700 ? 'row' : 'column', gap: 12 }}>
          <Field label="De (AAAA-MM-DD)" value={from} onChangeText={setFrom} />
          <Field label="Até (AAAA-MM-DD)" value={to} onChangeText={setTo} />
        </View>
        <Button secondary onPress={apply}>
          Aplicar período
        </Button>
      </Card>
      {error && <Notice error>{error}</Notice>}
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
          <Heading level={2}>Caixa confirmado no período</Heading>
          <View style={{ flexDirection: width > 800 ? 'row' : 'column', gap: 14 }}>
            {[
              ['Recebimentos líquidos', q.data.received_cents],
              ['Desembolsos líquidos', q.data.paid_cents],
              ['Resultado de caixa', q.data.cash_result_cents],
            ].map(([label, value]) => (
              <Card key={label} style={{ flex: 1 }}>
                <Label muted>{label}</Label>
                <Heading level={2}>{formatBRL(value)}</Heading>
              </Card>
            ))}
          </View>
          <Label muted style={{ fontSize: 12 }}>
            Somente confirmações manuais e estornos com data no período. Vencimentos não entram
            automaticamente no caixa.
          </Label>
          <Heading level={2}>Saldos em aberto — todos os períodos</Heading>
          <View style={{ flexDirection: width > 800 ? 'row' : 'column', gap: 14 }}>
            {[
              ['A receber', q.data.receivable_cents],
              ['A pagar', q.data.payable_cents],
              ['Recebíveis vencidos', q.data.overdue_cents],
            ].map(([label, value]) => (
              <Card key={label} style={{ flex: 1 }}>
                <Label muted>{label}</Label>
                <Heading level={2}>{formatBRL(value)}</Heading>
              </Card>
            ))}
          </View>
          {detailed && (
            <>
              <Card>
                <Heading level={2}>Resultado por competência</Heading>
                <Label>Receitas: {formatBRL(q.data.revenue_cents)}</Label>
                <Label>Despesas: {formatBRL(q.data.expense_cents)}</Label>
                <Heading level={3}>
                  Resultado gerencial: {formatBRL(q.data.accrual_result_cents)}
                </Heading>
                <Notice>
                  Demonstrativo gerencial baseado na competência informada em cada conta. Não é uma
                  demonstração contábil oficial.
                </Notice>
              </Card>
              <Card>
                <Heading level={2}>Evolução mensal e previsão</Heading>
                <Label muted>
                  Entradas e saídas realizadas no mês. A previsão mostra o saldo atual das contas
                  com vencimento naquele mês.
                </Label>
                {q.data.monthly.map((m) => (
                  <View
                    key={m.month}
                    style={{
                      gap: 6,
                      paddingVertical: 12,
                      borderTopWidth: 1,
                      borderColor: '#34343B',
                    }}
                  >
                    <Heading level={3}>
                      {m.month.slice(5, 7)}/{m.month.slice(0, 4)}
                    </Heading>
                    <Label>
                      Recebido: {formatBRL(m.received_cents)} · Pago: {formatBRL(m.paid_cents)}
                    </Label>
                    <Label muted>
                      Previsto a receber: {formatBRL(m.forecast_receivable_cents)}
                    </Label>
                    <Label muted>Previsto a pagar: {formatBRL(m.forecast_payable_cents)}</Label>
                  </View>
                ))}
              </Card>
              <Card>
                <Heading level={2}>Caixa por categoria</Heading>
                {q.data.by_category.length ? (
                  q.data.by_category.map((c, i) => (
                    <Label key={i}>
                      {c.direction === 'receivable' ? 'Entrada' : 'Saída'} · {c.category}:{' '}
                      {formatBRL(c.amount_cents)}
                    </Label>
                  ))
                ) : (
                  <Label muted>Nenhuma movimentação confirmada neste período.</Label>
                )}
              </Card>
              <Card>
                <Heading level={2}>Recebimentos por aluno</Heading>
                {q.data.by_student.length ? (
                  q.data.by_student.map((s, i) => (
                    <Label key={i}>
                      {s.student_name}: {formatBRL(s.amount_cents)}
                    </Label>
                  ))
                ) : (
                  <Label muted>Nenhum recebimento confirmado neste período.</Label>
                )}
              </Card>
            </>
          )}
        </>
      )}
    </>
  );
}
