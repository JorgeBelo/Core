import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import type { User } from '../types';

export const useUserProfile = () => {
  const { user: authUser } = useAuth();
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authUser?.id) {
      setLoading(false);
      return;
    }

    const loadUserProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (error && error.code !== 'PGRST116') throw error;

        if (data) {
          const rawDays = data.agenda_working_days;
          let agendaWorkingDays: number[] | undefined;
          if (rawDays == null) {
            agendaWorkingDays = undefined;
          } else if (Array.isArray(rawDays)) {
            agendaWorkingDays = rawDays;
          } else if (typeof rawDays === 'string') {
            try {
              agendaWorkingDays = JSON.parse(rawDays || '[]') as number[];
            } catch {
              agendaWorkingDays = undefined;
            }
          } else {
            agendaWorkingDays = undefined;
          }
          setUserProfile({
            id: data.id,
            name: data.name || data.full_name || authUser.name || 'Personal Trainer',
            email: data.email || authUser.email,
            phone: data.phone || authUser.phone,
            cref: data.cref || authUser.cref,
            avatar_url: data.avatar_url || data.avatar || authUser.avatar_url,
            created_at: data.created_at || authUser.created_at,
            updated_at: data.updated_at || authUser.updated_at,
            agenda_working_days: agendaWorkingDays,
            agenda_hora_inicio: data.agenda_hora_inicio ?? undefined,
            agenda_hora_fim: data.agenda_hora_fim ?? undefined,
          });
        } else {
          // Se não existe no banco, usa dados do auth
          setUserProfile(authUser);
        }
      } catch (error: any) {
        console.error('Erro ao carregar perfil do usuário:', error);
        // Em caso de erro, usa dados do auth
        setUserProfile(authUser);
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [authUser]);

  const updateProfile = async (updates: Partial<User>) => {
    if (!authUser?.id) return;

    const isAgendaOnly =
      updates.agenda_working_days !== undefined &&
      updates.agenda_hora_inicio !== undefined &&
      updates.agenda_hora_fim !== undefined &&
      Object.keys(updates).every((k) =>
        ['agenda_working_days', 'agenda_hora_inicio', 'agenda_hora_fim'].includes(k)
      );

    try {
      if (isAgendaOnly) {
        const { error } = await supabase
          .from('users')
          .update({
            agenda_working_days: updates.agenda_working_days,
            agenda_hora_inicio: updates.agenda_hora_inicio,
            agenda_hora_fim: updates.agenda_hora_fim,
            updated_at: new Date().toISOString(),
          })
          .eq('id', authUser.id);

        if (error) throw error;

        setUserProfile((prev) =>
          prev ? { ...prev, ...updates } : null
        );
        return true;
      }

      const safeName =
        updates.name ||
        userProfile?.name ||
        authUser.name ||
        'Personal Trainer';

      const safeEmail =
        updates.email ||
        userProfile?.email ||
        authUser.email ||
        'sem-email@exemplo.com';

      const safePhone =
        updates.phone !== undefined
          ? updates.phone
          : userProfile?.phone || authUser.phone || '';

      const safeCref =
        updates.cref !== undefined
          ? updates.cref
          : userProfile?.cref || authUser.cref || '';

      const safeAvatarUrl =
        updates.avatar_url !== undefined
          ? updates.avatar_url
          : userProfile?.avatar_url || authUser.avatar_url || '';

      const { error } = await supabase
        .from('users')
        .upsert({
          id: authUser.id,
          name: safeName,
          email: safeEmail,
          phone: safePhone,
          cref: safeCref,
          avatar_url: safeAvatarUrl,
          ...updates,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id',
        });

      if (error) throw error;

      setUserProfile((prev) =>
        prev
          ? {
              ...prev,
              name: safeName,
              email: safeEmail,
              phone: safePhone,
              cref: safeCref,
              avatar_url: safeAvatarUrl,
              ...updates,
            }
          : null
      );
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      throw error;
    }
  };

  return { userProfile, loading, updateProfile };
};
