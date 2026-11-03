import { z } from 'zod';
export * from './training';
const optionalText = (max: number) => z.string().trim().max(max);
export const studentSchema = z.object({
  full_name: z.string().trim().min(3, 'Informe pelo menos 3 caracteres.').max(120),
  email: z
    .union([z.literal(''), z.email('Informe um e-mail válido.')])
    .transform((v) => v.toLowerCase()),
  phone: optionalText(30).refine(
    (v) => !v || /^[+()\d\s-]{8,30}$/.test(v),
    'Informe um telefone válido.',
  ),
  birth_date: z.string().refine((v) => {
    if (!v) return true;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
    const date = new Date(v + 'T12:00:00Z');
    return (
      !Number.isNaN(date.getTime()) &&
      date.toISOString().slice(0, 10) === v &&
      v <= localDate() &&
      v >= '1900-01-01'
    );
  }, 'Use AAAA-MM-DD e uma data válida, sem ser futura.'),
  goal: optionalText(1000),
  experience: z.enum(['beginner', 'intermediate', 'advanced']),
  modality: z.enum(['in_person', 'online', 'hybrid']),
  status: z.enum(['active', 'inactive']),
  start_date: z
    .string()
    .refine(
      (v) =>
        /^\d{4}-\d{2}-\d{2}$/.test(v) &&
        !Number.isNaN(Date.parse(v)) &&
        new Date(v + 'T12:00:00Z').toISOString().slice(0, 10) === v,
      'Informe uma data válida.',
    ),
  emergency_name: optionalText(120),
  emergency_phone: optionalText(30).refine(
    (v) => !v || /^[+()\d\s-]{8,30}$/.test(v),
    'Informe um telefone válido.',
  ),
  availability: optionalText(500),
  preferences: optionalText(1000),
});
export type StudentInput = z.infer<typeof studentSchema>;
export type Student = StudentInput & {
  id: string;
  professional_id: string;
  user_id: string | null;
  created_at: string;
  updated_at: string;
};
export type Professional = {
  id: string;
  user_id: string;
  display_name: string;
  created_at: string;
};
export const modalityLabels = { in_person: 'Presencial', online: 'Online', hybrid: 'Híbrido' };
export const experienceLabels = {
  beginner: 'Iniciante',
  intermediate: 'Intermediário',
  advanced: 'Avançado',
};
export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function newStudent(): StudentInput {
  return {
    full_name: '',
    email: '',
    phone: '',
    birth_date: '',
    goal: '',
    experience: 'beginner',
    modality: 'in_person',
    status: 'active',
    start_date: localDate(),
    emergency_name: '',
    emergency_phone: '',
    availability: '',
    preferences: '',
  };
}
export function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((v) => v[0])
      .join('')
      .toUpperCase() || 'C'
  );
}
export function periodStart(period: 'month' | 'quarter' | 'year', now = new Date()) {
  return localDate(
    new Date(
      now.getFullYear(),
      period === 'year'
        ? 0
        : period === 'quarter'
          ? Math.floor(now.getMonth() / 3) * 3
          : now.getMonth(),
      1,
    ),
  );
}
// Providers only return drafts. Publishing requires a separately authorized operation.
export type AIProposal = {
  status: 'draft';
  missingInformation: string[];
  rationale: string;
  workouts: { name: string; exerciseIds: string[] }[];
};
export interface TrainingAIProvider {
  readonly id: string;
  propose(context: { authorizedStudentId: string; instructions: string }): Promise<AIProposal>;
}
