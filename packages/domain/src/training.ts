import { z } from 'zod';

export const exerciseSchema = z.object({
  name: z.string().trim().min(3, 'Informe o nome do exercício.').max(160),
  muscle_group: z.string().trim().min(2, 'Informe o grupo muscular.').max(80),
  equipment: z.string().trim().max(120),
  movement: z.string().trim().max(120),
  complexity: z.enum(['beginner', 'intermediate', 'advanced']),
  instructions: z.string().trim().max(5000),
  video_url: z.union([
    z.literal(''),
    z.url().refine((v) => v.startsWith('https://'), 'Use um endereço HTTPS.'),
  ]),
  tags: z.array(z.string().trim().min(1).max(40)).max(20),
  favorite: z.boolean(),
  archived: z.boolean(),
});
export type ExerciseInput = z.infer<typeof exerciseSchema>;
export type Exercise = ExerciseInput & {
  id: string;
  professional_id: string;
  created_at: string;
  updated_at: string;
};
export const prescriptionExerciseSchema = z.object({
  exercise_id: z.uuid(),
  sets: z.number().int().min(1).max(20),
  repetitions: z.string().trim().max(40),
  load_kg: z.number().min(0).max(2000).nullable(),
  rest_seconds: z.number().int().min(0).max(1800),
  rpe: z.number().min(1).max(10).nullable(),
  rir: z.number().int().min(0).max(10).nullable(),
  tempo: z.string().trim().max(40),
  notes: z.string().trim().max(1000),
});
export const workoutDaySchema = z.object({
  name: z.string().trim().min(1).max(80),
  exercises: z.array(prescriptionExerciseSchema).max(100),
});
export const programSchema = z.object({
  name: z.string().trim().min(3, 'Informe o nome do programa.').max(160),
  student_id: z.uuid('Selecione um aluno.'),
  duration_weeks: z.number().int().min(1).max(104),
  frequency: z.number().int().min(1).max(7),
  notes: z.string().trim().max(2000),
  draft_days: z.array(workoutDaySchema).min(1).max(14),
});
export type PrescriptionExercise = z.infer<typeof prescriptionExerciseSchema>;
export type WorkoutDay = z.infer<typeof workoutDaySchema>;
export type ProgramInput = z.infer<typeof programSchema>;
export type Program = ProgramInput & {
  id: string;
  professional_id: string;
  created_at: string;
  updated_at: string;
};
export type PublishedExercise = PrescriptionExercise & {
  name: string;
  muscle_group: string;
  equipment: string;
  instructions: string;
  video_url: string;
};
export type ProgramSnapshot = {
  name: string;
  duration_weeks: number;
  frequency: number;
  notes: string;
  days: { name: string; exercises: PublishedExercise[] }[];
};
export type ProgramVersion = {
  id: string;
  program_id: string;
  professional_id: string;
  student_id: string;
  revision: number;
  snapshot: ProgramSnapshot;
  approved_by: string;
  published_at: string;
};
export const performedSetSchema = z.object({
  repetitions: z.number().int().min(0).max(1000),
  load_kg: z.number().min(0).max(2000),
  effort: z.number().min(1).max(10).nullable(),
  completed: z.boolean(),
});
export const sessionResultsSchema = z
  .array(z.object({ exercise_id: z.uuid(), sets: z.array(performedSetSchema).min(1).max(30) }))
  .min(1)
  .max(100);
export type SessionResults = z.infer<typeof sessionResultsSchema>;
export type TrainingSession = {
  id: string;
  professional_id: string;
  student_id: string;
  version_id: string;
  workout_index: number;
  results: SessionResults;
  feedback: string;
  duration_minutes: number | null;
  performed_at: string;
  student_name?: string;
  exercise_names?: Record<string, string>;
};
export function newExercise(): ExerciseInput {
  return {
    name: '',
    muscle_group: '',
    equipment: '',
    movement: '',
    complexity: 'beginner',
    instructions: '',
    video_url: '',
    tags: [],
    favorite: false,
    archived: false,
  };
}
export function prescribe(exercise_id: string): PrescriptionExercise {
  return {
    exercise_id,
    sets: 3,
    repetitions: '8–12',
    load_kg: null,
    rest_seconds: 60,
    rpe: null,
    rir: null,
    tempo: '',
    notes: '',
  };
}
