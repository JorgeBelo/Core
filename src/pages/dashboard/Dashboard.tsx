import { useState, useEffect } from 'react';
import { Users, DollarSign, CheckCircle, Clock, TrendingUp, TrendingDown, ArrowUpCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { startOfMonth, endOfMonth, isWithinInterval, format, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { parseLocalDate } from '../../utils/dateUtils';
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
  const hoje = new Date();
  const [mesRef, setMesRef] = useState<Date>(() => new Date(hoje.getFullYear(), hoje.getMonth(), 1));
  const [loading, setLoading] = useState(true);
  const [contas, setContas] = useState<any[]>([]);
  const [alunosTotal, setAlunosTotal] = useState(0);
  const [alunosAtivos, setAlunosAtivos] = useState(0);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: contasData, error: contasError } = await supabase
        .from('contas_financeiras')
        .select('*')
        .eq('personal_id', user.id);

      if (contasError) throw contasError;
      setContas(contasData || []);

      const { data: alunosData, error: alunosError } = await supabase
        .from('alunos')
        .select('id, active')
        .eq('personal_id', user.id);

      if (alunosError) throw alunosError;
      const alunosList = alunosData || [];
      setAlunosTotal(alunosList.length);
      setAlunosAtivos(alunosList.filter((a: any) => a.active !== false).length);
    } catch (error: any) {
      console.error('Erro ao carregar dados do dashboard:', error);
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  const inicioMes = startOfMonth(mesRef);
  const fimMes = endOfMonth(mesRef);

  const contasDoMes = contas.filter((c: any) => {
    const dataVenc = parseLocalDate(c.data_vencimento);
    return isWithinInterval(dataVenc, { start: inicioMes, end: fimMes });
  });

  const recebidoMes = contasDoMes
    .filter((c: any) => c.tipo === 'receber' && c.pago)
    .reduce((sum: number, c: any) => sum + (c.valor || 0), 0);

  const contasPagarPendentes = contasDoMes
    .filter((c: any) => c.tipo === 'pagar' && !c.pago)
    .reduce((sum: number, c: any) => sum + (c.valor || 0), 0);
  const contasPagarPagas = contasDoMes
    .filter((c: any) => c.tipo === 'pagar' && c.pago)
    .reduce((sum: number, c: any) => sum + (c.valor || 0), 0);

  const totalRecebido = recebidoMes;
  const totalAPagar = contasPagarPendentes;
  const totalPago = contasPagarPagas;
  const saldoFinal = totalRecebido - totalPago - totalAPagar;
  const saldoPositivo = saldoFinal >= 0;

  const proximosVencimentos = contasDoMes
    .filter((c: any) => !c.pago)
    .sort((a: any, b: any) => parseLocalDate(a.data_vencimento).getTime() - parseLocalDate(b.data_vencimento).getTime())
    .slice(0, 5)
    .map((c: any) => ({ descricao: c.descricao, data: c.data_vencimento, tipo: c.tipo }));

  const chartData = (() => {
    const arr = [];
    for (let i = 5; i >= 0; i--) {
      const mes = subMonths(hoje, i);
      const inicio = startOfMonth(mes);
      const fim = endOfMonth(mes);
      const contasChart = contas.filter((c: any) => {
        const d = parseLocalDate(c.data_vencimento);
        return isWithinInterval(d, { start: inicio, end: fim });
      });
      const recebido = contasChart
        .filter((c: any) => c.tipo === 'receber' && c.pago)
        .reduce((s: number, c: any) => s + (c.valor || 0), 0);
      const aPagar = contasChart
        .filter((c: any) => c.tipo === 'pagar' && !c.pago)
        .reduce((s: number, c: any) => s + (c.valor || 0), 0);
      arr.push({
        mes: format(mes, 'MMM', { locale: ptBR }),
        recebido,
        aPagar,
      });
    }
    return arr;
  })();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-sans font-semibold text-white mb-2">Dashboard</h1>
        <p className="text-gray-light text-sm sm:text-base">
          Planilha do mês: o Dashboard soma apenas os lançamentos que você criou (data dentro do mês selecionado).
        </p>
      </div>

      {/* Seletor de mês */}
      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMesRef((d) => subMonths(d, 1))}
            className="min-h-[44px] min-w-[44px] rounded-lg border border-gray-dark text-gray-light hover:bg-dark-soft hover:text-white transition-colors flex items-center justify-center"
            aria-label="Mês anterior"
          >
            <ChevronLeft size={24} />
          </button>
          <span className="text-white font-semibold min-w-[160px] text-center">
            {format(mesRef, 'MMMM yyyy', { locale: ptBR })}
          </span>
          <button
            type="button"
            onClick={() => setMesRef((d) => addMonths(d, 1))}
            className="min-h-[44px] min-w-[44px] rounded-lg border border-gray-dark text-gray-light hover:bg-dark-soft hover:text-white transition-colors flex items-center justify-center"
            aria-label="Próximo mês"
          >
            <ChevronRight size={24} />
          </button>
        </div>
        <button
          type="button"
          onClick={() => setMesRef(new Date(hoje.getFullYear(), hoje.getMonth(), 1))}
          className="text-primary hover:text-primary-light text-sm font-medium min-h-[44px] px-3"
        >
          Mês atual
        </button>
      </Card>

      {loading ? (
        <div className="text-center py-12 text-gray-light">Carregando dados...</div>
      ) : (
        <>
          <Card className={`border-2 ${saldoPositivo ? 'border-green-500' : 'border-primary'}`}>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
              <div className="flex-1 text-center md:text-left">
                <p className="text-gray-light text-xs sm:text-sm mb-2">Saldo do Mês</p>
                <p className={`text-3xl sm:text-4xl md:text-5xl font-bold ${saldoPositivo ? 'text-green-500' : 'text-primary'}`}>
                  {currencyFormatter.format(saldoFinal)}
                </p>
                <p className="text-xs sm:text-sm text-gray-light mt-2">
                  {saldoPositivo ? '✅ Você está no verde!' : '⚠️ Atenção! Você tem mais contas do que recebeu.'}
                </p>
              </div>
              <div className={`p-4 sm:p-6 rounded-full ${saldoPositivo ? 'bg-green-500/20' : 'bg-primary/20'}`}>
                {saldoPositivo ? <TrendingUp className="text-green-500" size={48} /> : <TrendingDown className="text-primary" size={48} />}
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/30">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-gray-light text-xs sm:text-sm mb-2">💰 Este mês eu recebi</p>
                  <p className="text-2xl sm:text-3xl font-bold text-green-500 truncate">{currencyFormatter.format(totalRecebido)}</p>
                </div>
                <ArrowUpCircle className="text-green-500 flex-shrink-0 hidden sm:block" size={40} />
              </div>
            </Card>
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-gray-light text-xs sm:text-sm mb-2">⚠️ Tenho para pagar</p>
                  <p className="text-2xl sm:text-3xl font-bold text-primary truncate">{currencyFormatter.format(totalAPagar)}</p>
                </div>
                <Clock className="text-primary flex-shrink-0 hidden sm:block" size={40} />
              </div>
            </Card>
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/30 sm:col-span-2 md:col-span-1">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-gray-light text-xs sm:text-sm mb-2">✅ Já paguei</p>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-400 truncate">{currencyFormatter.format(totalPago)}</p>
                </div>
                <CheckCircle className="text-blue-400 flex-shrink-0 hidden sm:block" size={40} />
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-gray-light text-xs mb-1 truncate">Alunos Ativos</p>
                  <p className="text-lg sm:text-xl font-bold text-white">{alunosAtivos}</p>
                  <p className="text-xs text-gray-light mt-1 hidden sm:block">{alunosTotal} total</p>
                </div>
                <Users className="text-primary flex-shrink-0 hidden sm:block" size={24} />
              </div>
            </Card>
            <Card>
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-gray-light text-xs mb-1 truncate">Contas Pagas (Mês)</p>
                  <p className="text-lg sm:text-xl font-bold text-blue-400 truncate">{currencyFormatter.format(contasPagarPagas)}</p>
                </div>
                <CheckCircle className="text-blue-400 flex-shrink-0 hidden sm:block" size={24} />
              </div>
            </Card>
          </div>

          <Card title="Evolução (Últimos 6 Meses)">
            <div className="h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                  <XAxis dataKey="mes" stroke="#b4b4b4" />
                  <YAxis
                    stroke="#b4b4b4"
                    tickFormatter={(v) =>
                      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(v)
                    }
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #b4b4b4', color: '#ffffff' }}
                    formatter={(value: number) => currencyFormatter.format(value)}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="recebido" stroke="#10b981" strokeWidth={2} name="Recebido" dot={{ fill: '#10b981', r: 3 }} />
                  <Line type="monotone" dataKey="aPagar" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" name="A pagar" dot={{ fill: '#f59e0b', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="📋 Próximos vencimentos (até 5)">
            {proximosVencimentos.length === 0 ? (
              <p className="text-gray-light text-sm">Nenhuma conta pendente neste mês.</p>
            ) : (
              <ul className="space-y-2">
                {proximosVencimentos.map((c, idx) => (
                  <li key={`${c.descricao}-${idx}`} className="flex justify-between text-sm border border-gray-dark rounded-lg px-3 py-2 bg-dark-soft">
                    <span className="text-white">{c.descricao}</span>
                    <span className="text-gray-light">{format(parseLocalDate(c.data), "d 'de' MMM", { locale: ptBR })}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Ações Rápidas">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <Button variant="secondary" className="flex items-center justify-center gap-3 py-4 min-h-[44px]" onClick={() => navigate('/financeiro')}>
                <DollarSign size={20} className="sm:w-6 sm:h-6" />
                <div className="text-left hidden sm:block">
                  <p className="font-semibold text-sm">Financeiro</p>
                  <p className="text-xs opacity-80">Contas a pagar e lançar recebimentos</p>
                </div>
                <span className="sm:hidden font-semibold">Financeiro</span>
              </Button>
              <Button variant="secondary" className="flex items-center justify-center gap-3 py-4 min-h-[44px]" onClick={() => navigate('/alunos')}>
                <Users size={20} className="sm:w-6 sm:h-6" />
                <div className="text-left hidden sm:block">
                  <p className="font-semibold text-sm">Alunos</p>
                  <p className="text-xs opacity-80">Cadastro e lançar pagamento</p>
                </div>
                <span className="sm:hidden font-semibold">Alunos</span>
              </Button>
              <Button variant="secondary" className="flex items-center justify-center gap-3 py-4 min-h-[44px] sm:col-span-2 md:col-span-1" onClick={() => navigate('/historico-entrada')}>
                <DollarSign size={20} className="sm:w-6 sm:h-6" />
                <div className="text-left hidden sm:block">
                  <p className="font-semibold text-sm">Histórico de entrada</p>
                  <p className="text-xs opacity-80">Lançamentos de recebimento</p>
                </div>
                <span className="sm:hidden font-semibold">Histórico</span>
              </Button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};
