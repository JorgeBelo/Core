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
export const sessionSchema = z
  .object({
    id,
    studentId: id,
    date: day,
    start: time,
    end: time,
    status: z.enum(['scheduled', 'done', 'canceled']),
    notes: z.string().max(1000),
  })
  .refine((x) => x.end > x.start, 'O término deve ser após o início.');
export const stateSchema = z
  .object({
    version: z.literal(1),
    profile: z.object({ name: z.string().max(120), cref: z.string().max(50) }),
    students: z.array(studentSchema).max(10000),
    bills: z.array(billSchema).max(240000),
    reminders: z.array(reminderSchema).max(10000),
    sessions: z.array(sessionSchema).max(100000).default([]),
  })
  .superRefine((s, ctx) => {
    for (const rows of [s.students, s.bills, s.reminders, s.sessions]) {
      if (new Set(rows.map((r) => r.id)).size !== rows.length)
        ctx.addIssue({ code: 'custom', message: 'Identificadores duplicados no backup' });
    }
    const students = new Map(s.students.map((s) => [s.id, s]));
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
export const emptyState = (): CoreState => ({
  version: 1,
  profile: { name: '', cref: '' },
  students: [],
  bills: [],
  reminders: [],
  sessions: [],
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
    s.sessions.some(
      (row) =>
        row.id !== session.id &&
        row.status !== 'canceled' &&
        row.date === session.date &&
        row.start < session.end &&
        row.end > session.start,
    )
  )
    throw new Error('Este horário coincide com outro atendimento. Escolha um horário livre.');
  return {
    ...s,
    sessions: s.sessions.some((row) => row.id === session.id)
      ? s.sessions.map((row) => (row.id === session.id ? session : row))
      : [...s.sessions, session],
  };
}
