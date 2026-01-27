import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Calendar, DollarSign } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import type { Aluno, ProgressoAluno } from '../../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Mock data
const mockAluno: Aluno = {
  id: '1',
  personal_id: '1',
  name: 'João Silva',
  birth_date: '1990-05-15',
  phone: '(11) 98765-4321',
  whatsapp: '(11) 98765-4321',
  frequency_per_week: 3,
  monthly_fee: 300.00,
  start_date: '2024-01-15',
  active: true,
  observations: 'Aluno dedicado, sempre presente nos treinos.',
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
};

const mockProgresso: ProgressoAluno[] = [
  { id: '1', aluno_id: '1', date: '2024-01-15', weight: 85.5, body_fat: 18, created_at: '2024-01-15T10:00:00Z' },
  { id: '2', aluno_id: '1', date: '2024-02-15', weight: 84.2, body_fat: 17, created_at: '2024-02-15T10:00:00Z' },
  { id: '3', aluno_id: '1', date: '2024-03-15', weight: 83.0, body_fat: 16, created_at: '2024-03-15T10:00:00Z' },
  { id: '4', aluno_id: '1', date: '2024-04-15', weight: 82.1, body_fat: 15, created_at: '2024-04-15T10:00:00Z' },
];

export const AlunoDetalhes = () => {
  useParams<{ id: string }>();
  const navigate = useNavigate();

  const progressoData = mockProgresso.map((p) => ({
    date: new Date(p.date).toLocaleDateString('pt-BR', { month: 'short' }),
    weight: p.weight,
    bodyFat: p.body_fat,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/alunos')}>
          <ArrowLeft size={20} className="mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-sans font-semibold text-white mb-2">{mockAluno.name}</h1>
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
                  {new Date(mockAluno.birth_date).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div>
                <p className="text-gray-light text-sm mb-1">Telefone</p>
                <p className="text-white flex items-center gap-2">
                  <Phone size={16} />
                  {mockAluno.phone}
                </p>
              </div>
              <div>
                <p className="text-gray-light text-sm mb-1">WhatsApp</p>
                <p className="text-white flex items-center gap-2">
                  <Phone size={16} />
                  {mockAluno.whatsapp}
                </p>
              </div>
              <div>
                <p className="text-gray-light text-sm mb-1">Frequência Semanal</p>
                <p className="text-white flex items-center gap-2">
                  <Calendar size={16} />
                  {mockAluno.frequency_per_week}x por semana
                </p>
              </div>
              <div>
                <p className="text-gray-light text-sm mb-1">Mensalidade</p>
                <p className="text-white flex items-center gap-2">
                  <DollarSign size={16} />
                  R$ {mockAluno.monthly_fee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-gray-light text-sm mb-1">Status</p>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-500">
                  Ativo
                </span>
              </div>
            </div>
            {mockAluno.observations && (
              <div>
                <p className="text-gray-light text-sm mb-1">Observações</p>
                <p className="text-white">{mockAluno.observations}</p>
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
      </Card>
    </div>
  );
};
