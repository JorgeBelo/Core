import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { randomUUID } from 'expo-crypto';
import * as ImagePicker from 'expo-image-picker';
import {
  CoreState,
  Student,
  Reminder,
  Session,
  WeeklySlot,
  WorkHour,
  clock,
  currentMonth,
  day,
  displayDay,
  localDay,
  minutes,
  saveSession,
  saveStudent,
  saveWeeklySlot,
  validateWorkHours,
  weekNames,
} from './domain';
import { Button, Card, Field, Icon, Txt, colors, styles as ui } from './ui';
import { Avatar, Sheet, Stepper } from './mobile-ui';
import { finishMoneyInput, moneyInput, phoneInput } from '../../../packages/ui/src/input-masks';

export type Editor =
  | { kind: 'student'; student?: Student }
  | { kind: 'profile'; onboarding?: boolean }
  | { kind: 'reminder' }
  | { kind: 'session'; date?: string; start?: string; duration?: number }
  | { kind: 'weekly'; student: Student }
  | { kind: 'work-hours' };
export type EditorProps = {
  editor: Editor;
  state: CoreState;
  busy: boolean;
  saveError: string;
  onClose: () => void;
  onSubmit: (change: (s: CoreState) => CoreState) => Promise<void>;
};
const maskDate = (v: string) =>
  v
    .replace(/\D/g, '')
    .slice(0, 8)
    .replace(/^(\d{2})(\d)/, '$1/$2')
    .replace(/^(\d{2})\/(\d{2})(\d)/, '$1/$2/$3');
const isoDate = (v: string) => day.parse(v.split('/').reverse().join('-'));
const errorText = (e: unknown) =>
  e instanceof Error
    ? e.name === 'ZodError'
      ? 'Confira os campos: nome, telefone com DDD, valores e datas válidas.'
      : e.message
    : 'Não foi possível salvar.';
function ErrorCard({ text }: { text: string }) {
  return text ? (
    <Card style={{ borderColor: colors.accent }}>
      <Txt style={{ color: colors.accent }}>{text}</Txt>
    </Card>
  ) : null;
}

