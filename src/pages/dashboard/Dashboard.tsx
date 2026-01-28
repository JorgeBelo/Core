import { useState, useEffect } from 'react';
import {
  Users,
  DollarSign,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import {
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  subMonths,
  format,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAPagar: 0,
    faturamentoTotal: 0,
    saldoLucro: 0,
    alunosAtivos: 0,
    contasPendentes: 0,
    contasVencidas: 0,
  });
  const [chartData, setChartData] = useState<any>({
    faturamentoMensal: [],
    contasPagasRecebidas: [],
    distribuicaoContas: [],
    evolucaoSaldo: [],
  });

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const hoje = new Date();
      const inicioMes = startOfMonth(hoje);
      const fimMes = endOfMonth(hoje);

      // Carregar alunos ativos
      const { data: alunos, error: alunosError } = await supabase
        .from('alunos')
        .select('*')
        .eq('personal_id', user.id)
        .eq('active', true);

      if (alunosError) throw alunosError;

      // Calcular faturamento total
      const faturamentoTotal =
        alunos?.reduce((sum, aluno: any) => {
          const valor =
            aluno.monthly_fee ||
            aluno.monthly_value ||
            aluno.valor_mensalidade ||
            0;
          return sum + (typeof valor === 'number' ? valor : parseFloat(valor) || 0);
        }, 0) || 0;

      // Carregar contas financeiras
      const { data: contas, error: contasError } = await supabase
        .from('contas_financeiras')
        .select('*')
        .eq('personal_id', user.id);

      if (contasError) throw contasError;

      // Filtrar contas do mês atual
      const contasMes = contas?.filter((conta) => {
        const dataVenc = new Date(conta.data_vencimento);
        return isWithinInterval(dataVenc, { start: inicioMes, end: fimMes });
      }) || [];

      // Calcular totais
      const totalAPagar =
        contasMes
          .filter((c) => c.tipo === 'pagar' && !c.pago)
          .reduce((sum, c) => sum + c.valor, 0) || 0;

      const contasPendentes = contasMes.filter(
        (c) => !c.pago && new Date(c.data_vencimento) >= hoje
      ).length;

      const contasVencidas = contasMes.filter(
        (c) => !c.pago && new Date(c.data_vencimento) < hoje
      ).length;

      const saldoLucro = faturamentoTotal - totalAPagar;

      // Preparar dados para gráficos
      const faturamentoMensal = [];
      for (let i = 5; i >= 0; i--) {
        const mes = subMonths(hoje, i);
        const inicioMesChart = startOfMonth(mes);
        const fimMesChart = endOfMonth(mes);

        const contasMesChart = contas?.filter((conta) => {
          const dataVenc = new Date(conta.data_vencimento);
          return isWithinInterval(dataVenc, { start: inicioMesChart, end: fimMesChart });
        }) || [];

        const recebido =
          contasMesChart
            .filter((c) => c.tipo === 'receber' && c.pago)
            .reduce((sum, c) => sum + c.valor, 0) || 0;

        const pago =
          contasMesChart
            .filter((c) => c.tipo === 'pagar' && c.pago)
            .reduce((sum, c) => sum + c.valor, 0) || 0;

        faturamentoMensal.push({
          mes: format(mes, 'MMM', { locale: ptBR }),
          recebido,
          pago,
          saldo: recebido - pago,
        });
      }

      const contasPagasRecebidas = [
        {
          nome: 'Contas Pagas',
          valor: contasMes.filter((c) => c.tipo === 'pagar' && c.pago).length,
        },
        {
          nome: 'Contas Recebidas',
          valor: contasMes.filter((c) => c.tipo === 'receber' && c.pago).length,
        },
        {
          nome: 'Pendentes',
          valor: contasMes.filter((c) => !c.pago).length,
        },
      ];

      const distribuicaoContas = [
        {
          nome: 'A Pagar',
          valor: contasMes
            .filter((c) => c.tipo === 'pagar')
            .reduce((sum, c) => sum + c.valor, 0),
        },
        {
          nome: 'A Receber',
          valor: contasMes
            .filter((c) => c.tipo === 'receber')
            .reduce((sum, c) => sum + c.valor, 0),
        },
      ];

      const evolucaoSaldo = faturamentoMensal.map((item) => ({
        mes: item.mes,
        saldo: item.saldo,
      }));

      setStats({
        totalAPagar,
        faturamentoTotal,
        saldoLucro,
        alunosAtivos: alunos?.length || 0,
        contasPendentes,
        contasVencidas,
      });

      setChartData({
        faturamentoMensal,
        contasPagasRecebidas,
        distribuicaoContas,
        evolucaoSaldo,
      });
    } catch (error: any) {
      console.error('Erro ao carregar dados do dashboard:', error);
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total a Pagar (Mês)',
      value: `R$ ${stats.totalAPagar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: TrendingDown,
      color: 'text-primary',
    },
    {
      title: 'Faturamento Total',
      value: `R$ ${stats.faturamentoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'text-green-500',
    },
    {
      title: 'Saldo/Lucro',
      value: `R$ ${stats.saldoLucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: stats.saldoLucro >= 0 ? TrendingUp : TrendingDown,
      color: stats.saldoLucro >= 0 ? 'text-green-500' : 'text-primary',
    },
    {
      title: 'Alunos Ativos',
      value: stats.alunosAtivos,
      icon: Users,
      color: 'text-primary',
    },
    {
      title: 'Contas Pendentes',
      value: stats.contasPendentes,
      icon: Calendar,
      color: 'text-yellow-500',
    },
    {
      title: 'Contas Vencidas',
      value: stats.contasVencidas,
      icon: AlertCircle,
      color: 'text-primary',
    },
  ];

  const COLORS = ['#a20100', '#b4b4b4', '#10b981', '#f59e0b'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-sans font-semibold text-white mb-2">Dashboard</h1>
        <p className="text-gray-light">Visão geral financeira e administrativa</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-light">Carregando dados...</div>
      ) : (
        <>
          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="hover:border-primary transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-light text-xs mb-1">{stat.title}</p>
                      <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                    <div className={`${stat.color} bg-dark-soft p-2 rounded-lg`}>
                      <Icon size={20} />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Faturamento Mensal */}
            <Card title="Faturamento Mensal (Últimos 6 Meses)">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData.faturamentoMensal}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                    <XAxis dataKey="mes" stroke="#b4b4b4" />
                    <YAxis stroke="#b4b4b4" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #b4b4b4',
                        color: '#ffffff',
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="recebido"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Recebido"
                    />
                    <Line
                      type="monotone"
                      dataKey="pago"
                      stroke="#a20100"
                      strokeWidth={2}
                      name="Pago"
                    />
                    <Line
                      type="monotone"
                      dataKey="saldo"
                      stroke="#b4b4b4"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Saldo"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Distribuição de Contas */}
            <Card title="Distribuição de Contas (Mês Atual)">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.distribuicaoContas}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="valor"
                    >
                      {chartData.distribuicaoContas.map((entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index === 0 ? '#a20100' : '#10b981'}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #b4b4b4',
                        color: '#ffffff',
                      }}
                      formatter={(value: number) =>
                        `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Contas Pagas/Recebidas */}
            <Card title="Status das Contas (Mês Atual)">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.contasPagasRecebidas}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                    <XAxis dataKey="nome" stroke="#b4b4b4" />
                    <YAxis stroke="#b4b4b4" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #b4b4b4',
                        color: '#ffffff',
                      }}
                    />
                    <Bar dataKey="valor" fill="#a20100" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Evolução do Saldo */}
            <Card title="Evolução do Saldo (Últimos 6 Meses)">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData.evolucaoSaldo}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                    <XAxis dataKey="mes" stroke="#b4b4b4" />
                    <YAxis stroke="#b4b4b4" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #b4b4b4',
                        color: '#ffffff',
                      }}
                      formatter={(value: number) =>
                        `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="saldo"
                      stroke="#b4b4b4"
                      strokeWidth={3}
                      dot={{ fill: '#a20100', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Resumo Financeiro */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Resumo Financeiro do Mês">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-light">Faturamento (Mensalidades)</span>
                  <span className="text-green-500 font-semibold text-lg">
                    R$ {stats.faturamentoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-light">Contas a Pagar</span>
                  <span className="text-primary font-semibold text-lg">
                    R$ {stats.totalAPagar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="pt-4 border-t border-gray-dark">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-light">Saldo Final</span>
                    <span
                      className={`font-semibold text-xl ${
                        stats.saldoLucro >= 0 ? 'text-green-500' : 'text-primary'
                      }`}
                    >
                      R$ {stats.saldoLucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            <Card title="Ações Rápidas">
              <div className="space-y-3">
                <Button
                  variant="secondary"
                  className="w-full justify-start"
                  onClick={() => navigate('/financeiro')}
                >
                  <DollarSign size={20} className="mr-2" />
                  Gerenciar Finanças
                </Button>
                <Button
                  variant="secondary"
                  className="w-full justify-start"
                  onClick={() => navigate('/alunos')}
                >
                  <Users size={20} className="mr-2" />
                  Gerenciar Alunos
                </Button>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};
