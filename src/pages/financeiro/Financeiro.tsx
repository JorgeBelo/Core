import { useState } from 'react';
import { DollarSign, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Card } from '../../components/common/Card';
import type { Mensalidade } from '../../types';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Mock data
const mockMensalidades: Mensalidade[] = [
  {
    id: '1',
    aluno_id: '1',
    personal_id: '1',
    due_date: '2024-01-05',
    amount: 300.00,
    status: 'pago',
    paid_date: '2024-01-05',
    payment_method: 'PIX',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-05T10:00:00Z',
  },
  {
    id: '2',
    aluno_id: '2',
    personal_id: '1',
    due_date: '2024-01-10',
    amount: 250.00,
    status: 'pago',
    paid_date: '2024-01-10',
    payment_method: 'Cartão',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-10T10:00:00Z',
  },
  {
    id: '3',
    aluno_id: '1',
    personal_id: '1',
    due_date: '2024-01-20',
    amount: 300.00,
    status: 'atrasado',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: '4',
    aluno_id: '2',
    personal_id: '1',
    due_date: '2024-02-10',
    amount: 250.00,
    status: 'pendente',
    created_at: '2024-02-01T10:00:00Z',
    updated_at: '2024-02-01T10:00:00Z',
  },
];

const mockAlunos: { [key: string]: string } = {
  '1': 'João Silva',
  '2': 'Maria Santos',
};

const chartData = [
  { month: 'Out', recebido: 1200, previsto: 1500 },
  { month: 'Nov', recebido: 1800, previsto: 2000 },
  { month: 'Dez', recebido: 2200, previsto: 2200 },
  { month: 'Jan', recebido: 2400, previsto: 2500 },
];

export const Financeiro = () => {
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pago' | 'pendente' | 'atrasado'>('todos');

  const filteredMensalidades = mockMensalidades.filter(
    (m) => statusFilter === 'todos' || m.status === statusFilter
  );

  const totalRecebido = mockMensalidades
    .filter((m) => m.status === 'pago')
    .reduce((sum, m) => sum + m.amount, 0);

  const totalPendente = mockMensalidades
    .filter((m) => m.status === 'pendente')
    .reduce((sum, m) => sum + m.amount, 0);

  const totalAtrasado = mockMensalidades
    .filter((m) => m.status === 'atrasado')
    .reduce((sum, m) => sum + m.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-sans font-semibold text-white mb-2">Financeiro</h1>
        <p className="text-gray-light">Controle de mensalidades e faturamento</p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-light text-sm mb-1">Total Recebido</p>
              <p className="text-2xl font-bold text-green-500">
                R$ {totalRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <CheckCircle className="text-green-500" size={32} />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-light text-sm mb-1">Pendentes</p>
              <p className="text-2xl font-bold text-yellow-500">
                R$ {totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <Clock className="text-yellow-500" size={32} />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-light text-sm mb-1">Atrasados</p>
              <p className="text-2xl font-bold text-primary">
                R$ {totalAtrasado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <AlertCircle className="text-primary" size={32} />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-light text-sm mb-1">Total do Mês</p>
              <p className="text-2xl font-bold text-white">
                R$ {(totalRecebido + totalPendente + totalAtrasado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <DollarSign className="text-white" size={32} />
          </div>
        </Card>
      </div>

      {/* Gráfico de Faturamento */}
      <Card title="Faturamento Mensal">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
              <XAxis dataKey="month" stroke="#b4b4b4" />
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
                dataKey="recebido"
                stroke="#a20100"
                strokeWidth={2}
                name="Recebido"
              />
              <Line
                type="monotone"
                dataKey="previsto"
                stroke="#b4b4b4"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Previsto"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Tabela de Mensalidades */}
      <Card title="Histórico de Mensalidades">
        <div className="mb-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="input-core"
          >
            <option value="todos">Todas</option>
            <option value="pago">Pagas</option>
            <option value="pendente">Pendentes</option>
            <option value="atrasado">Atrasadas</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-dark">
                <th className="text-left py-3 px-4 text-gray-light font-medium">Aluno</th>
                <th className="text-left py-3 px-4 text-gray-light font-medium">Vencimento</th>
                <th className="text-left py-3 px-4 text-gray-light font-medium">Valor</th>
                <th className="text-left py-3 px-4 text-gray-light font-medium">Status</th>
                <th className="text-left py-3 px-4 text-gray-light font-medium">Pagamento</th>
              </tr>
            </thead>
            <tbody>
              {filteredMensalidades.map((mensalidade) => (
                <tr
                  key={mensalidade.id}
                  className={`border-b border-gray-dark hover:bg-dark-soft transition-colors ${
                    mensalidade.status === 'atrasado' ? 'bg-primary/5' : ''
                  }`}
                >
                  <td className="py-4 px-4 text-white">
                    {mockAlunos[mensalidade.aluno_id] || 'Aluno'}
                  </td>
                  <td className="py-4 px-4 text-gray-light">
                    {format(new Date(mensalidade.due_date), "d 'de' MMM 'de' yyyy", { locale: ptBR })}
                  </td>
                  <td className="py-4 px-4 text-white font-semibold">
                    R$ {mensalidade.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        mensalidade.status === 'pago'
                          ? 'bg-green-500/20 text-green-500'
                          : mensalidade.status === 'atrasado'
                          ? 'bg-primary/20 text-primary'
                          : 'bg-yellow-500/20 text-yellow-500'
                      }`}
                    >
                      {mensalidade.status === 'pago'
                        ? 'Pago'
                        : mensalidade.status === 'atrasado'
                        ? 'Atrasado'
                        : 'Pendente'}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-gray-light">
                    {mensalidade.paid_date
                      ? format(new Date(mensalidade.paid_date), "d 'de' MMM", { locale: ptBR })
                      : '-'}
                    {mensalidade.payment_method && ` (${mensalidade.payment_method})`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
