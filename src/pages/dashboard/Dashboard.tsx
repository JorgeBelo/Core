import { useState, useEffect } from 'react';
import { Users, DollarSign, TrendingDown, TrendingUp } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import toast from 'react-hot-toast';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAPagar: 0,
    faturamentoTotal: 0,
    saldoLucro: 0,
    alunosAtivos: 0,
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
        .select('monthly_fee, active')
        .eq('personal_id', user.id)
        .eq('active', true);

      if (alunosError) throw alunosError;

      // Calcular faturamento total (soma das mensalidades dos alunos ativos)
      const faturamentoTotal = alunos?.reduce((sum, aluno) => sum + (aluno.monthly_fee || 0), 0) || 0;

      // Carregar contas financeiras do mês
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

      // Calcular total a pagar (contas a pagar não pagas)
      const totalAPagar =
        contasMes
          .filter((c) => c.tipo === 'pagar' && !c.pago)
          .reduce((sum, c) => sum + c.valor, 0) || 0;

      // Calcular saldo/lucro
      const saldoLucro = faturamentoTotal - totalAPagar;

      setStats({
        totalAPagar,
        faturamentoTotal,
        saldoLucro,
        alunosAtivos: alunos?.length || 0,
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
  ];

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="hover:border-primary transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-light text-sm mb-1">{stat.title}</p>
                      <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                    <div className={`${stat.color} bg-dark-soft p-3 rounded-lg`}>
                      <Icon size={24} />
                    </div>
                  </div>
                </Card>
              );
            })}
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
