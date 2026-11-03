import type { SupabaseClient } from '@supabase/supabase-js';
import {
  exerciseSchema,
  programSchema,
  sessionResultsSchema,
  type Exercise,
  type ExerciseInput,
  type Program,
  type ProgramInput,
  type ProgramVersion,
  type SessionResults,
  type TrainingSession,
} from '@core/domain';
export function createTrainingRepository(client: SupabaseClient) {
  return {
    async exercises(search = '', page = 0, group = '', favorites = false) {
      let query = client
        .from('exercises')
        .select('*', { count: 'exact' })
        .eq('archived', false)
        .order('name')
        .order('id')
        .range(page * 20, page * 20 + 19);
      const term = search
        .replace(/[%_\\(),.*]/g, '')
        .trim()
        .slice(0, 160);
      if (term) query = query.ilike('name', `%${term}%`);
      if (group) query = query.eq('muscle_group', group);
      if (favorites) query = query.eq('favorite', true);
      const { data, count, error } = await query;
      if (error) throw error;
      return { items: (data ?? []) as Exercise[], count: count ?? 0 };
    },
    async exercise(id: string): Promise<Exercise> {
      const { data, error } = await client.from('exercises').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    async saveExercise(
      input: ExerciseInput,
      professionalId: string,
      existing?: Exercise,
    ): Promise<Exercise> {
      const values = exerciseSchema.parse(input);
      const request = existing
        ? client
            .from('exercises')
            .update(values)
            .eq('id', existing.id)
            .eq('updated_at', existing.updated_at)
        : client.from('exercises').insert({ ...values, professional_id: professionalId });
      const { data, error } = await request.select().maybeSingle();
      if (error) throw error;
      if (!data)
        throw new Error('Este cadastro foi alterado em outra sessão. Recarregue antes de salvar.');
      return data;
    },
    async programs(page = 0, studentId?: string) {
      let query = client
        .from('training_programs')
        .select('*', { count: 'exact' })
        .order('updated_at', { ascending: false })
        .range(page * 20, page * 20 + 19);
      if (studentId) query = query.eq('student_id', studentId);
      const { data, count, error } = await query;
      if (error) throw error;
      return { items: (data ?? []) as Program[], count: count ?? 0 };
    },
    async program(id: string): Promise<Program> {
      const { data, error } = await client
        .from('training_programs')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    async saveProgram(
      input: ProgramInput,
      professionalId: string,
      existing?: Program,
    ): Promise<Program> {
      const values = programSchema.parse(input);
      const { student_id, ...editable } = values;
      const request = existing
        ? client
            .from('training_programs')
            .update(editable)
            .eq('id', existing.id)
            .eq('updated_at', existing.updated_at)
        : client.from('training_programs').insert({ ...values, professional_id: professionalId });
      const { data, error } = await request.select().maybeSingle();
      if (error) throw error;
      if (!data)
        throw new Error('Este cadastro foi alterado em outra sessão. Recarregue antes de salvar.');
      return data;
    },
    async publish(program: Program): Promise<string> {
      const { data, error } = await client.rpc('publish_program', {
        p_program_id: program.id,
        p_expected_updated_at: program.updated_at,
      });
      if (error) throw error;
      return data;
    },
    async versions(studentId?: string): Promise<ProgramVersion[]> {
      let query = client
        .from('program_versions')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(20);
      if (studentId) query = query.eq('student_id', studentId);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    async sessions(studentId?: string, withContext = false): Promise<TrainingSession[]> {
      let query = client
        .from('training_sessions')
        .select('*')
        .order('performed_at', { ascending: false })
        .limit(30);
      if (studentId) query = query.eq('student_id', studentId);
      const { data, error } = await query;
      if (error) throw error;
      if (withContext && data?.length) {
        const [students, versions] = await Promise.all([
          client
            .from('students')
            .select('id,full_name')
            .in('id', [...new Set(data.map((v) => v.student_id))]),
          client
            .from('program_versions')
            .select('id,snapshot')
            .in('id', [...new Set(data.map((v) => v.version_id))]),
        ]);
        if (students.error) throw students.error;
        if (versions.error) throw versions.error;
        return data.map((row) => ({
          ...row,
          student_name:
            students.data?.find((s) => s.id === row.student_id)?.full_name ?? 'Aluno indisponível',
          exercise_names: Object.fromEntries(
            (
              versions.data?.find((v) => v.id === row.version_id)?.snapshot as
                | ProgramVersion['snapshot']
                | undefined
            )?.days.flatMap((d) => d.exercises.map((e) => [e.exercise_id, e.name])) ?? [],
          ),
        }));
      }
      return data ?? [];
    },
    async finish(
      versionId: string,
      workoutIndex: number,
      results: SessionResults,
      feedback: string,
      duration: number | null,
      key: string,
    ): Promise<string> {
      sessionResultsSchema.parse(results);
      const { data, error } = await client.rpc('record_training_session', {
        p_version_id: versionId,
        p_workout_index: workoutIndex,
        p_results: results,
        p_feedback: feedback,
        p_duration_minutes: duration,
        p_idempotency_key: key,
      });
      if (error) throw error;
      return data;
    },
  };
}
