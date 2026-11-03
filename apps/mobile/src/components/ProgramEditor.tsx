import React, { useState } from 'react';
import { View, Modal } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Field, Heading, Label, Notice, colors } from '@core/ui';
import {
  programSchema,
  prescribe,
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
export function ProgramEditor({ program }: { program?: Program }) {
  const { professional } = useSession();
  const cache = useQueryClient();
  const [form, setForm] = useState<ProgramInput>(
      program ?? {
        name: '',
        student_id: '',
        duration_weeks: 8,
        frequency: 3,
        notes: '',
        draft_days: [{ name: 'Treino A', exercises: [] }],
      },
    ),
    [saved, setSaved] = useState<Program | undefined>(program),
    [picker, setPicker] = useState<'student' | 'exercise' | null>(null),
    [selectedDay, setSelectedDay] = useState(0),
    [error, setError] = useState(''),
    [confirm, setConfirm] = useState(false),
    [message, setMessage] = useState(''),
    [names, setNames] = useState<Record<string, string>>({}),
    [details, setDetails] = useState<Record<string, boolean>>({});
  // Program rows include metadata, so initialize a domain-only comparison below.
  const unchanged =
    saved &&
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
  const exerciseNames = useQuery({
    queryKey: ['exercise-names', ...exerciseIds],
    queryFn: async () => {
      const result = await Promise.all(exerciseIds.map((id) => trainingRepository!.exercise(id)));
      return Object.fromEntries(result.map((e) => [e.id, e.name]));
    },
    enabled: exerciseIds.length > 0,
  });
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
      await cache.invalidateQueries({ queryKey: ['versions'] });
    },
  });
  function updateExercise(
    dayIndex: number,
    index: number,
    key: keyof PrescriptionExercise,
    value: any,
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
  function move(dayIndex: number, index: number, offset: number) {
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
  function submit() {
    setError('');
    setMessage('');
    const parsed = programSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues.map((v) => `${v.path.join('.')}: ${v.message}`).join('\n'));
      return;
    }
    save.mutate();
  }
  function add(record: Student | Exercise) {
    if ('full_name' in record) {
      setForm((f) => ({ ...f, student_id: record.id }));
      return;
    }
    if (form.draft_days[selectedDay].exercises.some((e) => e.exercise_id === record.id)) {
      setError('Este exercício já está nesta divisão.');
      return;
    }
    setNames((v) => ({ ...v, [record.id]: record.name }));
    setForm((f) => ({
      ...f,
      draft_days: f.draft_days.map((d, i) =>
        i === selectedDay ? { ...d, exercises: [...d.exercises, prescribe(record.id)] } : d,
      ),
    }));
  }
  return (
    <>
      <View style={{ gap: 7 }}>
        <Label muted>TREINOS / EDITOR</Label>
        <Heading>{saved ? saved.name : 'Novo programa'}</Heading>
        <Label muted>Prescreva, confira e aprove uma versão para seu aluno.</Label>
      </View>
      <Button secondary onPress={() => router.push('/training')}>
        Voltar para programas
      </Button>
      {message && <Notice>{message}</Notice>}
      {error && <Notice error>{error}</Notice>}
      {save.error && <Notice error>{readableError(save.error)}</Notice>}
      {publish.error && <Notice error>{readableError(publish.error)}</Notice>}
      <Card>
        <Heading level={2}>Estrutura do programa</Heading>
        <Field
          label="Nome do programa *"
          value={form.name}
          onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
          maxLength={160}
        />
        <Label>{student.data?.full_name || 'Selecione um aluno para este programa'}</Label>
        {!saved && (
          <Button secondary onPress={() => setPicker('student')}>
            Escolher aluno
          </Button>
        )}
        <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
          <Field
            label="Duração em semanas"
            value={String(form.duration_weeks)}
            keyboardType="number-pad"
            onChangeText={(v) => setForm((f) => ({ ...f, duration_weeks: Number(v) }))}
          />
          <Field
            label="Frequência semanal"
            value={String(form.frequency)}
            keyboardType="number-pad"
            onChangeText={(v) => setForm((f) => ({ ...f, frequency: Number(v) }))}
          />
        </View>
        <Field
          label="Orientações gerais"
          multiline
          value={form.notes}
          onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))}
          maxLength={2000}
        />
      </Card>
      {form.draft_days.map((day, di) => (
        <Card key={di}>
          <View style={{ gap: 12 }}>
            <Field
              label={`Nome da divisão ${di + 1}`}
              value={day.name}
              onChangeText={(v) =>
                setForm((f) => ({
                  ...f,
                  draft_days: f.draft_days.map((d, i) => (i === di ? { ...d, name: v } : d)),
                }))
              }
            />
            <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
              <Button
                secondary
                onPress={() => {
                  setSelectedDay(di);
                  setPicker('exercise');
                }}
              >
                ＋ Adicionar exercício
              </Button>
              {form.draft_days.length > 1 && (
                <Button
                  secondary
                  onPress={() =>
                    setForm((f) => ({ ...f, draft_days: f.draft_days.filter((_, i) => i !== di) }))
                  }
                >
                  Remover divisão
                </Button>
              )}
            </View>
          </View>
          {!day.exercises.length && <Label muted>Esta divisão ainda não tem exercícios.</Label>}
          {day.exercises.map((e, ei) => (
            <View
              key={e.exercise_id}
              style={{ gap: 14, borderTopWidth: 1, borderColor: colors.border, paddingTop: 18 }}
            >
              <Heading level={3}>
                {ei + 1}.{' '}
                {names[e.exercise_id] ||
                  exerciseNames.data?.[e.exercise_id] ||
                  'Exercício indisponível na biblioteca'}
              </Heading>
              <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
                <Field
                  label="Séries"
                  value={String(e.sets)}
                  keyboardType="number-pad"
                  onChangeText={(v) => updateExercise(di, ei, 'sets', Number(v))}
                />
                <Field
                  label="Repetições"
                  value={e.repetitions}
                  onChangeText={(v) => updateExercise(di, ei, 'repetitions', v)}
                />
                <Field
                  label="Intervalo (s)"
                  value={String(e.rest_seconds)}
                  keyboardType="number-pad"
                  onChangeText={(v) => updateExercise(di, ei, 'rest_seconds', Number(v))}
                />
              </View>
              <Button
                secondary
                onPress={() =>
                  setDetails((v) => ({
                    ...v,
                    [`${di}:${e.exercise_id}`]: !v[`${di}:${e.exercise_id}`],
                  }))
                }
              >
                {details[`${di}:${e.exercise_id}`]
                  ? 'Ocultar parâmetros opcionais'
                  : 'Carga, esforço e orientações'}
              </Button>
              {details[`${di}:${e.exercise_id}`] && (
                <>
                  <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
                    <Field
                      label="Carga de referência (kg)"
                      value={e.load_kg === null ? '' : String(e.load_kg)}
                      keyboardType="decimal-pad"
                      onChangeText={(v) =>
                        updateExercise(
                          di,
                          ei,
                          'load_kg',
                          v === '' ? null : Number(v.replace(',', '.')),
                        )
                      }
                    />
                    <Field
                      label="RPE (opcional)"
                      value={e.rpe === null ? '' : String(e.rpe)}
                      keyboardType="decimal-pad"
                      onChangeText={(v) =>
                        updateExercise(di, ei, 'rpe', v === '' ? null : Number(v.replace(',', '.')))
                      }
                    />
                    <Field
                      label="RIR (opcional)"
                      value={e.rir === null ? '' : String(e.rir)}
                      keyboardType="number-pad"
                      onChangeText={(v) =>
                        updateExercise(di, ei, 'rir', v === '' ? null : Number(v))
                      }
                    />
                  </View>
                  <Field
                    label="Tempo de execução (opcional)"
                    value={e.tempo}
                    onChangeText={(v) => updateExercise(di, ei, 'tempo', v)}
                  />
                  <Field
                    label="Adaptações e observações técnicas"
                    value={e.notes}
                    multiline
                    onChangeText={(v) => updateExercise(di, ei, 'notes', v)}
                  />
                </>
              )}
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                <Button secondary disabled={ei === 0} onPress={() => move(di, ei, -1)}>
                  ↑ Subir
                </Button>
                <Button
                  secondary
                  disabled={ei === day.exercises.length - 1}
                  onPress={() => move(di, ei, 1)}
                >
                  ↓ Descer
                </Button>
                <Button
                  secondary
                  onPress={() =>
                    setForm((f) => ({
                      ...f,
                      draft_days: f.draft_days.map((d, i) =>
                        i === di ? { ...d, exercises: d.exercises.filter((_, j) => j !== ei) } : d,
                      ),
                    }))
                  }
                >
                  Remover exercício
                </Button>
              </View>
            </View>
          ))}
        </Card>
      ))}
      <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
        <Button
          secondary
          disabled={form.draft_days.length >= 14}
          onPress={() =>
            setForm((f) => ({
              ...f,
              draft_days: [
                ...f.draft_days,
                { name: `Treino ${String.fromCharCode(65 + f.draft_days.length)}`, exercises: [] },
              ],
            }))
          }
        >
          ＋ Nova divisão
        </Button>
        <Button onPress={submit} loading={save.isPending}>
          Salvar rascunho
        </Button>
        <Button
          secondary
          disabled={
            !unchanged ||
            save.isPending ||
            publish.isPending ||
            form.draft_days.some((d) => !d.exercises.length)
          }
          onPress={() => {
            publish.reset();
            setConfirm(true);
          }}
        >
          Revisar e liberar ao aluno
        </Button>
      </View>
      {saved && (
        <Card>
          <Heading level={3}>Reutilizar como modelo</Heading>
          <Label muted>
            Crie uma cópia em rascunho para outro aluno. Nenhuma cópia é liberada automaticamente.
          </Label>
          <Button
            secondary
            onPress={() => {
              setSaved(undefined);
              setForm((f) => ({ ...f, name: f.name + ' — cópia', student_id: '' }));
              setMessage('Cópia preparada. Escolha o aluno e salve o novo rascunho.');
            }}
          >
            Duplicar programa
          </Button>
        </Card>
      )}
      {!!versions.data?.filter((v) => v.program_id === saved?.id).length && (
        <Card>
          <Heading level={3}>Versões publicadas</Heading>
          {versions.data
            .filter((v) => v.program_id === saved?.id)
            .map((v) => (
              <Label key={v.id}>
                Versão {v.revision} · {new Date(v.published_at).toLocaleString('pt-BR')}
              </Label>
            ))}
          <Label muted>
            Alterações no rascunho não modificam essas versões nem os registros de execução.
          </Label>
        </Card>
      )}
      <RecordPicker
        kind={picker ?? 'student'}
        visible={!!picker}
        onClose={() => setPicker(null)}
        onSelect={add}
      />
      <Modal
        transparent
        visible={confirm}
        onRequestClose={() => {
          if (!publish.isPending) setConfirm(false);
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
            <Heading level={2}>Aprovar esta prescrição?</Heading>
            <Label>Programa: {saved?.name}</Label>
            <Label>Aluno: {student.data?.full_name}</Label>
            <Label muted>
              Ao aprovar, esta versão será disponibilizada ao aluno. Confira os exercícios e
              parâmetros antes de continuar.
            </Label>
            {publish.error && <Notice error>{readableError(publish.error)}</Notice>}
            <Button onPress={() => publish.mutate()} loading={publish.isPending}>
              Aprovar e disponibilizar
            </Button>
            <Button secondary disabled={publish.isPending} onPress={() => setConfirm(false)}>
              Continuar revisando
            </Button>
          </Card>
        </View>
      </Modal>
    </>
  );
}
