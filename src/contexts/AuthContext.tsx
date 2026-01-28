import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';
import { supabase } from '../lib/supabaseClient';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Verifica se há usuário salvo no localStorage ao inicializar
  const [user, setUser] = useState<User | null>(() => {
    // Tenta carregar do localStorage (para evitar layout shift),
    // mas isso será sempre sincronizado com o Supabase Auth em seguida.
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  /**
   * Mapeia o usuário do Supabase Auth para o tipo User da aplicação.
   */
  const mapSupabaseUserToAppUser = (authUser: any): User => {
    const metadata = authUser.user_metadata || {};

    return {
      id: authUser.id, // UUID vindo diretamente do Supabase Auth
      name:
        metadata.name ||
        metadata.full_name ||
        authUser.email?.split('@')[0] ||
        'Personal Trainer',
      email: authUser.email || '',
      phone: metadata.phone || '',
      cref: metadata.cref || '',
      avatar_url: metadata.avatar_url || metadata.avatar_url,
      created_at: authUser.created_at,
      updated_at: authUser.updated_at,
    };
  };

  /**
   * Sincroniza o estado do AuthContext com o Supabase Auth (auth.getUser()).
   * Garante que sempre usamos um UUID válido como id/personal_id.
   */
  const syncUserFromSupabase = async () => {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      console.error('Erro ao obter usuário autenticado do Supabase:', error);
      setUser(null);
      localStorage.removeItem('user');
      return;
    }

    if (data?.user) {
      const appUser = mapSupabaseUserToAppUser(data.user);
      setUser(appUser);
      localStorage.setItem('user', JSON.stringify(appUser));
    } else {
      setUser(null);
      localStorage.removeItem('user');
    }
  };

  // Ao montar o provider, sincroniza com o Supabase Auth
  useEffect(() => {
    void syncUserFromSupabase();
  }, []);

  const login = async (email: string, password: string) => {
    // Usa autenticação do Supabase em vez de mock com id '1'
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Erro no login Supabase:', error);
      throw error;
    }

    // Após login bem-sucedido, sincroniza o usuário autenticado
    await syncUserFromSupabase();
  };

  const logout = () => {
    // Faz signOut no Supabase e limpa o contexto/localStorage
    void supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('user');
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
