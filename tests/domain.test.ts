import { describe, it, expect } from 'vitest';
import { studentSchema, newStudent, periodStart, initials } from '../packages/domain/src/index';
describe('Student validation', () => {
  it('rejects incomplete registrations', () => {
    expect(studentSchema.safeParse(newStudent()).success).toBe(false);
  });
  it('accepts minimum required data without inventing optional data', () => {
    const s = studentSchema.parse({ ...newStudent(), full_name: '  Aluno de teste  ' });
    expect(s.full_name).toBe('Aluno de teste');
    expect(s.email).toBe('');
  });
  it.each(['2039-01-01', '2025-02-30', '2025-13-01', 'ontem'])(
    'rejects invalid birth date %s',
    (birth_date) => {
      expect(
        studentSchema.safeParse({ ...newStudent(), full_name: 'Teste', birth_date }).success,
      ).toBe(false);
    },
  );
  it('validates emails, phones and enums', () => {
    for (const field of [
      { email: 'inválido' },
      { phone: 'telefone' },
      { status: 'unknown' },
      { modality: 'unknown' },
      { start_date: '2026-02-30' },
    ])
      expect(
        studentSchema.safeParse({ ...newStudent(), full_name: 'Teste', ...field }).success,
      ).toBe(false);
  });
  it('calculates periods without UTC day shifts', () => {
    const date = new Date(2026, 10, 3);
    expect(periodStart('month', date)).toBe('2026-11-01');
    expect(periodStart('quarter', date)).toBe('2026-10-01');
    expect(periodStart('year', date)).toBe('2026-01-01');
  });
  it('uses only the first two name initials', () => {
    expect(initials('  Maria Silva Souza ')).toBe('MS');
  });
});
