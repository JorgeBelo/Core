import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, DollarSign, Calendar } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import type { Aluno } from '../../types';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { maskWhatsApp } from '../../utils/masks';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getMensalidadesForMonth, ensureMensalidadesForMonth } from '../../services/mensalidadesService';

export const AlunoDetalhes = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [statusMes, setStatusMes] = useState<'pago' | 'pendente' | 'atrasado'>('pendente');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && user) {
      loadAluno();
    }
  }, [id, user]);

  useEffect(() => {
    if (aluno?.active && user && id) {
      const hoje = new Date();
      ensureMensalidadesForMonth(user.id, hoje.getFullYear(), hoje.getMonth() + 1).then(() =>
        getMensalidadesForMonth(user.id, hoje.getFullYear(), hoje.getMonth() + 1).then((mens) => {
          const m = mens.find((x) => x.aluno_id === id);
          setStatusMes(m?.status || 'pendente');
        })
      );
    }
  }, [aluno, user, id]);

  const loadAluno = async () => {
    if (!id || !user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('alunos')
        .select('*')
        .eq('id', id)
        .eq('personal_id', user.id)
        .single();

      if (error) throw error;

      setAluno(data);
    } catch (error: any) {
      console.error('Erro ao carregar aluno:', error);
      toast.error('Erro ao carregar dados do aluno');
      navigate('/alunos');
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-light">Carregando...</p>
      </div>
    );
  }

  if (!aluno) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-light mb-4">Aluno não encontrado</p>
          <Button onClick={() => navigate('/alunos')}>
            <ArrowLeft size={20} className="mr-2" />
            Voltar para Lista
          </Button>
        </div>
      </div>
    );
  }

  const alunoNome = aluno.nome || aluno.name || 'Sem nome';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/alunos')}>
          <ArrowLeft size={20} className="mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-sans font-semibold text-white mb-2">{alunoNome}</h1>
          <p className="text-gray-light">Perfil completo do aluno</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações Administrativas */}
        <Card title="Informações Administrativas" className="lg:col-span-2">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-light text-sm mb-1">WhatsApp</p>
                <p className="text-white flex items-center gap-2">
                  <Phone size={16} />
                  {aluno.whatsapp ? maskWhatsApp(aluno.whatsapp) : '-'}
                </p>
              </div>
              <div>
                <p className="text-gray-light text-sm mb-1">Valor da Mensalidade</p>
                <p className="text-white flex items-center gap-2">
                  <DollarSign size={16} />
                  R$ {aluno.monthly_fee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-gray-light text-sm mb-1">Vencimento</p>
                <p className="text-white flex items-center gap-2">
                  <Calendar size={16} />
                  Dia {aluno.payment_day || '-'}
                </p>
              </div>
              <div>
                <p className="text-gray-light text-sm mb-1">Status do mês (pagamento)</p>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    statusMes === 'pago'
                      ? 'bg-green-500/20 text-green-500'
                      : 'bg-primary/20 text-primary'
                  }`}
                >
                  {statusMes === 'pago' ? 'Pago' : statusMes === 'atrasado' ? 'Atrasado' : 'Pendente'}
                </span>
              </div>
              <div>
                <p className="text-gray-light text-sm mb-1">Status do Aluno</p>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    aluno.active
                      ? 'bg-green-500/20 text-green-500'
                      : 'bg-gray-light/20 text-gray-light'
                  }`}
                >
                  {aluno.active ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <div>
                <p className="text-gray-light text-sm mb-1">Cadastrado em</p>
                <p className="text-white">
                  {format(new Date(aluno.created_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Resumo Financeiro */}
        <Card title="Resumo Financeiro">
          <div className="space-y-4">
            <div>
              <p className="text-gray-light text-sm">Mensalidade</p>
              <p className="text-2xl font-bold text-white">
                R$ {aluno.monthly_fee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-gray-light text-sm">Próximo Vencimento</p>
              <p className="text-white">Dia {aluno.payment_day || '-'} do mês</p>
            </div>
            <div>
              <p className="text-gray-light text-sm">Status do mês</p>
              <p
                className={`text-lg font-semibold ${
                  statusMes === 'pago'
                    ? 'text-green-500'
                    : 'text-primary'
                }`}
              >
                {statusMes === 'pago' ? 'Pago' : statusMes === 'atrasado' ? 'Atrasado' : 'Pendente'}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
