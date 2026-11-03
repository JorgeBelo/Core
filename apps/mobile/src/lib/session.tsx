import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { supabase, repository } from './backend';
import type { Professional, Student } from '@core/domain';
type State = {
  session: Session | null;
  professional: Professional | null;
  student: Student | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
};
const Context = createContext<State>({
  session: null,
  professional: null,
  student: null,
  loading: true,
  error: null,
  reload: () => {},
});
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(!supabase);
  const [profile, setProfile] = useState<{
    professional: Professional | null;
    student: Student | null;
  }>({ professional: null, student: null });
  const [loading, setLoading] = useState(false),
    [error, setError] = useState<string | null>(null),
    [attempt, setAttempt] = useState(0);
  const cache = useQueryClient();
  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (alive) {
        setSession(data.session);
        setReady(true);
        if (error) setError('Não foi possível restaurar a sessão.');
      }
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      if (alive) {
        setSession(next);
        setReady(true);
      }
    });
    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    let alive = true;
    cache.clear();
    setProfile({ professional: null, student: null });
    setError(null);
    if (!session) {
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      try {
        const professional = await repository!.professional(session.user.id);
        const student = professional ? null : await repository!.ownStudent();
        if (alive) setProfile({ professional, student });
      } catch {
        if (alive)
          setError(
            'Não foi possível carregar seu perfil. Verifique a conexão e as migrações do banco.',
          );
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [session?.user.id, attempt]);
  return (
    <Context.Provider
      value={{
        session,
        ...profile,
        loading: !ready || loading,
        error,
        reload: () => setAttempt((v) => v + 1),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useSession = () => useContext(Context);