export function EditorForm(props: EditorProps) {
  if (props.editor.kind === 'work-hours') return <WorkHoursEditor {...props} />;
  if (props.editor.kind === 'weekly')
    return <WeeklyEditor {...props} student={props.editor.student} />;
  return <BasicEditor {...props} />;
}
function BasicEditor({ editor, state, busy, saveError, onClose, onSubmit }: EditorProps) {
  const st = editor.kind === 'student' ? editor.student : undefined;
  const [name, setName] = useState(
    st?.name ?? (editor.kind === 'profile' ? state.profile.name : ''),
  );
  const [cref, setCref] = useState(state.profile.cref);
  const [photo, setPhoto] = useState(state.profile.photo);
  const [phone, setPhone] = useState(st ? phoneInput(st.phone) : '');
  const [fee, setFee] = useState(
    st ? (st.feeCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '',
  );
  const [due, setDue] = useState(st?.dueDay ?? 5);
  const [frequency, setFrequency] = useState(st?.frequency ?? 3);
  const [birth, setBirth] = useState(st?.birthDate ? displayDay(st.birthDate) : '');
  const [notes, setNotes] = useState(st?.notes ?? '');
  const [optional, setOptional] = useState(false);
  const [date, setDate] = useState(
    displayDay(editor.kind === 'session' && editor.date ? editor.date : localDay()),
  );
  const [sessionStudent, setSessionStudent] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [start, setStart] = useState(
    editor.kind === 'session' ? (editor.start ?? '08:00') : '08:00',
  );
  const [duration, setDuration] = useState(
    editor.kind === 'session' ? (editor.duration ?? 60) : 60,
  );
  const [error, setError] = useState('');
  const [picking, setPicking] = useState(false);
  const isProfile = editor.kind === 'profile';
  const title =
    editor.kind === 'student'
      ? st
        ? 'Editar aluno'
        : 'Novo aluno'
      : isProfile
        ? 'Seu perfil'
        : editor.kind === 'session'
          ? 'Agendar aula'
          : 'Novo lembrete';
  async function pickPhoto() {
    setPicking(true);
    setError('');
    try {
      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.35,
        base64: true,
      });
      if (!picked.canceled) {
        const data = picked.assets[0].base64;
        if (!data || data.length > 2900000)
          throw new Error('Escolha uma foto menor para o perfil.');
        setPhoto('data:image/jpeg;base64,' + data);
      }
    } catch (e) {
      setError(errorText(e));
    } finally {
      setPicking(false);
    }
  }
  async function submit() {
    setError('');
    try {
      if (editor.kind === 'student') {
        const normalized = finishMoneyInput(fee);
        if (!/^\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?$/.test(normalized))
          throw new Error('Informe a mensalidade no formato 400,00.');
        const bday = birth ? isoDate(birth) : '';
        if (bday > localDay()) throw new Error('Nascimento não pode estar no futuro.');
        const student: Student = {
          id: st?.id ?? randomUUID(),
          name: name.trim(),
          phone: phone.replace(/\D/g, ''),
          feeCents: Math.round(Number(normalized.replace(/\./g, '').replace(',', '.')) * 100),
          dueDay: due,
          frequency,
          birthDate: bday,
          notes,
          startMonth: st?.startMonth ?? currentMonth(),
          archivedOn: st?.archivedOn ?? null,
        };
        saveStudent(state, student);
        await onSubmit((s) => saveStudent(s, student));
      } else if (editor.kind === 'profile') {
        if (name.trim().length < 2 || name.length > 120 || cref.length > 50)
          throw new Error('Preencha seu nome. O CREF e a foto são opcionais.');
        await onSubmit((s) => ({
          ...s,
          profile: {
            ...s.profile,
            name: name.trim(),
            cref: cref.trim(),
            photo,
            setupComplete: true,
          },
        }));
      } else if (editor.kind === 'session') {
        if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(start))
          throw new Error('Informe o início no formato HH:MM.');
        if (minutes(start) + duration >= 1440)
          throw new Error('A aula precisa terminar no mesmo dia.');
        const session: Session = {
          id: randomUUID(),
          studentId: sessionStudent,
          date: isoDate(date),
          start,
          end: clock(minutes(start) + duration),
          status: 'scheduled',
          notes,
        };
        saveSession(state, session);
        await onSubmit((s) => saveSession(s, session));
      } else if (editor.kind === 'reminder') {
        if (!name.trim() || name.length > 200)
          throw new Error('Informe um lembrete com até 200 caracteres.');
        const reminder: Reminder = {
          id: randomUUID(),
          title: name.trim(),
          date: isoDate(date),
          done: false,
        };
        await onSubmit((s) => ({ ...s, reminders: [...s.reminders, reminder] }));
      }
    } catch (e) {
      setError(errorText(e));
    }
  }
  return (
    <Sheet
      title={title}
      closeLabel="Cancelar edição"
      onClose={onClose}
      onSave={() => {
        void submit();
      }}
      saving={busy || picking}
    >
      {isProfile && (
        <>
          <View style={{ alignItems: 'center', gap: 12, paddingVertical: 8 }}>
            <Avatar photo={photo} name={name} size={88} />
            <Button
              title={picking ? 'Abrindo fotos…' : photo ? 'Trocar foto' : 'Adicionar foto'}
              secondary
              icon="camera-outline"
              onPress={() => {
                void pickPhoto();
              }}
              disabled={picking}
            />
          </View>
          <Txt style={{ fontSize: 22, fontWeight: '700', textAlign: 'center' }}>
            Esse Core é seu.
          </Txt>
          <Txt muted style={{ textAlign: 'center', lineHeight: 21 }}>
            Seu nome identifica o aplicativo e os relatórios que você compartilha.
          </Txt>
        </>
      )}
      {editor.kind !== 'session' && (
        <Card style={{ padding: 16 }}>
          <Field
            label={editor.kind === 'reminder' ? 'Lembrete' : 'Nome'}
            value={name}
            onChange={setName}
            placeholder={
              editor.kind === 'reminder'
                ? 'Ex.: conversar sobre renovação'
                : isProfile
                  ? 'Como você se chama?'
                  : 'Nome completo'
            }
          />
          {isProfile && (
            <Field
              label="CREF (opcional)"
              value={cref}
              onChange={setCref}
              placeholder="Seu registro profissional"
            />
          )}
          {editor.kind === 'reminder' && (
            <Field
              label="Data do lembrete"
              value={date}
              onChange={(v) => setDate(maskDate(v))}
              keyboard="number-pad"
              placeholder="DD/MM/AAAA"
            />
          )}
          {editor.kind === 'student' && (
            <Field
              label="Telefone com DDD"
              value={phone}
              onChange={(v) => setPhone(phoneInput(v))}
              keyboard="phone-pad"
              placeholder="(49) 99999-9999"
            />
          )}
        </Card>
      )}
      {editor.kind === 'student' && (
        <>
          <Card style={{ padding: 16 }}>
            <Field
              label="Mensalidade (R$)"
              value={fee}
              onChange={(v) => setFee(moneyInput(v, fee))}
              keyboard="decimal-pad"
              placeholder="400,00"
            />
            <Stepper label="Dia do vencimento" value={due} onChange={setDue} min={1} max={31} />
            <Stepper
              label="Vezes por semana"
              value={frequency}
              onChange={setFrequency}
              min={1}
              max={7}
              suffix="x"
            />
          </Card>
          <Txt muted style={{ fontSize: 12, lineHeight: 19 }}>
            Os dias e horários fixos são organizados depois, dentro do perfil do aluno.
          </Txt>
          <Button
            title={optional ? 'Ocultar dados opcionais' : 'Mais dados (opcional)'}
            secondary
            icon={optional ? 'chevron-up' : 'chevron-down'}
            onPress={() => setOptional(!optional)}
          />
          {optional && (
            <Card style={{ padding: 16 }}>
              <Field
                label="Nascimento (opcional)"
                value={birth}
                onChange={(v) => setBirth(maskDate(v))}
                keyboard="number-pad"
                placeholder="DD/MM/AAAA"
              />
              <Field label="Observações (opcional)" value={notes} onChange={setNotes} multiline />
            </Card>
          )}
          {st && (
            <Txt muted style={{ fontSize: 12, lineHeight: 19 }}>
              Valor e vencimento alterados valem para as próximas mensalidades. O histórico já
              gerado é preservado.
            </Txt>
          )}
        </>
      )}
      {editor.kind === 'session' && (
        <>
          <Card style={{ padding: 16 }}>
            <Txt style={{ fontWeight: '700' }}>1. Escolha o aluno</Txt>
            <Field
              label="Buscar aluno para a aula"
              value={studentSearch}
              onChange={setStudentSearch}
              placeholder="Digite o nome"
            />
            {state.students
              .filter(
                (st) =>
                  !st.archivedOn &&
                  st.name
                    .toLocaleLowerCase('pt-BR')
                    .includes(studentSearch.toLocaleLowerCase('pt-BR')),
              )
              .slice(0, 5)
              .map((st) => (
                <Button
                  key={st.id}
                  title={st.name}
                  secondary={sessionStudent !== st.id}
                  onPress={() => setSessionStudent(st.id)}
                />
              ))}
            {state.students.filter((st) => !st.archivedOn).length > 5 && !studentSearch && (
              <Txt muted style={{ fontSize: 12 }}>
                Use a busca para encontrar os demais alunos.
              </Txt>
            )}
          </Card>
          <Card style={{ padding: 16 }}>
            <Txt style={{ fontWeight: '700' }}>2. Defina esta aula</Txt>
            <Field
              label="Data da aula"
              value={date}
              onChange={(v) => setDate(maskDate(v))}
              keyboard="number-pad"
              placeholder="DD/MM/AAAA"
            />
            <Field label="Início (HH:MM)" value={start} onChange={setStart} placeholder="08:00" />
            <Stepper
              label="Duração da aula"
              value={duration}
              onChange={setDuration}
              min={15}
              max={180}
              step={15}
              suffix=" min"
            />
            <Txt muted style={{ fontSize: 12 }}>
              Esta é uma aula avulsa. Para repetir toda semana, organize os horários fixos no perfil
              do aluno.
            </Txt>
          </Card>
        </>
      )}
      <ErrorCard text={error || saveError} />
      {isProfile && (
        <Txt muted style={{ textAlign: 'center', fontSize: 12 }}>
          Tudo fica neste aparelho. Você pode editar seu perfil em Ajustes.
        </Txt>
      )}
    </Sheet>
  );
}

