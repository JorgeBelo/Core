import { describe, expect, it } from 'vitest';
import { saveSession, Session } from '../apps/offline/src/domain';
import {
  Student,
  backupText,
  day,
  dueDate,
  emptyState,
  parseBackup,
  reconcile,
  saveStudent,
  status,
  totals,
  whatsappMessage,
  whatsappUrl,
} from '../apps/offline/src/domain';
const student: Student = {
  id: 'student-a',
  name: 'Aluno de teste',
  phone: '11999990000',
  feeCents: 40000,
  frequency: 3,
  dueDay: 31,
  startMonth: '2026-01',
  birthDate: '',
  notes: '',
  archivedOn: null,
};
describe('Core offline — mensalidades e recuperação', () => {
  it('impede choque de agenda e permite horários adjacentes ou cancelados', () => {
    const initial = saveStudent(emptyState(), student, '2026-01');
    const session: Session = {
      id: 'session-a',
      studentId: student.id,
      date: '2026-01-15',
      start: '08:00',
      end: '09:00',
      status: 'scheduled',
      notes: '',
    };
    const s = saveSession(initial, session);
    expect(() => saveSession(s, { ...session, id: 'b', start: '08:30' })).toThrow('coincide');
    expect(
      saveSession(s, { ...session, id: 'b', start: '09:00', end: '10:00' }).sessions,
    ).toHaveLength(2);
    const canceled = { ...s, sessions: [{ ...session, status: 'canceled' as const }] };
    expect(saveSession(canceled, { ...session, id: 'b' }).sessions).toHaveLength(2);
    expect(() => saveSession(s, { ...session, studentId: 'missing' })).toThrow();
  });
  it('gera os meses perdidos, sem duplicar nem apagar pagamentos', () => {
    const initial = saveStudent(emptyState(), student, '2026-01');
    initial.bills[0].paidOn = '2026-01-10';
    const updated = reconcile(initial, '2026-03');
    expect(updated.bills).toHaveLength(3);
    expect(updated.bills[0].paidOn).toBe('2026-01-10');
    expect(reconcile(updated, '2026-03')).toBe(updated);
    expect(updated.bills[1].dueDate).toBe('2026-02-28');
  });
  it('alterar mensalidade preserva os valores e vencimentos já gerados', () => {
    const initial = saveStudent(emptyState(), student, '2026-01');
    const updated = saveStudent(initial, { ...student, feeCents: 60000, dueDay: 5 }, '2026-02');
    expect(updated.bills.map((b) => b.amountCents)).toEqual([40000, 40000]);
    expect(reconcile(updated, '2026-03').bills[2]).toMatchObject({
      amountCents: 60000,
      dueDate: '2026-03-05',
    });
  });
  it('arquivar preserva dívidas e interrompe geração após o mês final', () => {
    const initial = saveStudent(emptyState(), student, '2026-01');
    initial.students[0].archivedOn = '2026-02-15';
    const updated = reconcile(initial, '2026-05');
    expect(updated.bills).toHaveLength(2);
    expect(totals(updated.bills, '2026-05-10')).toEqual({
      expected: 80000,
      received: 0,
      pending: 80000,
      overdue: 80000,
    });
  });
  it('classifica somente as não pagas e vencidas como atrasadas', () => {
    const s = saveStudent(emptyState(), student, '2026-01');
    expect(status(s.bills[0], '2026-01-30')).toBe('A vencer');
    expect(status(s.bills[0], '2026-01-31')).toBe('Vence hoje');
    expect(status(s.bills[0], '2026-02-01')).toBe('Em atraso');
    s.bills[0].paidOn = '2026-01-20';
    expect(status(s.bills[0], '2026-02-01')).toBe('Pago');
    expect(totals(s.bills, '2026-02-01')).toMatchObject({ received: 40000, overdue: 0 });
  });
  it('restaura o estado integral e rejeita backup duplicado ou inconsistente', () => {
    const s = saveStudent(emptyState(), student, '2026-01');
    expect(parseBackup(backupText(s))).toEqual(s);
    const obj = JSON.parse(backupText(s));
    obj.state.bills.push({ ...obj.state.bills[0], id: 'different' });
    expect(() => parseBackup(JSON.stringify(obj))).toThrow();
    expect(() => parseBackup('{}')).toThrow();
    obj.state.bills.pop();
    obj.state.bills[0].studentId = 'missing';
    expect(() => parseBackup(JSON.stringify(obj))).toThrow();
  });
  it('valida datas reais e ajusta o último dia em ano bissexto', () => {
    expect(day.safeParse('2026-02-30').success).toBe(false);
    expect(dueDate('2028-02', 31)).toBe('2028-02-29');
    expect(() => saveStudent(emptyState(), { ...student, dueDay: 0 }, '2026-01')).toThrow();
    expect(() => saveStudent(emptyState(), { ...student, feeCents: -1 }, '2026-01')).toThrow();
  });
  it('monta mensagem adequada ao vencimento e telefone limpo para revisão manual', () => {
    const b = saveStudent(emptyState(), student, '2026-01').bills[0];
    expect(whatsappMessage(student, b, '2026-01-10')).toContain('vence em 31/01/2026');
    const late = whatsappMessage(student, b, '2026-02-10');
    expect(late).toContain('venceu em 31/01/2026');
    expect(late).toContain('400,00');
    expect(new URL(whatsappUrl(student, late)).searchParams.get('text')).toBe(late);
    expect(whatsappUrl(student, late)).toContain('wa.me/5511999990000');
  });
});
