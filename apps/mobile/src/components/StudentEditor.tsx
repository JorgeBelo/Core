import React, { useState } from 'react';
import { View, Modal, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Choice, Field, Heading, Label, Notice, colors } from '@core/ui';
import {
  newStudent,
  studentSchema,
  type Student,
  type StudentInput,
  experienceLabels,
  modalityLabels,
  parseBRL,
  centsInput,
  formatBRL,
} from '@core/domain';
import { readableError } from '@core/api-client';
import { repository } from '../lib/backend';
import { useSession } from '../lib/session';
export function StudentEditor({ student }: { student?: Student }) {
  const { professional } = useSession();
  const cache = useQueryClient();
  const { width } = useWindowDimensions();
  const wide = width > 1050;
  const initial: StudentInput = student ?? newStudent();
  const [form, setForm] = useState<StudentInput>(initial),
    [monthlyFee, setMonthlyFee] = useState(
      initial.monthly_fee_cents == null ? '' : centsInput(initial.monthly_fee_cents),
    ),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [section, setSection] = useState<'basic' | 'context'>('basic'),
    [discard, setDiscard] = useState(false);
  const dirty =
    monthlyFee !==
      (initial.monthly_fee_cents == null ? '' : centsInput(initial.monthly_fee_cents)) ||
    Object.keys(newStudent()).some(
      (k) => form[k as keyof StudentInput] !== initial[k as keyof StudentInput],
    );
  const mutation = useMutation({
    mutationFn: (input: StudentInput) => repository!.saveStudent(input, professional!.id, student),
    onSuccess: async () => {
      await Promise.all([
        cache.invalidateQueries({ queryKey: ['students'] }),
        cache.invalidateQueries({ queryKey: ['dashboard'] }),
        cache.invalidateQueries({ queryKey: ['student', student?.id] }),
      ]);
      router.replace({ pathname: '/students', params: { saved: '1' } });
    },
  });
  function change<K extends keyof StudentInput>(key: K, value: StudentInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
  }
  function submit() {
    let monthly_fee_cents: number | null = null;
    try {
      monthly_fee_cents = monthlyFee.trim() ? parseBRL(monthlyFee) : null;
    } catch {
      setErrors({
        monthly_fee_cents: 'Informe uma mensalidade válida, como 300,00, ou deixe em branco.',
      });
      setSection('basic');
      return;
    }
    const parsed = studentSchema.safeParse({ ...form, monthly_fee_cents });
    if (!parsed.success) {
      const err: Record<string, string> = {};
      for (const issue of parsed.error.issues) err[String(issue.path[0])] = issue.message;
      setErrors(err);
      if (['full_name', 'email', 'phone', 'birth_date', 'start_date'].some((k) => err[k]))
        setSection('basic');
      return;
    }
    setErrors({});
    mutation.mutate(parsed.data);
  }
  const field = (key: keyof StudentInput, label: string, extra: any = {}) => (
    <Field
      label={label}
      value={typeof form[key] === 'string' ? (form[key] as string) : ''}
      onChangeText={(value) => change(key, value)}
      error={errors[key]}
      {...extra}
    />
  );
  const cancel = () => {
    if (dirty) setDiscard(true);
    else router.replace('/students');
  };
  let monthlySummary = 'Mensalidade a definir';
  try {
    if (monthlyFee.trim()) monthlySummary = `${formatBRL(parseBRL(monthlyFee))}/mês`;
  } catch {
    monthlySummary = 'Confira o valor da mensalidade';
  }
  return (
    <>
      <View
        style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}
      >
        <View style={{ gap: 7 }}>
          <Label muted style={{ fontSize: 11, letterSpacing: 1.5 }}>
            ALUNOS / {student ? 'CADASTRO' : 'NOVO ALUNO'}
          </Label>
          <Heading>{student ? student.full_name : 'Cada evolução tem um começo.'}</Heading>
          <Label muted>
            {student
              ? 'Atualize os dados e preserve o histórico do acompanhamento.'
              : 'Cadastre os dados essenciais. Você pode complementar depois.'}
          </Label>
        </View>
        <Button secondary disabled={mutation.isPending} onPress={cancel}>
          Voltar para alunos
        </Button>
      </View>
      {mutation.error && <Notice error>{readableError(mutation.error)}</Notice>}
      {Object.values(errors).some(Boolean) && (
        <Notice error>Revise os campos destacados antes de salvar.</Notice>
      )}
      <View style={{ flexDirection: wide ? 'row' : 'column', gap: 20, alignItems: 'flex-start' }}>
        <View style={{ flex: 1, width: '100%', gap: 20 }}>
          <Card>
            <Choice
              label="Seções do cadastro"
              value={section}
              onChange={setSection}
              options={[
                { value: 'basic', label: 'Dados essenciais' },
                { value: 'context', label: 'Contexto e emergência' },
              ]}
            />
            {section === 'basic' ? (
              <>
                <Heading level={2}>Dados essenciais</Heading>
                {field('full_name', 'Nome completo *', {
                  placeholder: 'Nome e sobrenome',
                  autoComplete: 'name',
                  maxLength: 120,
                })}
                {field('email', 'E-mail', {
                  placeholder: 'aluno@email.com',
                  keyboardType: 'email-address',
                  autoCapitalize: 'none',
                  maxLength: 254,
                })}
                {field('phone', 'Telefone', {
                  mask: 'phone',
                  placeholder: '(11) 99999-9999',
                  keyboardType: 'phone-pad',
                  maxLength: 30,
                })}
                <View style={{ flexDirection: wide ? 'row' : 'column', gap: 16 }}>
                  {field('birth_date', 'Nascimento (AAAA-MM-DD)', {
                    placeholder: '1990-05-20',
                    maxLength: 10,
                  })}
                  {field('start_date', 'Início do acompanhamento *', {
                    placeholder: 'AAAA-MM-DD',
                    maxLength: 10,
                  })}
                </View>
                <Choice
                  label="Modalidade"
                  value={form.modality}
                  onChange={(v) => change('modality', v)}
                  options={Object.entries(modalityLabels).map(([value, label]) => ({
                    value: value as StudentInput['modality'],
                    label,
                  }))}
                />
                <Choice
                  label="Tratamento nas mensagens"
                  value={form.gender}
                  onChange={(v) => change('gender', v)}
                  options={[
                    { value: 'female', label: 'Feminino' },
                    { value: 'male', label: 'Masculino' },
                    { value: 'unspecified', label: 'Prefiro não informar' },
                  ]}
                />
                <Choice
                  label="Avisos pelo WhatsApp"
                  value={form.whatsapp_opt_in ? 'yes' : 'no'}
                  onChange={(v) => change('whatsapp_opt_in', v === 'yes')}
                  options={[
                    { value: 'no', label: 'Não autorizado' },
                    { value: 'yes', label: 'Aluno autorizou' },
                  ]}
                />
                <Choice
                  label="Status do acompanhamento"
                  value={form.status}
                  onChange={(v) => change('status', v)}
                  options={[
                    { value: 'active', label: 'Ativo' },
                    { value: 'inactive', label: 'Inativo' },
                  ]}
                />
                <Heading level={3}>Mensalidade e frequência</Heading>
                <Field
                  label="Mensalidade combinada (R$)"
                  mask="brl"
                  placeholder="Ex.: 300,00"
                  keyboardType="decimal-pad"
                  value={monthlyFee}
                  onChangeText={(v) => {
                    setMonthlyFee(v);
                    setErrors((e) => ({ ...e, monthly_fee_cents: '' }));
                  }}
                  error={errors.monthly_fee_cents}
                  maxLength={24}
                />
                <Choice
                  label="Quantas vezes por semana?"
                  value={form.weekly_frequency == null ? '' : String(form.weekly_frequency)}
                  onChange={(v) => change('weekly_frequency', v ? Number(v) : null)}
                  options={[
                    { value: '', label: 'A definir' },
                    ...Array.from({ length: 7 }, (_, i) => ({
                      value: String(i + 1),
                      label: `${i + 1}×`,
                    })),
                  ]}
                />
                <Label muted style={{ fontSize: 12 }}>
                  Valor mensal combinado. Os recebimentos são registrados no Financeiro.
                </Label>
                {form.status === 'inactive' && (
                  <Notice>
                    O cadastro será preservado. O acesso vinculado do aluno ficará suspenso enquanto
                    estiver inativo.
                  </Notice>
                )}
              </>
            ) : (
              <>
                <Heading level={2}>Contexto do acompanhamento</Heading>
                {field('goal', 'Objetivo', {
                  multiline: true,
                  placeholder: 'O que o aluno deseja alcançar?',
                  maxLength: 1000,
                })}
                <Choice
                  label="Experiência com treinamento"
                  value={form.experience}
                  onChange={(v) => change('experience', v)}
                  options={Object.entries(experienceLabels).map(([value, label]) => ({
                    value: value as StudentInput['experience'],
                    label,
                  }))}
                />
                {field('availability', 'Disponibilidade semanal', {
                  multiline: true,
                  placeholder: 'Dias e horários preferidos',
                  maxLength: 500,
                })}
                {field('preferences', 'Preferências de treinamento', {
                  multiline: true,
                  placeholder: 'Preferências informadas pelo aluno',
                  maxLength: 1000,
                })}
                <Heading level={3}>Contato de emergência</Heading>
                {field('emergency_name', 'Nome do contato de emergência', { maxLength: 120 })}
                {field('emergency_phone', 'Telefone de emergência', {
                  mask: 'phone',
                  keyboardType: 'phone-pad',
                  maxLength: 30,
                })}
              </>
            )}
          </Card>
          <View
            style={{ flexDirection: 'row', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}
          >
            <Button secondary onPress={cancel} disabled={mutation.isPending}>
              Cancelar
            </Button>
            <Button onPress={submit} loading={mutation.isPending}>
              {student ? 'Salvar alterações' : 'Salvar aluno'}
            </Button>
          </View>
        </View>
        <Card style={{ width: wide ? 280 : '100%' }}>
          <Heading level={3}>Resumo do acompanhamento</Heading>
          <Label>
            {form.weekly_frequency
              ? `${form.weekly_frequency}× por semana`
              : 'Frequência a definir'}
          </Label>
          <Label>{monthlySummary}</Label>
          <Label muted>
            Nome e data de início são obrigatórios. Os outros campos podem ser preenchidos durante o
            acompanhamento.
          </Label>
          <Label muted style={{ fontSize: 12 }}>
            Este cadastro não substitui uma anamnese. Evite registrar dados clínicos nos campos
            livres; o módulo de saúde terá controles específicos.
          </Label>
          {student && (
            <Label muted style={{ fontSize: 11 }}>
              Última alteração: {new Date(student.updated_at).toLocaleString('pt-BR')}
            </Label>
          )}
        </Card>
      </View>
      <Modal
        visible={discard}
        transparent
        animationType="fade"
        onRequestClose={() => setDiscard(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: '#000A',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
          }}
        >
          <Card style={{ width: '100%', maxWidth: 420 }}>
            <Heading level={2}>Descartar alterações?</Heading>
            <Label muted>As alterações ainda não foram salvas.</Label>
            <Button secondary onPress={() => setDiscard(false)}>
              Continuar editando
            </Button>
            <Button
              onPress={() => {
                setDiscard(false);
                router.replace('/students');
              }}
            >
              Descartar e voltar
            </Button>
          </Card>
        </View>
      </Modal>
    </>
  );
}
