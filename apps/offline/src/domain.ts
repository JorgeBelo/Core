import { z } from 'zod';

const id = z.string().min(1).max(100);
export const day = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const d = new Date(value + 'T12:00:00');
    return !Number.isNaN(d.getTime()) && localDay(d) === value;
  }, 'Data inválida');
const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
const amount = z.number().int().positive().max(999999999);
export const studentSchema = z.object({
  id,
  name: z.string().trim().min(2).max(120),
  phone: z.string().regex(/^\d{10,11}$/),
  birthDate: z.union([z.literal(''), day]),
  feeCents: amount,
  frequency: z.number().int().min(1).max(7),
  dueDay: z.number().int().min(1).max(31),
  startMonth: month,
  archivedOn: day.nullable(),
  notes: z.string().max(2000),
});
const billSchema = z.object({
  id,
  studentId: id,
  month,
  dueDate: day,
  amountCents: amount,
  paidOn: day.nullable(),
});
const reminderSchema = z.object({
  id,
  title: z.string().trim().min(1).max(200),
  date: day,
  done: z.boolean(),
});
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const weekday = z.number().int().min(0).max(6);
export const workHourSchema = z
  .object({ weekday, start: time, end: time })
  .refine((x) => x.end > x.start, 'O fim do período deve ser após o início.');
export const weeklySlotSchema = z
  .object({
    id,
    studentId: id,
    weekday,
    start: time,
    end: time,
    from: day,
    endsBefore: day.nullable(),
  })
  .refine((x) => x.end > x.start, 'O fim da aula deve ser após o início.');
export const sessionSchema = z
  .object({
    id,
    studentId: id,
    date: day,
    start: time,
    end: time,
    status: z.enum(['scheduled', 'done', 'canceled']),
    notes: z.string().max(1000),
    weeklySlotId: id.optional(),
  })
  .refine((x) => x.end > x.start, 'O término deve ser após o início.');
export const stateSchema = z
  .object({
    version: z.literal(1),
    profile: z.object({
      name: z.string().max(120),
      cref: z.string().max(50),
      photo: z
        .string()
        .max(3000000)
        .regex(/^(|data:image\/jpeg;base64,[A-Za-z0-9+/=]+)$/)
        .default(''),
      setupComplete: z.boolean().default(false),
      workHours: z.array(workHourSchema).max(70).default([]),
    }),
    students: z.array(studentSchema).max(10000),
    bills: z.array(billSchema).max(240000),
    reminders: z.array(reminderSchema).max(10000),
    sessions: z.array(sessionSchema).max(100000).default([]),
    weeklySlots: z.array(weeklySlotSchema).max(50000).default([]),
  })
  .superRefine((s, ctx) => {
    for (const rows of [s.students, s.bills, s.reminders, s.sessions, s.weeklySlots]) {
      if (new Set(rows.map((r) => r.id)).size !== rows.length)
        ctx.addIssue({ code: 'custom', message: 'Identificadores duplicados no backup' });
    }
    const students = new Map(s.students.map((s) => [s.id, s]));
    for (const row of s.weeklySlots) {
      if (!students.has(row.studentId))
        ctx.addIssue({ code: 'custom', message: 'Aluno do horário fixo não encontrado' });
    }
    for (const row of s.sessions) {
      if (!students.has(row.studentId))
        ctx.addIssue({ code: 'custom', message: 'Aluno da agenda não encontrado' });
    }
    const keys = new Set<string>();
    for (const b of s.bills) {
      const key = `${b.studentId}:${b.month}`;
      if (
        !students.has(b.studentId) ||
        keys.has(key) ||
        !b.dueDate.startsWith(b.month) ||
        b.month < students.get(b.studentId)!.startMonth
      )
        ctx.addIssue({ code: 'custom', message: 'Mensalidade inválida ou duplicada no backup' });
      keys.add(key);
    }
  });
