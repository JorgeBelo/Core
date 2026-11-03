import React, { useState, createContext, useContext, useEffect } from 'react';
import * as Crypto from 'expo-crypto';
import { Modal, View, ScrollView } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Choice, Field, Heading, Label, Notice } from '@core/ui';
import {
  entrySchema,
  planSchema,
  localDate,
  parseBRL,
  centsInput,
  type FinanceEntry,
  type EntryInput,
  type CommercialPlan,
  type PlanInput,
  type Student,
} from '@core/domain';
import { readableFinanceError } from '@core/api-client';
import { financeRepository } from '../lib/backend';
import { useSession } from '../lib/session';
import { RecordPicker } from './RecordPicker';
const BusyContext = createContext<(busy: boolean) => void>(() => {});
export function useFinanceBusy(busy: boolean) {
  const setBusy = useContext(BusyContext);
  useEffect(() => {
    setBusy(busy);
    return () => setBusy(false);
  }, [busy, setBusy]);
}
export function FinanceModal({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => {
        if (!busy) onClose();
      }}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: '#000B',
          padding: 20,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Card style={{ width: '100%', maxWidth: 740, maxHeight: '94%' }}>
          <Heading level={2}>{title}</Heading>
          <ScrollView
            contentContainerStyle={{ gap: 16, paddingBottom: 10 }}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets
          >
            <BusyContext.Provider value={setBusy}>{children}</BusyContext.Provider>
          </ScrollView>
        </Card>
      </View>
    </Modal>
  );
}
export function EntryForm({
  direction,
  existing,
  onDone,
  onClose,
}: {
  direction: 'receivable' | 'payable';
  existing?: FinanceEntry;
  onDone: (id: string) => void;
  onClose: () => void;
}) {
  const { professional } = useSession();
  const cache = useQueryClient();
  const [creationKey] = useState(() => Crypto.randomUUID());
  const [input, setInput] = useState<EntryInput>(
      existing ?? {
        direction,
        student_id: null,
        description: '',
        amount_cents: 0,
        category: direction === 'receivable' ? 'Serviços' : 'Outras despesas',
        due_date: localDate(),
        competence_date: localDate(),
      },
    ),
    [amount, setAmount] = useState(existing ? centsInput(existing.amount_cents) : ''),
    [studentName, setStudentName] = useState(existing?.student_name ?? ''),
    [pick, setPick] = useState(false),
    [error, setError] = useState('');
  const save = useMutation({
    mutationFn: (v: EntryInput) =>
      financeRepository!.saveEntry(v, professional!.id, existing, creationKey),
    onSuccess: async (row) => {
      await cache.invalidateQueries({ queryKey: ['finance'] });
      await cache.invalidateQueries({ queryKey: ['finance-report'] });
      onDone(row.id);
    },
  });
  useFinanceBusy(save.isPending);
  function submit() {
    try {
      const result = entrySchema.safeParse({ ...input, amount_cents: parseBRL(amount) });
      if (!result.success) throw new Error(result.error.issues.map((v) => v.message).join('\n'));
      setError('');
      save.mutate(result.data);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <>
      {error && <Notice error>{error}</Notice>}
      {save.error && <Notice error>{readableFinanceError(save.error)}</Notice>}
      <Field
        label="Descrição *"
        value={input.description}
        onChangeText={(v) => setInput((f) => ({ ...f, description: v }))}
        maxLength={200}
      />
      <Field
        label="Valor original em reais *"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        placeholder="300,00"
        editable={!existing}
      />
      {existing && (
        <Label muted>
          Para alterar o valor, registre um desconto, multa ou juros no histórico da conta.
        </Label>
      )}
      <Field
        label="Categoria *"
        value={input.category}
        onChangeText={(v) => setInput((f) => ({ ...f, category: v }))}
        maxLength={80}
      />
      <Field
        label="Vencimento (AAAA-MM-DD) *"
        value={input.due_date}
        onChangeText={(v) => setInput((f) => ({ ...f, due_date: v }))}
      />
      <Field
        label="Competência (AAAA-MM-DD) *"
        value={input.competence_date}
        onChangeText={(v) => setInput((f) => ({ ...f, competence_date: v }))}
      />
      {direction === 'receivable' && (
        <>
          <Label>Aluno: {studentName || 'Sem vínculo — receita avulsa'}</Label>
          {!existing && (
            <View style={{ gap: 8 }}>
              <Button secondary onPress={() => setPick(true)}>
                Vincular aluno
              </Button>
              {!!input.student_id && (
                <Button
                  secondary
                  onPress={() => {
                    setInput((f) => ({ ...f, student_id: null }));
                    setStudentName('');
                  }}
                >
                  Remover vínculo
                </Button>
              )}
            </View>
          )}
        </>
      )}
      <Button onPress={submit} loading={save.isPending}>
        {existing ? 'Salvar alterações' : 'Criar conta prevista'}
      </Button>
      <Button secondary disabled={save.isPending} onPress={onClose}>
        Cancelar
      </Button>
      <RecordPicker
        kind="student"
        visible={pick}
        onClose={() => setPick(false)}
        onSelect={(r) => {
          const s = r as Student;
          setInput((f) => ({ ...f, student_id: s.id }));
          setStudentName(s.full_name);
        }}
      />
    </>
  );
}
export function PlanForm({
  existing,
  onDone,
  onClose,
}: {
  existing?: CommercialPlan;
  onDone: () => void;
  onClose: () => void;
}) {
  const { professional } = useSession();
  const cache = useQueryClient();
  const [input, setInput] = useState<PlanInput>(
      existing ?? {
        name: '',
        amount_cents: 0,
        modality: 'Personal presencial',
        frequency: null,
        duration_months: 1,
        terms: '',
        cancellation_notice_hours: 24,
        makeups_per_month: 2,
        makeup_expiry_days: 30,
        active: true,
      },
    ),
    [amount, setAmount] = useState(existing ? centsInput(existing.amount_cents) : ''),
    [details, setDetails] = useState(false),
    [error, setError] = useState('');
  const save = useMutation({
    mutationFn: (v: PlanInput) => financeRepository!.savePlan(v, professional!.id, existing),
    onSuccess: async () => {
      await cache.invalidateQueries({ queryKey: ['finance-plans'] });
      onDone();
    },
  });
  useFinanceBusy(save.isPending);
  function submit() {
    try {
      const v = planSchema.parse({ ...input, amount_cents: parseBRL(amount) });
      setError('');
      save.mutate(v);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <>
      {error && <Notice error>{error}</Notice>}
      {save.error && <Notice error>{readableFinanceError(save.error)}</Notice>}
      <Field
        label="Nome do plano *"
        value={input.name}
        onChangeText={(v) => setInput((f) => ({ ...f, name: v }))}
      />
      <Field
        label="Valor por cobrança em reais *"
        value={amount}
        onChangeText={setAmount}
        placeholder="300,00"
        keyboardType="decimal-pad"
      />
      <Field
        label="Modalidade *"
        value={input.modality}
        onChangeText={(v) => setInput((f) => ({ ...f, modality: v }))}
      />
      <Field
        label="Duração sugerida em meses"
        value={String(input.duration_months)}
        keyboardType="number-pad"
        onChangeText={(v) => setInput((f) => ({ ...f, duration_months: Number(v) }))}
      />
      <Field
        label="Frequência semanal (opcional)"
        value={input.frequency === null ? '' : String(input.frequency)}
        keyboardType="number-pad"
        onChangeText={(v) => setInput((f) => ({ ...f, frequency: v ? Number(v) : null }))}
      />
      <Field
        label="Condições do plano"
        value={input.terms}
        onChangeText={(v) => setInput((f) => ({ ...f, terms: v }))}
        multiline
        maxLength={10000}
      />
      <Button secondary onPress={() => setDetails((v) => !v)}>
        {details ? 'Ocultar regras de reposição' : 'Regras de cancelamento e reposição'}
      </Button>
      {details && (
        <>
          <Field
            label="Antecedência de cancelamento (horas)"
            value={String(input.cancellation_notice_hours)}
            keyboardType="number-pad"
            onChangeText={(v) => setInput((f) => ({ ...f, cancellation_notice_hours: Number(v) }))}
          />
          <Field
            label="Reposições por mês"
            value={String(input.makeups_per_month)}
            keyboardType="number-pad"
            onChangeText={(v) => setInput((f) => ({ ...f, makeups_per_month: Number(v) }))}
          />
          <Field
            label="Validade da reposição (dias)"
            value={String(input.makeup_expiry_days)}
            keyboardType="number-pad"
            onChangeText={(v) => setInput((f) => ({ ...f, makeup_expiry_days: Number(v) }))}
          />
          <Label muted>
            As regras ficam registradas no contrato. A execução delas pela agenda será implementada
            na fase 4.
          </Label>
        </>
      )}
      <Choice
        label="Disponibilidade"
        value={input.active ? 'active' : 'inactive'}
        onChange={(v) => setInput((f) => ({ ...f, active: v === 'active' }))}
        options={[
          { value: 'active', label: 'Ativo' },
          { value: 'inactive', label: 'Arquivado' },
        ]}
      />
      <Button loading={save.isPending} onPress={submit}>
        Salvar plano
      </Button>
      <Button secondary disabled={save.isPending} onPress={onClose}>
        Cancelar
      </Button>
    </>
  );
}
