import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Logo } from '../../components/common/Logo';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

export const Signup = () => {
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (senha !== confirmarSenha) {
      toast.error('As senhas não coincidem.');
      setLoading(false);
      return;
    }

    if (senha.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres.');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: senha,
        options: {
          data: {
            full_name: nome.trim(),
            name: nome.trim(),
          },
        },
      });

      if (error) {
        toast.error(error.message || 'Erro ao cadastrar.');
        setLoading(false);
        return;
      }

      if (data?.user) {
        setSucesso(true);
        toast.success('Cadastro realizado! Verifique seu e-mail para confirmar sua conta e começar a usar o Core.');
      }
    } catch (err) {
      console.error('Erro no cadastro:', err);
      toast.error('Erro ao cadastrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (sucesso) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="mb-10">
            <Logo variant="full" size="medium" />
          </div>
          <div className="card-core space-y-6">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
              <span className="text-3xl">✓</span>
            </div>
            <h1 className="text-xl font-sans font-semibold text-white">
              Cadastro realizado!
            </h1>
            <p className="text-gray-light text-sm leading-relaxed">
              Verifique seu e-mail para confirmar sua conta e começar a usar o Core.
            </p>
            <p className="text-gray-light text-xs">
              Depois de confirmar, faça login na tela inicial.
            </p>
            <Button
              type="button"
              className="w-full"
              onClick={() => navigate('/login')}
            >
              Ir para o Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mb-10">
            <Logo variant="full" size="medium" />
          </div>
          <h1 className="text-2xl font-sans font-semibold text-white mb-2">Criar conta</h1>
          <p className="text-gray-light">Preencha os dados para começar a usar o Core</p>
        </div>

        <form onSubmit={handleSubmit} className="card-core space-y-6">
          <div>
            <label htmlFor="nome" className="block text-sm font-medium text-white mb-2">
              Nome
            </label>
            <input
              id="nome"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="input-core w-full"
              placeholder="Seu nome completo"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-core w-full"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div>
            <label htmlFor="senha" className="block text-sm font-medium text-white mb-2">
              Senha
            </label>
            <input
              id="senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="input-core w-full"
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
            />
          </div>

          <div>
            <label htmlFor="confirmarSenha" className="block text-sm font-medium text-white mb-2">
              Confirmar Senha
            </label>
            <input
              id="confirmarSenha"
              type="password"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              className="input-core w-full"
              placeholder="Repita a senha"
              required
              minLength={6}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </Button>
        </form>

        <p className="text-center text-gray-light mt-6 text-sm">
          Já tem uma conta?{' '}
          <Link to="/login" className="link-primary">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
};
