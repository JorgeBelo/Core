import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Calendar, DollarSign } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import type { Aluno, ProgressoAluno } from '../../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { maskWhatsApp } from '../../utils/masks';
import toast from 'react-hot-toast';

// Mock progresso (será substituído por dados reais do banco quando a tabela for criada)
const mockProgresso: ProgressoAluno[] = [];

export const AlunoDetalhes = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && user) {
      loadAluno();
    }
  }, [id, user]);

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

  // Mock progresso (será substituído por dados reais do banco quando a tabela for criada)
  const progressoData = mockProgresso.length > 0 
    ? mockProgresso.map((p) => ({
        date: new Date(p.date).toLocaleDateString('pt-BR', { month: 'short' }),
        weight: p.weight,
        bodyFat: p.body_fat,
      }))
    : [];

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
        {/* Informações Pessoais */}
        <Card title="Informações Pessoais" className="lg:col-span-2">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-light text-sm mb-1">Data de Nascimento</p>
                <p className="text-white">
                  {new Date(aluno.birth_date).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div>
                <p className="text-gray-light text-sm mb-1">WhatsApp</p>
                <p className="text-white flex items-center gap-2">
                  <Phone size={16} />
                  {aluno.whatsapp ? maskWhatsApp(aluno.whatsapp) : '-'}
                </p>
              </div>
              <div>
                <p className="text-gray-light text-sm mb-1">Frequência Semanal</p>
                <p className="text-white flex items-center gap-2">
                  <Calendar size={16} />
                  {aluno.frequency_per_week}x por semana
                </p>
              </div>
              <div>
                <p className="text-gray-light text-sm mb-1">Mensalidade</p>
                <p className="text-white flex items-center gap-2">
                  <DollarSign size={16} />
                  R$ {aluno.monthly_fee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-gray-light text-sm mb-1">Status</p>
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
            </div>
            {aluno.observations && (
              <div>
                <p className="text-gray-light text-sm mb-1">Observações</p>
                <p className="text-white">{aluno.observations}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Estatísticas Rápidas */}
        <Card title="Estatísticas">
          <div className="space-y-4">
            <div>
              <p className="text-gray-light text-sm">Total de Aulas</p>
              <p className="text-2xl font-bold text-white">42</p>
            </div>
            <div>
              <p className="text-gray-light text-sm">Última Aula</p>
              <p className="text-white">15/01/2024</p>
            </div>
            <div>
              <p className="text-gray-light text-sm">Mensalidades Pagas</p>
              <p className="text-2xl font-bold text-green-500">12/12</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Gráfico de Progresso */}
      <Card title="Evolução de Peso e Gordura Corporal">
        {progressoData.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressoData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                <XAxis dataKey="date" stroke="#b4b4b4" />
                <YAxis stroke="#b4b4b4" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #b4b4b4',
                    color: '#ffffff',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#a20100"
                  strokeWidth={2}
                  name="Peso (kg)"
                />
                <Line
                  type="monotone"
                  dataKey="bodyFat"
                  stroke="#b4b4b4"
                  strokeWidth={2}
                  name="Gordura (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-light">
            <p>Nenhum dado de progresso registrado ainda.</p>
          </div>
        )}
      </Card>
    </div>
  );
};