function DayButtons({
  selected,
  onToggle,
}: {
  selected: number[];
  onToggle: (day: number) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {[1, 2, 3, 4, 5, 6, 0].map((d) => (
        <Pressable
          key={d}
          accessibilityRole="button"
          accessibilityLabel={weekNames[d]}
          accessibilityState={{ selected: selected.includes(d) }}
          onPress={() => onToggle(d)}
          style={{
            minWidth: 40,
            minHeight: 44,
            padding: 9,
            flexGrow: 1,
            backgroundColor: selected.includes(d) ? colors.red : colors.field,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Txt style={{ fontSize: 12, fontWeight: '700' }}>{weekNames[d].slice(0, 3)}</Txt>
        </Pressable>
      ))}
    </View>
  );
}
function WorkHoursEditor({ state, busy, saveError, onClose, onSubmit }: EditorProps) {
  const [hours, setHours] = useState<WorkHour[]>(state.profile.workHours);
  const [days, setDays] = useState([1, 2, 3, 4, 5]);
  const [start, setStart] = useState('06:00');
  const [end, setEnd] = useState('11:00');
  const [error, setError] = useState('');
  function add() {
    try {
      if (!days.length) throw new Error('Escolha ao menos um dia da semana.');
      const candidate = [...hours, ...days.map((weekday) => ({ weekday, start, end }))];
      // Validate periods while drafting; existing lessons are checked on save.
      setHours(validateWorkHours({ ...state, weeklySlots: [] }, candidate));
      setError('');
    } catch (e) {
      setError(errorText(e));
    }
  }
  return (
    <Sheet
      title="Meus horários de trabalho"
      closeLabel="Cancelar edição"
      onClose={onClose}
      saving={busy}
      onSave={() => {
        void (async () => {
          try {
            const valid = validateWorkHours(state, hours);
            await onSubmit((s) => ({
              ...s,
              profile: { ...s.profile, workHours: validateWorkHours(s, valid) },
            }));
          } catch (e) {
            setError(errorText(e));
          }
        })();
      }}
    >
      <Txt muted style={{ lineHeight: 22 }}>
        Defina quando você atende. Adicione períodos separados para respeitar almoço e intervalos,
        como 06:00–11:00 e 15:00–20:00.
      </Txt>
      <Card style={{ padding: 16 }}>
        <DayButtons
          selected={days}
          onToggle={(d) => setDays(days.includes(d) ? days.filter((x) => x !== d) : [...days, d])}
        />
        <Field label="Início do período" value={start} onChange={setStart} placeholder="06:00" />
        <Field label="Fim do período" value={end} onChange={setEnd} placeholder="11:00" />
        <Button title="Adicionar período" icon="add" onPress={add} />
      </Card>
      <Txt style={{ fontWeight: '700' }}>Períodos de atendimento</Txt>
      {!hours.length && <Txt muted>Nenhum período definido ainda.</Txt>}
      {[1, 2, 3, 4, 5, 6, 0]
        .filter((d) => hours.some((h) => h.weekday === d))
        .map((d) => (
          <Card key={d} style={{ padding: 16 }}>
            <Txt style={{ fontWeight: '700' }}>{weekNames[d]}</Txt>
            {hours
              .filter((h) => h.weekday === d)
              .map((h) => (
                <View key={`${h.start}-${h.end}`} style={ui.row}>
                  <Txt>
                    {h.start} às {h.end}
                  </Txt>
                  <Button
                    title={`Remover ${weekNames[d]} ${h.start}`}
                    secondary
                    icon="close"
                    iconOnly
                    onPress={() => setHours(hours.filter((x) => x !== h))}
                  />
                </View>
              ))}
          </Card>
        ))}
      <ErrorCard text={error || saveError} />
    </Sheet>
  );
}
function WeeklyEditor({
  state,
  student,
  busy,
  saveError,
  onClose,
  onSubmit,
}: EditorProps & { student: Student }) {
  const [slots, setSlots] = useState(state.weeklySlots);
  const [days, setDays] = useState<number[]>([1]);
  const [start, setStart] = useState('08:00');
  const [duration, setDuration] = useState(60);
  const [error, setError] = useState('');
  const visible = slots.filter(
    (x) => x.studentId === student.id && (!x.endsBefore || x.endsBefore > localDay()),
  );
  function add() {
    try {
      if (!days.length) throw new Error('Escolha ao menos um dia.');
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(start) || minutes(start) + duration >= 1440)
        throw new Error('Confira o início e a duração da aula.');
      let draft = { ...state, weeklySlots: slots };
      for (const weekday of days)
        draft = saveWeeklySlot(draft, {
          id: randomUUID(),
          studentId: student.id,
          weekday,
          start,
          end: clock(minutes(start) + duration),
          from: localDay(),
          endsBefore: null,
        });
      setSlots(draft.weeklySlots);
      setError('');
    } catch (e) {
      setError(errorText(e));
    }
  }
  return (
    <Sheet
      title="Dias e horários do aluno"
      closeLabel="Cancelar edição"
      onClose={onClose}
      saving={busy}
      onSave={() => {
        void onSubmit((s) => ({ ...s, weeklySlots: slots }));
      }}
    >
      <Card style={{ padding: 16 }}>
        <Txt style={{ fontSize: 20, fontWeight: '700' }}>{student.name}</Txt>
        <Txt muted>
          {student.frequency}x por semana no cadastro · {visible.length} horário(s) fixo(s)
          definido(s)
        </Txt>
      </Card>
      <Txt muted style={{ lineHeight: 22 }}>
        Configure com calma depois do cadastro. Estes horários se repetem toda semana, a partir de
        hoje.
      </Txt>
      <Card style={{ padding: 16 }}>
        <DayButtons
          selected={days}
          onToggle={(d) => setDays(days.includes(d) ? days.filter((x) => x !== d) : [...days, d])}
        />
        <Field label="Horário de início" value={start} onChange={setStart} placeholder="08:00" />
        <Stepper
          label="Duração da aula"
          value={duration}
          onChange={setDuration}
          min={15}
          max={180}
          step={15}
          suffix=" min"
        />
        <Button title="Adicionar horário fixo" icon="add" onPress={add} />
      </Card>
      {visible
        .sort(
          (a, b) => ((a.weekday + 6) % 7) - ((b.weekday + 6) % 7) || a.start.localeCompare(b.start),
        )
        .map((slot) => (
          <Card key={slot.id} style={{ padding: 16 }}>
            <View style={ui.row}>
              <View style={{ gap: 5, flex: 1 }}>
                <Txt style={{ fontWeight: '700' }}>{weekNames[slot.weekday]}</Txt>
                <Txt muted>
                  {slot.start} às {slot.end}
                </Txt>
              </View>
              <Button
                title={`Remover horário ${weekNames[slot.weekday]} ${slot.start}`}
                secondary
                icon="close"
                iconOnly
                onPress={() =>
                  setSlots(
                    slots.map((x) => (x.id === slot.id ? { ...x, endsBefore: localDay() } : x)),
                  )
                }
              />
            </View>
          </Card>
        ))}
      <ErrorCard text={error || saveError} />
    </Sheet>
  );
}
