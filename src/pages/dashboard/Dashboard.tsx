import { useState, useEffect } from 'react';
import { Users, DollarSign, CheckCircle, Clock, TrendingUp, TrendingDown, ArrowUpCircle } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { startOfMonth, endOfMonth, isWithinInterval, format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
});

export const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    alunosTotal: 0,
    alunosAtivos: 0,
    mensalidadesRecebidas: 0,
    mensalidadesPendentes: 0,
    contasPagarPendentes: 0,
    contasPagarPagas: 0,
    contasReceberPendentes: 0,
    contasReceberPagas: 0,
  });
  const [highlights, setHighlights] = useState<{
    proximosVencimentos: Array<{ descricao: string; data: string; tipo: 'pagar' | 'receber' }>;
    alunosPendentes: Array<{ id: string; nome: string }>;
  }>({
    proximosVencimentos: [],
    alunosPendentes: [],
  });
  const [chartData, setChartData] = useState<Array<{
    mes: string;
    faturamento: number;
    recebido: number;
    pendente: number;
  }>>([]);

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

      // Alunos
      const { data: alunos, error: alunosError } = await supabase
        .from('alunos')
        .select('*')
        .eq('personal_id', user.id);

      if (alunosError) throw alunosError;

      const alunosList = alunos || [];
      const alunosAtivos = alunosList.filter((a: any) => a.active).length;

      const mensalidadesRecebidas = alunosList
        .filter((a: any) => a.active && a.payment_status === 'pago')
        .reduce((sum: number, a: any) => {
          const v =
            typeof a.monthly_fee === 'number'
              ? a.monthly_fee
              : parseFloat(String(a.monthly_fee)) || 0;
          return sum + v;
        }, 0);

      const mensalidadesPendentes = alunosList
        .filter((a: any) => a.active && a.payment_status !== 'pago')
        .reduce((sum: number, a: any) => {
          const v =
            typeof a.monthly_fee === 'number'
              ? a.monthly_fee
              : parseFloat(String(a.monthly_fee)) || 0;
          return sum + v;
        }, 0);

      const alunosPendentes = alunosList
        .filter((a: any) => a.active && a.payment_status !== 'pago')
        .map((a: any) => ({
          id: a.id,
          nome: a.nome || a.name || 'Aluno',
        }));

      // Contas financeiras
      const { data: contas, error: contasError } = await supabase
        .from('contas_financeiras')
        .select('*')
        .eq('personal_id', user.id);

      if (contasError) throw contasError;

      const contasMes = (contas || []).filter((conta: any) => {
        const dataVenc = new Date(conta.data_vencimento);
        return isWithinInterval(dataVenc, { start: inicioMes, end: fimMes });
      });

      const contasPagarPendentes = contasMes
        .filter((c: any) => c.tipo === 'pagar' && !c.pago)
        .reduce((sum: number, c: any) => sum + (c.valor || 0), 0);

      const contasPagarPagas = contasMes
        .filter((c: any) => c.tipo === 'pagar' && c.pago)
        .reduce((sum: number, c: any) => sum + (c.valor || 0), 0);

      const contasReceberPendentes = contasMes
        .filter((c: any) => c.tipo === 'receber' && !c.pago)
        .reduce((sum: number, c: any) => sum + (c.valor || 0), 0);

      const contasReceberPagas = contasMes
        .filter((c: any) => c.tipo === 'receber' && c.pago)
        .reduce((sum: number, c: any) => sum + (c.valor || 0), 0);

      const proximosVencimentos = contasMes
        .filter((c: any) => !c.pago)
        .sort(
          (a: any, b: any) =>
            new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime()
        )
        .slice(0, 5)
        .map((c: any) => ({
          descricao: c.descricao,
          data: c.data_vencimento,
          tipo: c.tipo as 'pagar' | 'receber',
        }));

      // Preparar dados para gráfico de evolução do faturamento (últimos 6 meses)
      const chartDataArray = [];
      for (let i = 5; i >= 0; i--) {
        const mes = subMonths(hoje, i);
        const inicioMesChart = startOfMonth(mes);
        const fimMesChart = endOfMonth(mes);

        const alunosMesChart = alunosList.filter((a: any) => a.active);
        const mensalidadesRecebidasMes = alunosMesChart
          .filter((a: any) => a.payment_status === 'pago')
          .reduce((sum: number, a: any) => {
            const v =
              typeof a.monthly_fee === 'number'
                ? a.monthly_fee
                : parseFloat(String(a.monthly_fee)) || 0;
            return sum + v;
          }, 0);

        const mensalidadesPendentesMes = alunosMesChart
          .filter((a: any) => a.payment_status !== 'pago')
          .reduce((sum: number, a: any) => {
            const v =
              typeof a.monthly_fee === 'number'
                ? a.monthly_fee
                : parseFloat(String(a.monthly_fee)) || 0;
            return sum + v;
          }, 0);

        const contasMesChart = (contas || []).filter((conta: any) => {
          const dataVenc = new Date(conta.data_vencimento);
          return isWithinInterval(dataVenc, { start: inicioMesChart, end: fimMesChart });
        });

        const contasReceberMes = contasMesChart
          .filter((c: any) => c.tipo === 'receber' && c.pago)
          .reduce((sum: number, c: any) => sum + (c.valor || 0), 0);

        const faturamentoTotal = mensalidadesRecebidasMes + contasReceberMes;

        chartDataArray.push({
          mes: format(mes, 'MMM', { locale: ptBR }),
          faturamento: faturamentoTotal,
          recebido: mensalidadesRecebidasMes + contasReceberMes,
          pendente: mensalidadesPendentesMes,
        });
      }

      setStats({
        alunosTotal: alunosList.length,
        alunosAtivos,
        mensalidadesRecebidas,
        mensalidadesPendentes,
        contasPagarPendentes,
        contasPagarPagas,
        contasReceberPendentes,
        contasReceberPagas,
      });

      setHighlights({
        proximosVencimentos,
        alunosPendentes,
      });

      setChartData(chartDataArray);
    } catch (error: any) {
      console.error('Erro ao carregar dados do dashboard:', error);
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Cálculos financeiros principais
  const totalRecebido = stats.mensalidadesRecebidas + stats.contasReceberPagas;
  const totalAPagar = stats.contasPagarPendentes;
  const totalPago = stats.contasPagarPagas;
  const saldoFinal = totalRecebido - totalPago - totalAPagar;
  const saldoPositivo = saldoFinal >= 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-sans font-semibold text-white mb-2">Dashboard</h1>
        <p className="text-gray-light">
          Controle financeiro simples e direto do seu negócio
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-light">Carregando dados...</div>
      ) : (
        <>
          {/* Card Principal: Saldo Final (Destaque) */}
          <Card className={`border-2 ${saldoPositivo ? 'border-green-500' : 'border-primary'}`}>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1 text-center md:text-left">
                <p className="text-gray-light text-sm mb-2">Saldo do Mês</p>
                <p 
                  className={`text-5xl font-bold ${saldoPositivo ? 'text-green-500' : 'text-primary'}`}
                >
                  {currencyFormatter.format(saldoFinal)}
                </p>
                <p className="text-sm text-gray-light mt-2">
                  {saldoPositivo 
                    ? '✅ Você está no verde! Sobrou dinheiro este mês.' 
                    : '⚠️ Atenção! Você tem mais contas do que recebeu.'}
                </p>
              </div>
              <div className={`p-6 rounded-full ${saldoPositivo ? 'bg-green-500/20' : 'bg-primary/20'}`}>
                {saldoPositivo ? (
                  <TrendingUp className={saldoPositivo ? 'text-green-500' : 'text-primary'} size={64} />
                ) : (
                  <TrendingDown className="text-primary" size={64} />
                )}
              </div>
            </div>
          </Card>

          {/* Cards Principais: Recebido, A Pagar, Já Pago */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Este mês eu recebi */}
            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/30">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-gray-light text-sm mb-2">💰 Este mês eu recebi</p>
                  <p className="text-3xl font-bold text-green-500 mb-1">
                    {currencyFormatter.format(totalRecebido)}
                  </p>
                  <div className="text-xs text-gray-light space-y-1 mt-3">
                    <div className="flex justify-between">
                      <span>Mensalidades:</span>
                      <span className="text-green-400">{currencyFormatter.format(stats.mensalidadesRecebidas)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Contas a receber:</span>
                      <span className="text-green-400">{currencyFormatter.format(stats.contasReceberPagas)}</span>
                    </div>
                  </div>
                </div>
                <ArrowUpCircle className="text-green-500 flex-shrink-0" size={40} />
              </div>
            </Card>

            {/* Tenho X para pagar */}
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-gray-light text-sm mb-2">⚠️ Tenho para pagar</p>
                  <p className="text-3xl font-bold text-primary mb-1">
                    {currencyFormatter.format(totalAPagar)}
                  </p>
                  <p className="text-xs text-gray-light mt-3">
                    {totalAPagar > 0 
                      ? 'Contas pendentes que ainda não foram pagas' 
                      : 'Nenhuma conta pendente! 🎉'}
                  </p>
                </div>
                <Clock className="text-primary flex-shrink-0" size={40} />
              </div>
            </Card>

            {/* Já paguei */}
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/30">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-gray-light text-sm mb-2">✅ Já paguei</p>
                  <p className="text-3xl font-bold text-blue-400 mb-1">
                    {currencyFormatter.format(totalPago)}
                  </p>
                  <p className="text-xs text-gray-light mt-3">
                    Contas que já foram pagas este mês
                  </p>
                </div>
                <CheckCircle className="text-blue-400 flex-shrink-0" size={40} />
              </div>
            </Card>
          </div>

          {/* Cards Secundários: Detalhes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-light text-xs mb-1">Mensalidades Pendentes</p>
                  <p className="text-xl font-bold text-primary">
                    {currencyFormatter.format(stats.mensalidadesPendentes)}
                  </p>
                </div>
                <Clock className="text-primary" size={24} />
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-light text-xs mb-1">Contas Pagas (Mês)</p>
                  <p className="text-xl font-bold text-blue-400">
                    {currencyFormatter.format(stats.contasPagarPagas)}
                  </p>
                </div>
                <CheckCircle className="text-blue-400" size={24} />
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-light text-xs mb-1">Alunos Ativos</p>
                  <p className="text-xl font-bold text-white">{stats.alunosAtivos}</p>
                  <p className="text-xs text-gray-light mt-1">
                    {stats.alunosTotal} total
                  </p>
                </div>
                <Users className="text-primary" size={24} />
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-light text-xs mb-1">Total do Mês</p>
                  <p className="text-xl font-bold text-white">
                    {currencyFormatter.format(stats.mensalidadesRecebidas + stats.mensalidadesPendentes)}
                  </p>
                  <p className="text-xs text-gray-light mt-1">Mensalidades</p>
                </div>
                <DollarSign className="text-white" size={24} />
              </div>
            </Card>
          </div>

          {/* Gráfico de Evolução do Faturamento */}
          <Card title="Evolução do Faturamento (Últimos 6 Meses)">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                  <XAxis dataKey="mes" stroke="#b4b4b4" />
                  <YAxis
                    stroke="#b4b4b4"
                    tickFormatter={(value) =>
                      new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                        notation: 'compact',
                      }).format(value)
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #b4b4b4',
                      color: '#ffffff',
                    }}
                    formatter={(value: number) => currencyFormatter.format(value)}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="faturamento"
                    stroke="#10b981"
                    strokeWidth={3}
                    name="Faturamento Total"
                    dot={{ fill: '#10b981', r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="recebido"
                    stroke="#a20100"
                    strokeWidth={2}
                    name="Recebido"
                    dot={{ fill: '#a20100', r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="pendente"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Pendente"
                    dot={{ fill: '#f59e0b', r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Alertas do mês */}
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
            <Card title="📋 Próximas Ações e Lembretes">
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-gray-light mb-2">Próximos vencimentos (até 5 lançamentos)</p>
                  {highlights.proximosVencimentos.length === 0 ? (
                    <p className="text-xs text-gray-light">Nenhuma conta pendente neste mês.</p>
                  ) : (
                    <ul className="space-y-2">
                      {highlights.proximosVencimentos.map((c, idx) => (
                        <li
                          key={`${c.descricao}-${idx}`}
                          className="flex items-center justify-between text-xs border border-gray-dark rounded-lg px-3 py-2 bg-dark-soft"
                        >
                          <div className="flex flex-col">
                            <span className="text-white">{c.descricao}</span>
                            <span className="text-gray-light">
                              {c.tipo === 'pagar' ? 'A pagar' : 'A receber'} em{' '}
                              {format(new Date(c.data), "d 'de' MMM", { locale: ptBR })}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="pt-2 border-t border-gray-dark">
                  <p className="text-gray-light mb-2">
                    Alunos com mensalidade pendente ({highlights.alunosPendentes.length})
                  </p>
                  {highlights.alunosPendentes.length === 0 ? (
                    <p className="text-xs text-gray-light">Nenhum aluno pendente no momento.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {highlights.alunosPendentes.slice(0, 8).map((a) => (
                        <span
                          key={a.id}
                          className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary border border-primary/40"
                        >
                          {a.nome}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Ações rápidas */}
          <Card title="Ações Rápidas">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="secondary"
                className="flex items-center justify-center gap-3 py-4"
                onClick={() => navigate('/financeiro')}
              >
                <DollarSign size={24} />
                <div className="text-left">
                  <p className="font-semibold">Ver financeiro detalhado</p>
                  <p className="text-xs opacity-80">Contas a pagar e a receber do mês</p>
                </div>
              </Button>

              <Button
                variant="secondary"
                className="flex items-center justify-center gap-3 py-4"
                onClick={() => navigate('/alunos')}
              >
                <Users size={24} />
                <div className="text-left">
                  <p className="font-semibold">Gerenciar alunos</p>
                  <p className="text-xs opacity-80">Status de pagamento e dados de contato</p>
                </div>
              </Button>

              <Button
                variant="secondary"
                className="flex items-center justify-center gap-3 py-4"
                onClick={() => navigate('/agenda')}
              >
                <Clock size={24} />
                <div className="text-left">
                  <p className="font-semibold">Ver agenda semanal</p>
                  <p className="text-xs opacity-80">Horários fixos de atendimento</p>
                </div>
              </Button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};
