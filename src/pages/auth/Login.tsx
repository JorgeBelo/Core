import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/common/Button';
import { Logo } from '../../components/common/Logo';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await login(email, password);
      navigate('/home');
    } catch (error: unknown) {
      console.error('Erro no login:', error);
      const msg = error && typeof error === 'object' && 'message' in error
        ? String((error as { message: string }).message)
        : '';
      if (msg.toLowerCase().includes('email not confirmed') || msg.includes('Email not confirmed')) {
        toast.error('E-mail ainda não confirmado. Verifique sua caixa de entrada (e spam) e clique no link enviado.');
      } else if (msg.toLowerCase().includes('invalid login') || msg.includes('Invalid')) {
        toast.error('E-mail ou senha incorretos. Tente novamente.');
      } else {
        toast.error(msg || 'Erro ao entrar. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mb-10">
            <Logo variant="full" size="medium" />
          </div>
          <h1 className="text-2xl font-sans font-semibold text-white mb-2">Bem-vindo de volta</h1>
          <p className="text-gray-light">Entre com suas credenciais para acessar o sistema</p>
        </div>

        <form onSubmit={handleSubmit} className="card-core space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
              Email
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
            <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-core w-full"
              placeholder="••••••••"
              required
            />
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>

          <div className="text-center">
            <a href="#" className="link-primary text-sm">
              Esqueceu sua senha?
            </a>
          </div>
        </form>

        <p className="text-center text-gray-light mt-6 text-sm">
          Não tem uma conta?{' '}
          <Link to="/signup" className="link-primary">
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
};
