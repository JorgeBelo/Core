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
          setUserProfile({
            id: data.id,
            name: data.name || data.full_name || authUser.name || 'Personal Trainer',
            email: data.email || authUser.email,
            phone: data.phone || authUser.phone,
            cref: data.cref || authUser.cref,
            avatar_url: data.avatar_url || data.avatar || authUser.avatar_url,
            created_at: data.created_at || authUser.created_at,
            updated_at: data.updated_at || authUser.updated_at,
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

    try {
      const { error } = await supabase
        .from('users')
        .upsert({
          id: authUser.id,
          ...updates,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id',
        });

      if (error) throw error;

      setUserProfile((prev) => (prev ? { ...prev, ...updates } : null));
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      throw error;
    }
  };

  return { userProfile, loading, updateProfile };
};