export type Student = z.infer<typeof studentSchema>;
export type Bill = z.infer<typeof billSchema>;
export type CoreState = z.infer<typeof stateSchema>;
export type Reminder = CoreState['reminders'][number];
export type Session = CoreState['sessions'][number];
export type WeeklySlot = CoreState['weeklySlots'][number];
export type WorkHour = CoreState['profile']['workHours'][number];
export type DaySession = Session & { virtual?: boolean };
export const emptyState = (): CoreState => ({
  version: 1,
  profile: { name: '', cref: '', photo: '', setupComplete: false, workHours: [] },
  students: [],
  bills: [],
  reminders: [],
  sessions: [],
  weeklySlots: [],
});
export function localDay(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export const currentMonth = () => localDay().slice(0, 7);
export function shiftMonth(m: string, shift: number) {
  const [year, mo] = m.split('-').map(Number);
  return localDay(new Date(year, mo - 1 + shift, 1, 12)).slice(0, 7);
}
export function dueDate(m: string, due: number) {
  const [year, mo] = m.split('-').map(Number);
  return `${m}-${String(Math.min(due, new Date(year, mo, 0).getDate())).padStart(2, '0')}`;
}
// Every generated bill is a snapshot. Editing a student cannot rewrite old bills.
// Backfill months missed while the installed app was closed, including arrears.
export function reconcile(s: CoreState, now = currentMonth()): CoreState {
  const keys = new Set(s.bills.map((b) => `${b.studentId}:${b.month}`));
  const added: Bill[] = [];
  for (const st of s.students) {
    const end = st.archivedOn ? [now, st.archivedOn.slice(0, 7)].sort()[0] : now;
    // Imports are bounded: refuse unexpectedly large time ranges, never truncate.
    const months =
      (Number(end.slice(0, 4)) - Number(st.startMonth.slice(0, 4))) * 12 +
      Number(end.slice(5)) -
      Number(st.startMonth.slice(5));
    if (months > 1200)
      throw new Error('Período de mensalidades inválido. Confira o backup e a data do aparelho.');
    for (let m = st.startMonth; m <= end; m = shiftMonth(m, 1)) {
      const key = `${st.id}:${m}`;
      if (!keys.has(key))
        added.push({
          id: key,
          studentId: st.id,
          month: m,
          dueDate: dueDate(m, st.dueDay),
          amountCents: st.feeCents,
          paidOn: null,
        });
    }
  }
  return added.length ? { ...s, bills: [...s.bills, ...added] } : s;
}
export function saveStudent(s: CoreState, student: Student, now = currentMonth()): CoreState {
  const valid = studentSchema.parse(student);
  const ready = reconcile(s, now);
  const exists = ready.students.some((st) => st.id === valid.id);
  return reconcile(
    {
      ...ready,
      students: exists
        ? ready.students.map((st) => (st.id === valid.id ? valid : st))
        : [...ready.students, valid],
    },
    now,
  );
}
export const money = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const displayDay = (value: string) => value.split('-').reverse().join('/');
export function monthLabel(m: string) {
  const [year, mo] = m.split('-').map(Number);
  return new Date(year, mo - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}
export const status = (b: Bill, today = localDay()) =>
  b.paidOn
    ? 'Pago'
    : b.dueDate < today
      ? 'Em atraso'
      : b.dueDate === today
        ? 'Vence hoje'
        : 'A vencer';
export function totals(bills: Bill[], today = localDay()) {
  const sum = (rows: Bill[]) => rows.reduce((t, b) => t + b.amountCents, 0);
  return {
    expected: sum(bills),
    received: sum(bills.filter((b) => b.paidOn)),
    pending: sum(bills.filter((b) => !b.paidOn)),
    overdue: sum(bills.filter((b) => !b.paidOn && b.dueDate < today)),
  };
}
export function whatsappMessage(st: Student, b: Bill, today = localDay()) {
  const phrase =
    b.dueDate < today
      ? `venceu em ${displayDay(b.dueDate)} e consta em aberto`
      : `vence em ${displayDay(b.dueDate)}`;
  return `Olá, ${st.name}! Tudo bem? Passando para lembrar que sua mensalidade de ${monthLabel(b.month)}, no valor de ${money(b.amountCents)}, ${phrase}. Se já realizou o pagamento, por favor me avise para eu atualizar o controle. Obrigado!`;
}
export function whatsappUrl(st: Student, message: string) {
  return `https://wa.me/55${st.phone}?text=${encodeURIComponent(message)}`;
}
export function parseBackup(text: string): CoreState {
  if (text.length > 20_000_000) throw new Error('Backup excede o limite de 20 MB.');
  const data = JSON.parse(text);
  if (data.format !== 'core-personal-backup')
    throw new Error('Este arquivo não é um backup do CORE offline.');
  return stateSchema.parse(data.state);
}
export const backupText = (s: CoreState) =>
  JSON.stringify(
    {
      format: 'core-personal-backup',
      exportedAt: new Date().toISOString(),
      state: stateSchema.parse(s),
    },
    null,
    2,
  );
export function saveSession(s: CoreState, input: Session): CoreState {
  const session = sessionSchema.parse(input);
  if (!s.students.some((st) => st.id === session.studentId && !st.archivedOn))
    throw new Error('Escolha um aluno ativo.');
  if (
    session.status !== 'canceled' &&
    sessionsForDate(s, session.date).some(
      (row) =>
        row.id !== session.id &&
        (!session.weeklySlotId || row.weeklySlotId !== session.weeklySlotId) &&
        row.status !== 'canceled' &&
        row.date === session.date &&
        row.start < session.end &&
        row.end > session.start,
    )
  )
    throw new Error('Este horário coincide com outro atendimento. Escolha um horário livre.');
  if (
    session.status === 'scheduled' &&
    s.profile.workHours.length &&
    !insideWorkHours(
      s.profile.workHours,
      new Date(session.date + 'T12:00:00').getDay(),
      session.start,
      session.end,
    )
  )
    throw new Error('Este horário está fora dos seus períodos de atendimento.');
  return {
    ...s,
    sessions: s.sessions.some((row) => row.id === session.id)
      ? s.sessions.map((row) => (row.id === session.id ? session : row))
      : [...s.sessions, session],
  };
}
export const weekNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
export function minutes(value: string) {
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
}
export function clock(value: number) {
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
}
export function insideWorkHours(hours: WorkHour[], weekday: number, start: string, end: string) {
  return hours.some((h) => h.weekday === weekday && h.start <= start && h.end >= end);
}
export function sessionsForDate(s: CoreState, date: string): DaySession[] {
  const actual = s.sessions.filter((row) => row.date === date);
  const overridden = new Set(actual.map((row) => row.weeklySlotId).filter(Boolean));
  const weekday = new Date(date + 'T12:00:00').getDay();
  const recurring: DaySession[] = s.weeklySlots
    .filter((slot) => {
      const student = s.students.find((st) => st.id === slot.studentId);
      return (
        slot.weekday === weekday &&
        slot.from <= date &&
        (!slot.endsBefore || date < slot.endsBefore) &&
        student &&
        (!student.archivedOn || date < student.archivedOn) &&
        !overridden.has(slot.id)
      );
    })
    .map((slot) => ({
      id: `weekly:${slot.id}:${date}`,
      studentId: slot.studentId,
      date,
      start: slot.start,
      end: slot.end,
      status: 'scheduled',
      notes: '',
      weeklySlotId: slot.id,
      virtual: true,
    }));
  return [...actual, ...recurring].sort((a, b) => a.start.localeCompare(b.start));
}
export function setDaySessionStatus(
  s: CoreState,
  row: DaySession,
  status: Session['status'],
): CoreState {
  const saved = sessionSchema.parse({ ...row, status });
  return {
    ...s,
    sessions: s.sessions.some((x) => x.id === row.id)
      ? s.sessions.map((x) => (x.id === row.id ? saved : x))
      : [...s.sessions, saved],
  };
}
export function validateWorkHours(s: CoreState, input: WorkHour[]): WorkHour[] {
  const hours = z
    .array(workHourSchema)
    .max(70)
    .parse(input)
    .sort((a, b) => a.weekday - b.weekday || a.start.localeCompare(b.start));
  for (let i = 1; i < hours.length; i++)
    if (hours[i].weekday === hours[i - 1].weekday && hours[i].start < hours[i - 1].end)
      throw new Error('Há períodos de trabalho sobrepostos no mesmo dia.');
  for (const slot of s.weeklySlots.filter(
    (x) =>
      (!x.endsBefore || x.endsBefore > localDay()) &&
      s.students.some((st) => st.id === x.studentId && !st.archivedOn),
  )) {
    if (!insideWorkHours(hours, slot.weekday, slot.start, slot.end))
      throw new Error(
        `Existe uma aula fixa na ${weekNames[slot.weekday].toLowerCase()} às ${slot.start}. Ajuste esse horário do aluno antes de reduzir seu expediente.`,
      );
  }
  return hours;
}
export function saveWeeklySlot(s: CoreState, input: WeeklySlot): CoreState {
  const slot = weeklySlotSchema.parse(input);
  if (!s.students.some((st) => st.id === slot.studentId && !st.archivedOn))
    throw new Error('Escolha um aluno ativo.');
  if (
    s.profile.workHours.length &&
    !insideWorkHours(s.profile.workHours, slot.weekday, slot.start, slot.end)
  )
    throw new Error('Este horário está fora dos seus períodos de atendimento.');
  const overlaps = (x: { start: string; end: string }) => x.start < slot.end && x.end > slot.start;
  if (
    s.weeklySlots.some(
      (x) =>
        x.id !== slot.id &&
        x.weekday === slot.weekday &&
        overlaps(x) &&
        x.from < (slot.endsBefore ?? '9999-12-31') &&
        slot.from < (x.endsBefore ?? '9999-12-31') &&
        s.students.some((st) => st.id === x.studentId && !st.archivedOn),
    )
  )
    throw new Error('Já existe uma aula fixa neste horário. Escolha outro período.');
  if (
    s.sessions.some(
      (x) =>
        x.status !== 'canceled' &&
        x.weeklySlotId !== slot.id &&
        x.date >= slot.from &&
        (!slot.endsBefore || x.date < slot.endsBefore) &&
        new Date(x.date + 'T12:00:00').getDay() === slot.weekday &&
        overlaps(x),
    )
  )
    throw new Error('Uma aula avulsa já ocupa uma das próximas datas deste horário.');
  return {
    ...s,
    weeklySlots: s.weeklySlots.some((x) => x.id === slot.id)
      ? s.weeklySlots.map((x) => (x.id === slot.id ? slot : x))
      : [...s.weeklySlots, slot],
  };
}
export function freeRanges(s: CoreState, date: string): { start: string; end: string }[] {
  const weekday = new Date(date + 'T12:00:00').getDay();
  const busy = sessionsForDate(s, date).filter((x) => x.status !== 'canceled');
  const result: { start: string; end: string }[] = [];
  for (const work of s.profile.workHours.filter((h) => h.weekday === weekday)) {
    let ranges = [{ start: work.start, end: work.end }];
    for (const block of busy)
      ranges = ranges.flatMap((r) =>
        block.end <= r.start || block.start >= r.end
          ? [r]
          : [
              ...(block.start > r.start ? [{ start: r.start, end: block.start }] : []),
              ...(block.end < r.end ? [{ start: block.end, end: r.end }] : []),
            ],
      );
    result.push(...ranges);
  }
  return result.sort((a, b) => a.start.localeCompare(b.start));
}
