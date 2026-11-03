import React, { useState } from 'react';
import { View, Modal, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Choice, Field, Heading, Label, Notice, colors } from '@core/ui';
import {
  programSchema,
  prescribe,
  initials,
  type Program,
  type ProgramInput,
  type Student,
  type Exercise,
  type PrescriptionExercise,
} from '@core/domain';
import { readableError } from '@core/api-client';
import { trainingRepository, repository } from '../lib/backend';
import { useSession } from '../lib/session';
import { RecordPicker } from './RecordPicker';
import { ExercisePicker } from './ExercisePicker';
import { IconButton } from './Visual';

export function ProgramEditor({
  program,
  initialStudentId = '',
}: {
  program?: Program;
  initialStudentId?: string;
}) {
  const { professional } = useSession();
  const cache = useQueryClient();
  const { width } = useWindowDimensions();
  const [form, setForm] = useState<ProgramInput>(
    program ?? {
      name: '',
      student_id: initialStudentId,
      duration_weeks: 8,
      frequency: 3,
      notes: '',
      draft_days: [{ name: 'Treino A', exercises: [] }],
    },
  );
  const [saved, setSaved] = useState(program),
    [step, setStep] = useState(program ? 1 : 0),
    [dayIndex, setDayIndex] = useState(0),
    [studentPicker, setStudentPicker] = useState(false),
    [exercisePicker, setExercisePicker] = useState(false),
    [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    [settings, setSettings] = useState(false),
    [daySettings, setDaySettings] = useState(false),
    [expanded, setExpanded] = useState<string | null>(null),
    [advanced, setAdvanced] = useState<Record<string, boolean>>({}),
    [knownExercises, setKnownExercises] = useState<Record<string, Exercise>>({}),
    [confirm, setConfirm] = useState(false),
    [remove, setRemove] = useState<{ day: number; exercise?: number } | null>(null),
    [history, setHistory] = useState(false),
    [approvedForm, setApprovedForm] = useState('');
  const unchanged =
    !!saved &&
    Object.keys(programSchema.shape).every(
      (k) =>
        JSON.stringify(form[k as keyof ProgramInput]) ===
        JSON.stringify(saved[k as keyof ProgramInput]),
    );
  const student = useQuery({
    queryKey: ['student', form.student_id],
    queryFn: () => repository!.student(form.student_id),
    enabled: !!form.student_id,
  });
  const versions = useQuery({
    queryKey: ['versions', form.student_id],
    queryFn: () => trainingRepository!.versions(form.student_id),
    enabled: !!form.student_id,
  });
  const exerciseIds = [
    ...new Set(form.draft_days.flatMap((d) => d.exercises.map((e) => e.exercise_id))),
  ];
  const missingIds = exerciseIds.filter((id) => !knownExercises[id]);
  const exercises = useQuery({
    queryKey: ['editor-exercises', ...missingIds],
    queryFn: async () =>
      Object.fromEntries(
        (await Promise.all(missingIds.map((id) => trainingRepository!.exercise(id)))).map((e) => [
          e.id,
          e,
        ]),
      ),
    enabled: missingIds.length > 0,
  });
  const exerciseInfo = (id: string) => knownExercises[id] ?? exercises.data?.[id];
  const day = form.draft_days[dayIndex] ?? form.draft_days[0];
  const totalExercises = form.draft_days.reduce((n, d) => n + d.exercises.length, 0);
  const save = useMutation({
    mutationFn: () =>
      trainingRepository!.saveProgram(programSchema.parse(form), professional!.id, saved),
    onSuccess: async (p) => {
      setSaved(p);
      setForm({
        name: p.name,
        student_id: p.student_id,
        duration_weeks: p.duration_weeks,
        frequency: p.frequency,
        notes: p.notes,
        draft_days: p.draft_days,
      });
      setMessage('Rascunho salvo. Ainda não foi liberado ao aluno.');
      await cache.invalidateQueries({ queryKey: ['programs'] });
    },
  });
  const publish = useMutation({
    mutationFn: () => trainingRepository!.publish(saved!),
    onSuccess: async () => {
      setConfirm(false);
      setMessage('Versão aprovada e liberada ao aluno.');
      setApprovedForm(JSON.stringify(form));
      await cache.invalidateQueries({ queryKey: ['versions'] });
    },
  });
  const busy = save.isPending || publish.isPending;
  const nameOf = (id: string) =>
    exerciseInfo(id)?.name ??
    (exercises.isError ? 'Não foi possível carregar o nome' : 'Carregando exercício…');
  function validate(full = false) {
    setError('');
    if (!form.student_id) {
      setError('Escolha o aluno que vai receber este treino.');
      setStep(0);
      return false;
    }
    if (student.data?.status === 'inactive') {
      setError('Este aluno está inativo. Ative o cadastro antes de criar o treino.');
      setStep(0);
      return false;
    }
    if (form.name.trim().length < 3) {
      setError('Dê um nome ao programa, como “Treino de força”.');
      setStep(0);
      return false;
    }
    const parsed = programSchema.safeParse(form);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      const isExercise = first.path.includes('exercises');
      setError(
        isExercise
          ? 'Confira séries (1 a 20), intervalo (0 a 1800 s) e os parâmetros do exercício.'
          : 'Confira o nome, a duração (1 a 104 semanas) e a frequência (1 a 7 vezes por semana).',
      );
      if (isExercise) {
        const di = Number(first.path[1]),
          ei = Number(first.path[3]);
        setDayIndex(di);
        setExpanded(form.draft_days[di]?.exercises[ei]?.exercise_id ?? null);
        setStep(1);
      } else {
        setSettings(true);
        setStep(0);
      }
      return false;
    }
    if (full && form.draft_days.some((d) => !d.exercises.length)) {
      const empty = form.draft_days.findIndex((d) => !d.exercises.length);
      setError(`Adicione pelo menos um exercício ao ${form.draft_days[empty].name}.`);
      setDayIndex(empty);
      setStep(1);
      return false;
    }
    return true;
  }
  function navigate(next: number) {
    if (busy) return;
    if (next === 0 || validate(next === 2)) {
      setStep(next);
      setError('');
    }
  }
  function changeExercise(
    index: number,
    key: keyof PrescriptionExercise,
    value: string | number | null,
  ) {
    setForm((f) => ({
      ...f,
      draft_days: f.draft_days.map((d, di) =>
        di === dayIndex
          ? {
              ...d,
              exercises: d.exercises.map((e, ei) => (ei === index ? { ...e, [key]: value } : e)),
            }
          : d,
      ),
    }));
    setMessage('');
  }
  function moveExercise(index: number, offset: number) {
    setForm((f) => ({
      ...f,
      draft_days: f.draft_days.map((d, di) => {
        if (di !== dayIndex) return d;
        const list = [...d.exercises];
        [list[index], list[index + offset]] = [list[index + offset], list[index]];
        return { ...d, exercises: list };
      }),
    }));
  }
  function addExercises(records: Exercise[]) {
    setKnownExercises((s) => ({ ...s, ...Object.fromEntries(records.map((e) => [e.id, e])) }));
    setForm((f) => ({
      ...f,
      draft_days: f.draft_days.map((d, di) =>
        di === dayIndex
          ? {
              ...d,
              exercises: [
                ...d.exercises,
                ...records
                  .filter((e) => !d.exercises.some((x) => x.exercise_id === e.id))
                  .map((e) => prescribe(e.id)),
              ].slice(0, 100),
            }
          : d,
      ),
    }));
    setExpanded(records[0]?.id ?? null);
    setError('');
    setMessage('');
  }
  async function requestApproval() {
    if (!validate(true)) return;
    try {
      if (!unchanged) await save.mutateAsync();
      publish.reset();
      setConfirm(true);
    } catch {
      /* Mutation error is shown below. */
    }
  }
  function preset(count: number) {
    setForm((f) => ({
      ...f,
      draft_days: Array.from({ length: count }, (_, i) => ({
        name: `Treino ${String.fromCharCode(65 + i)}`,
        exercises: [],
      })),
    }));
    setDayIndex(0);
  }
  return (
    <>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <IconButton
          icon="arrow-back"
          label="Voltar para programas"
          onPress={() => router.push('/training')}
          disabled={busy}
        />
        <View style={{ flex: 1, gap: 3 }}>
          <Heading>{program ? 'Editar treino' : 'Criar treino'}</Heading>
          <Label muted>
            {step === 0
              ? 'Comece pelo aluno.'
              : step === 1
                ? 'Monte um treino de cada vez.'
                : 'Confira antes de enviar.'}
          </Label>
        </View>
      </View>
      <View
        style={{
          flexDirection: 'row',
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 14,
          padding: 5,
          gap: 4,
          backgroundColor: '#18181D',
        }}
      >
        {['Aluno', 'Exercícios', 'Revisão'].map((label, i) => (
          <Pressable
            key={label}
            accessibilityRole="tab"
            accessibilityLabel={`${i + 1}. ${label}`}
            accessibilityState={{ selected: step === i, disabled: busy }}
            disabled={busy}
            onPress={() => navigate(i)}
            style={{
              flex: 1,
              flexDirection: 'row',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              borderRadius: 10,
              paddingVertical: 12,
              backgroundColor: step === i ? '#382225' : 'transparent',
            }}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: step === i ? colors.red : '#303038',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Label style={{ fontSize: 11, lineHeight: 18 }}>{i + 1}</Label>
            </View>
            <Label
              style={{
                fontSize: 12,
                fontWeight: step === i ? '600' : '400',
                color: step === i ? 'white' : colors.secondary,
              }}
            >
              {label}
            </Label>
          </Pressable>
        ))}
      </View>
      {message && <Notice>{message}</Notice>}
      {error && <Notice error>{error}</Notice>}
      {save.error && <Notice error>{readableError(save.error)}</Notice>}
      {publish.error && !confirm && <Notice error>{readableError(publish.error)}</Notice>}
      {step === 0 && (
        <Card>
          <Heading level={2}>Para quem é o treino?</Heading>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                backgroundColor: '#32252A',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Label style={{ color: '#EDAAA4', fontWeight: '600' }}>
                {student.data ? initials(student.data.full_name) : '+'}
              </Label>
            </View>
            <View style={{ flex: 1 }}>
              <Label style={{ fontWeight: '600' }}>
                {student.data?.full_name ??
                  (form.student_id ? 'Carregando aluno…' : 'Escolha um aluno')}
              </Label>
              <Label muted style={{ fontSize: 12 }}>
                {student.data?.weekly_frequency
                  ? `${student.data.weekly_frequency}× por semana no acompanhamento`
                  : 'O treino ficará vinculado a este aluno.'}
              </Label>
            </View>
          </View>
          {student.error && (
            <>
              <Notice error>{readableError(student.error)}</Notice>
              <Button secondary onPress={() => student.refetch()}>
                Tentar carregar aluno
              </Button>
            </>
          )}
          {!saved && (
            <Button secondary onPress={() => setStudentPicker(true)} disabled={busy}>
              {form.student_id ? 'Trocar aluno' : 'Escolher aluno'}
            </Button>
          )}
          <Field
            label="Nome do programa *"
            placeholder="Ex.: Treino de força"
            value={form.name}
            editable={!busy}
            maxLength={160}
            onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
          />
          <Choice
            label="Treinos por semana"
            value={String(form.frequency)}
            onChange={(v) => {
              if (!busy) setForm((f) => ({ ...f, frequency: Number(v) }));
            }}
            options={Array.from({ length: 7 }, (_, i) => ({
              value: String(i + 1),
              label: `${i + 1}×`,
            }))}
          />
          {!totalExercises && (
            <>
              <Heading level={3}>Como quer dividir?</Heading>
              <Label muted style={{ fontSize: 12 }}>
                Escolha a estrutura. Você pode adicionar mais treinos depois.
              </Label>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { count: 1, label: 'Único', detail: 'A' },
                  { count: 2, label: 'AB', detail: 'A · B' },
                  { count: 3, label: 'ABC', detail: 'A · B · C' },
                  { count: 4, label: 'ABCD', detail: 'A · B · C · D' },
                ].map((p) => (
                  <Pressable
                    key={p.count}
                    accessibilityRole="radio"
                    accessibilityLabel={`Divisão ${p.label}`}
                    accessibilityState={{ checked: form.draft_days.length === p.count }}
                    disabled={busy}
                    onPress={() => preset(p.count)}
                    style={{
                      flex: 1,
                      minWidth: 65,
                      alignItems: 'center',
                      padding: 12,
                      gap: 7,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: form.draft_days.length === p.count ? '#B9524C' : colors.border,
                      backgroundColor:
                        form.draft_days.length === p.count ? '#362226' : colors.background,
                    }}
                  >
                    <Ionicons
                      name="albums-outline"
                      size={22}
                      color={form.draft_days.length === p.count ? '#E7A19A' : colors.secondary}
                    />
                    <Label style={{ fontWeight: '600' }}>{p.label}</Label>
                    <Label muted style={{ fontSize: 10 }}>
                      {p.detail}
                    </Label>
                  </Pressable>
                ))}
              </View>
            </>
          )}
          <Button secondary disabled={busy} onPress={() => setSettings((v) => !v)}>
            {settings ? 'Ocultar ajustes da rotina' : 'Duração e orientações'}
          </Button>
          {settings && (
            <>
              <Field
                label="Duração em semanas"
                value={String(form.duration_weeks)}
                keyboardType="number-pad"
                editable={!busy}
                onChangeText={(v) => setForm((f) => ({ ...f, duration_weeks: Number(v) }))}
              />
              <Field
                label="Orientações gerais"
                value={form.notes}
                multiline
                maxLength={2000}
                editable={!busy}
                onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))}
              />
            </>
          )}
          <Button disabled={busy} onPress={() => navigate(1)}>
            Montar exercícios →
          </Button>
        </Card>
      )}
      {step === 1 && (
        <>
          <View style={{ gap: 12 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <Heading level={2}>Seus treinos</Heading>
              <Label muted style={{ fontSize: 12 }}>
                {totalExercises} exercício(s)
              </Label>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10, paddingBottom: 4 }}
            >
              {form.draft_days.map((d, i) => (
                <Pressable
                  key={i}
                  accessibilityRole="tab"
                  accessibilityLabel={`Editar ${d.name}`}
                  accessibilityState={{ selected: dayIndex === i }}
                  disabled={busy}
                  onPress={() => {
                    setDayIndex(i);
                    setExpanded(null);
                    setDaySettings(false);
                  }}
                  style={{
                    borderWidth: 1,
                    borderColor: dayIndex === i ? '#A84B47' : colors.border,
                    borderRadius: 14,
                    backgroundColor: dayIndex === i ? '#342024' : '#1C1C21',
                    minWidth: 100,
                    padding: 14,
                    gap: 3,
                  }}
                >
                  <Label style={{ fontWeight: '600' }}>{d.name}</Label>
                  <Label muted style={{ fontSize: 11 }}>
                    {d.exercises.length} exercício(s)
                  </Label>
                </Pressable>
              ))}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Novo treino na rotina"
                disabled={busy || form.draft_days.length >= 14}
                onPress={() => {
                  const n = form.draft_days.length;
                  setForm((f) => ({
                    ...f,
                    draft_days: [
                      ...f.draft_days,
                      { name: `Treino ${String.fromCharCode(65 + n)}`, exercises: [] },
                    ],
                  }));
                  setDayIndex(n);
                  setExpanded(null);
                  setDaySettings(false);
                }}
                style={{
                  padding: 16,
                  justifyContent: 'center',
                  borderRadius: 14,
                  borderWidth: 1,
                  borderStyle: 'dashed',
                  borderColor: colors.border,
                  opacity: form.draft_days.length >= 14 ? 0.3 : 1,
                }}
              >
                <Ionicons name="add" size={26} color={colors.secondary} />
              </Pressable>
            </ScrollView>
          </View>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Heading level={2}>{day.name}</Heading>
            <IconButton
              icon="options-outline"
              label="Ajustes deste treino"
              disabled={busy}
              onPress={() => setDaySettings((v) => !v)}
            />
          </View>
          {daySettings && (
            <Card>
              <Field
                label="Nome deste treino"
                value={day.name}
                editable={!busy}
                maxLength={80}
                onChangeText={(v) =>
                  setForm((f) => ({
                    ...f,
                    draft_days: f.draft_days.map((d, i) =>
                      i === dayIndex ? { ...d, name: v } : d,
                    ),
                  }))
                }
              />
              {form.draft_days.length > 1 && (
                <Button secondary disabled={busy} onPress={() => setRemove({ day: dayIndex })}>
                  Remover este treino
                </Button>
              )}
            </Card>
          )}
          {exercises.isError && (
            <>
              <Notice error>Não foi possível carregar os nomes dos exercícios.</Notice>
              <Button secondary onPress={() => exercises.refetch()}>
                Tentar carregar exercícios
              </Button>
            </>
          )}
          {!day.exercises.length && (
            <Card style={{ alignItems: 'center', paddingVertical: 30 }}>
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 20,
                  backgroundColor: '#302127',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="barbell-outline" size={30} color="#D9918A" />
              </View>
              <Heading level={3}>Vamos montar o {day.name}?</Heading>
              <Label muted>Escolha os exercícios na sua biblioteca.</Label>
            </Card>
          )}
          {day.exercises.map((e, ei) => {
            const open = expanded === e.exercise_id,
              detailKey = `${dayIndex}:${e.exercise_id}`,
              info = exerciseInfo(e.exercise_id);
            return (
              <Card
                key={e.exercise_id}
                style={{
                  padding: width < 700 ? 16 : 20,
                  gap: 14,
                  borderColor: open ? '#75403F' : colors.border,
                }}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${open ? 'Recolher' : 'Ajustar'} ${nameOf(e.exercise_id)}`}
                  accessibilityState={{ expanded: open }}
                  onPress={() => setExpanded(open ? null : e.exercise_id)}
                  style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 44,
                      borderRadius: 12,
                      backgroundColor: '#2B2B32',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Label style={{ color: '#BDBDC9', fontWeight: '600' }}>
                      {String(ei + 1).padStart(2, '0')}
                    </Label>
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Label style={{ fontWeight: '600', fontSize: 15 }}>
                      {nameOf(e.exercise_id)}
                    </Label>
                    <Label muted style={{ fontSize: 12 }}>
                      {e.sets} séries · {e.repetitions || 'Repetições livres'} · {e.rest_seconds}s
                      {info?.muscle_group ? ` · ${info.muscle_group}` : ''}
                    </Label>
                  </View>
                  <Ionicons
                    name={open ? 'chevron-up' : 'chevron-down'}
                    size={19}
                    color={colors.secondary}
                  />
                </Pressable>
                {open && (
                  <>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <View style={{ flex: 1 }}>
                        <Field
                          label="Séries"
                          value={String(e.sets)}
                          editable={!busy}
                          keyboardType="number-pad"
                          onChangeText={(v) => changeExercise(ei, 'sets', Number(v))}
                        />
                      </View>
                      <View style={{ flex: 1.3 }}>
                        <Field
                          label="Repetições"
                          value={e.repetitions}
                          editable={!busy}
                          onChangeText={(v) => changeExercise(ei, 'repetitions', v)}
                          maxLength={40}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Field
                          label="Intervalo (s)"
                          value={String(e.rest_seconds)}
                          editable={!busy}
                          keyboardType="number-pad"
                          onChangeText={(v) => changeExercise(ei, 'rest_seconds', Number(v))}
                        />
                      </View>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ expanded: !!advanced[detailKey] }}
                      accessibilityLabel="Carga, esforço e orientações"
                      onPress={() => setAdvanced((a) => ({ ...a, [detailKey]: !a[detailKey] }))}
                      style={{
                        paddingVertical: 10,
                        flexDirection: 'row',
                        gap: 8,
                        alignItems: 'center',
                      }}
                    >
                      <Ionicons name="options-outline" size={17} color="#D79891" />
                      <Label style={{ fontSize: 12, color: '#DCA19A' }}>
                        Carga, esforço e orientações
                      </Label>
                      <Ionicons
                        name={advanced[detailKey] ? 'chevron-up' : 'chevron-down'}
                        size={14}
                        color="#D79891"
                      />
                    </Pressable>
                    {advanced[detailKey] && (
                      <>
                        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                          {[
                            { key: 'load_kg', label: 'Carga de referência (kg)' },
                            { key: 'rpe', label: 'RPE (opcional)' },
                            { key: 'rir', label: 'RIR (opcional)' },
                          ].map((p) => (
                            <View key={p.key} style={{ minWidth: 130, flex: 1 }}>
                              <Field
                                label={p.label}
                                value={
                                  e[p.key as 'load_kg' | 'rpe' | 'rir'] == null
                                    ? ''
                                    : String(e[p.key as 'load_kg' | 'rpe' | 'rir'])
                                }
                                editable={!busy}
                                keyboardType="decimal-pad"
                                onChangeText={(v) =>
                                  changeExercise(
                                    ei,
                                    p.key as keyof PrescriptionExercise,
                                    v === '' ? null : Number(v.replace(',', '.')),
                                  )
                                }
                              />
                            </View>
                          ))}
                        </View>
                        <Field
                          label="Tempo de execução (opcional)"
                          value={e.tempo}
                          editable={!busy}
                          maxLength={40}
                          onChangeText={(v) => changeExercise(ei, 'tempo', v)}
                        />
                        <Field
                          label="Adaptações e observações técnicas"
                          value={e.notes}
                          multiline
                          editable={!busy}
                          maxLength={1000}
                          onChangeText={(v) => changeExercise(ei, 'notes', v)}
                        />
                      </>
                    )}
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <IconButton
                          icon="arrow-up"
                          label={`Subir ${nameOf(e.exercise_id)}`}
                          disabled={busy || ei === 0}
                          onPress={() => moveExercise(ei, -1)}
                        />
                        <IconButton
                          icon="arrow-down"
                          label={`Descer ${nameOf(e.exercise_id)}`}
                          disabled={busy || ei === day.exercises.length - 1}
                          onPress={() => moveExercise(ei, 1)}
                        />
                      </View>
                      <IconButton
                        icon="trash-outline"
                        label={`Remover ${nameOf(e.exercise_id)}`}
                        disabled={busy}
                        onPress={() => setRemove({ day: dayIndex, exercise: ei })}
                      />
                    </View>
                  </>
                )}
              </Card>
            );
          })}
          <Button
            secondary
            disabled={busy || day.exercises.length >= 100}
            onPress={() => setExercisePicker(true)}
          >
            ＋ Adicionar exercícios
          </Button>
          <View
            style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-end' }}
          >
            <Button
              secondary
              loading={save.isPending}
              disabled={publish.isPending}
              onPress={() => {
                if (validate()) save.mutate();
              }}
            >
              Salvar rascunho
            </Button>
            <Button disabled={busy} onPress={() => navigate(2)}>
              Revisar treino →
            </Button>
          </View>
        </>
      )}
      {step === 2 && (
        <>
          <Card>
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <Ionicons name="checkmark-circle-outline" size={30} color="#9CC7B0" />
              <View style={{ flex: 1 }}>
                <Heading level={2}>{form.name}</Heading>
                <Label muted>{student.data?.full_name}</Label>
              </View>
            </View>
            <Label>
              {form.frequency}× por semana · {form.duration_weeks} semanas ·{' '}
              {form.draft_days.length} treino(s)
            </Label>
            {!!form.notes && <Label muted>{form.notes}</Label>}
          </Card>
          {form.draft_days.map((d, di) => (
            <Card key={di}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Heading level={3}>{d.name}</Heading>
                <IconButton
                  icon="create-outline"
                  label={`Revisar exercícios de ${d.name}`}
                  disabled={busy}
                  onPress={() => {
                    setDayIndex(di);
                    setStep(1);
                  }}
                />
              </View>
              {d.exercises.map((e, ei) => (
                <View
                  key={e.exercise_id}
                  style={{ borderTopWidth: 1, borderColor: colors.border, paddingTop: 12, gap: 3 }}
                >
                  <Label style={{ fontWeight: '600' }}>
                    {ei + 1}. {nameOf(e.exercise_id)}
                  </Label>
                  <Label muted style={{ fontSize: 12 }}>
                    {e.sets} séries · {e.repetitions || 'Repetições livres'} · {e.rest_seconds}s de
                    intervalo{e.load_kg != null ? ` · ${e.load_kg} kg` : ''}
                  </Label>
                  {(e.rpe != null || e.rir != null || e.tempo) && (
                    <Label muted style={{ fontSize: 12 }}>
                      {[
                        e.rpe != null ? `RPE ${e.rpe}` : '',
                        e.rir != null ? `RIR ${e.rir}` : '',
                        e.tempo ? `Tempo ${e.tempo}` : '',
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </Label>
                  )}
                  {!!e.notes && (
                    <Label muted style={{ fontSize: 12 }}>
                      {e.notes}
                    </Label>
                  )}
                </View>
              ))}
            </Card>
          ))}
          <Label muted style={{ fontSize: 12 }}>
            O aluno só recebe o treino depois da sua confirmação.
          </Label>
          <Button
            loading={save.isPending}
            disabled={
              publish.isPending ||
              approvedForm === JSON.stringify(form) ||
              (exercises.isPending && missingIds.length > 0) ||
              !!exercises.error ||
              student.isPending ||
              !!student.error
            }
            onPress={requestApproval}
          >
            {approvedForm === JSON.stringify(form)
              ? 'Treino liberado'
              : unchanged
                ? 'Liberar ao aluno'
                : 'Salvar e liberar ao aluno'}
          </Button>
          <Button secondary disabled={busy} onPress={() => setStep(1)}>
            Voltar aos exercícios
          </Button>
          {saved && (
            <View style={{ gap: 12 }}>
              <Button
                secondary
                disabled={busy}
                onPress={() => {
                  setSaved(undefined);
                  setForm((f) => ({
                    ...f,
                    name: f.name.slice(0, 150) + ' — cópia',
                    student_id: '',
                  }));
                  setStep(0);
                  setApprovedForm('');
                  setMessage('Cópia preparada. Escolha o aluno para o novo treino.');
                }}
              >
                Duplicar para outro aluno
              </Button>
              <Button secondary onPress={() => setHistory((v) => !v)}>
                {history ? 'Ocultar versões anteriores' : 'Ver versões anteriores'}
              </Button>
              {history && (
                <Card>
                  {versions.error ? (
                    <Notice error>{readableError(versions.error)}</Notice>
                  ) : versions.data?.filter((v) => v.program_id === saved.id).length ? (
                    versions.data
                      .filter((v) => v.program_id === saved.id)
                      .map((v) => (
                        <Label key={v.id}>
                          Versão {v.revision} · {new Date(v.published_at).toLocaleString('pt-BR')}
                        </Label>
                      ))
                  ) : (
                    <Label muted>Nenhuma versão liberada.</Label>
                  )}
                </Card>
              )}
            </View>
          )}
        </>
      )}
      <RecordPicker
        kind="student"
        visible={studentPicker}
        onClose={() => setStudentPicker(false)}
        onSelect={(r) => {
          const s = r as Student;
          setForm((f) => ({
            ...f,
            student_id: s.id,
            name: f.name || `Treino de ${s.full_name.split(' ')[0]}`,
            frequency: s.weekly_frequency ?? f.frequency,
          }));
          setError('');
        }}
      />
      {exercisePicker && (
        <ExercisePicker
          existingIds={day.exercises.map((e) => e.exercise_id)}
          onClose={() => setExercisePicker(false)}
          onAdd={addExercises}
        />
      )}
      <Modal
        transparent
        visible={confirm || !!remove}
        onRequestClose={() => {
          if (!busy) {
            setConfirm(false);
            setRemove(null);
          }
        }}
      >
        <View
          style={{
            flex: 1,
            padding: 24,
            backgroundColor: '#000B',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Card style={{ width: '100%', maxWidth: 480 }}>
            {remove ? (
              <>
                <Heading level={2}>
                  {remove.exercise == null ? 'Remover este treino?' : 'Remover este exercício?'}
                </Heading>
                <Label muted>
                  {remove.exercise == null
                    ? 'Os exercícios deste treino serão retirados do rascunho.'
                    : 'O exercício será retirado deste treino.'}
                </Label>
                <Button
                  onPress={() => {
                    const target = remove;
                    if (target.exercise == null) {
                      setForm((f) => ({
                        ...f,
                        draft_days: f.draft_days.filter((_, i) => i !== target.day),
                      }));
                      setDayIndex(Math.max(0, target.day - 1));
                      setDaySettings(false);
                    } else
                      setForm((f) => ({
                        ...f,
                        draft_days: f.draft_days.map((d, i) =>
                          i === target.day
                            ? {
                                ...d,
                                exercises: d.exercises.filter((_, ei) => ei !== target.exercise),
                              }
                            : d,
                        ),
                      }));
                    setRemove(null);
                  }}
                >
                  Confirmar remoção
                </Button>
                <Button secondary onPress={() => setRemove(null)}>
                  Manter no treino
                </Button>
              </>
            ) : (
              <>
                <Heading level={2}>Liberar este treino?</Heading>
                <Label>{saved?.name}</Label>
                <Label muted>
                  {student.data?.full_name} · {form.draft_days.length} treino(s) · {totalExercises}{' '}
                  exercício(s)
                </Label>
                <Label muted>
                  Uma versão será enviada ao aluno. Você poderá editar o rascunho depois sem alterar
                  o histórico.
                </Label>
                {publish.error && <Notice error>{readableError(publish.error)}</Notice>}
                <Button onPress={() => publish.mutate()} loading={publish.isPending}>
                  Confirmar e liberar
                </Button>
                <Button secondary disabled={publish.isPending} onPress={() => setConfirm(false)}>
                  Continuar revisando
                </Button>
              </>
            )}
          </Card>
        </View>
      </Modal>
    </>
  );
}
