import { useState, useEffect, useMemo } from 'react';
import { ArrowDownToLine, Filter, Receipt } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { parseLocalDate } from '../../utils/dateUtils';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
});

interface RecebimentoItem {
  id: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
}

export const HistoricoEntrada = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [itens, setItens] = useState<RecebimentoItem[]>([]);
  const [filtroMes, setFiltroMes] = useState<string>('');

  useEffect(() => {
    if (user) {
      loadHistorico();
    }
  }, [user]);

  const loadHistorico = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contas_financeiras')
        .select('id, descricao, valor, data_vencimento')
        .eq('personal_id', user.id)
        .eq('tipo', 'receber')
        .eq('pago', true)
        .order('data_vencimento', { ascending: false });

      if (error) throw error;
      setItens((data || []).map((r: any) => ({
        id: r.id,
        descricao: r.descricao || '',
        valor: typeof r.valor === 'number' ? r.valor : parseFloat(String(r.valor)) || 0,
        data_vencimento: r.data_vencimento || '',
      })));
    } catch (error: any) {
      console.error('Erro ao carregar histórico:', error);
      toast.error('Erro ao carregar histórico de recebimentos');
    } finally {
      setLoading(false);
    }
  };

  const itensFiltrados = useMemo(() => {
    if (!filtroMes) return itens;
    return itens.filter((i) => i.data_vencimento.startsWith(filtroMes));
  }, [itens, filtroMes]);

  const mesesDisponiveis = useMemo(() => {
    const set = new Set(itens.map((i) => i.data_vencimento.slice(0, 7)));
    return Array.from(set).sort().reverse();
  }, [itens]);

  const totalExibido = useMemo(() => itensFiltrados.reduce((s, i) => s + i.valor, 0), [itensFiltrados]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-sans font-semibold text-white mb-2">Histórico de Entrada</h1>
        <p className="text-gray-light text-sm sm:text-base">
          Todos os recebimentos que você lançou (mensalidades e rendas extras). Cada linha é estática: nome e valor ficam salvos mesmo se o aluno for excluído.
        </p>
      </div>

      <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/30">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-green-500/20">
              <Receipt className="text-green-500" size={28} />
            </div>
            <div>
              <p className="text-gray-light text-sm">Total {filtroMes ? 'no período' : 'geral'}</p>
              <p className="text-2xl font-bold text-green-500">{currencyFormatter.format(totalExibido)}</p>
              <p className="text-xs text-gray-light mt-0.5">
                {itensFiltrados.length} {itensFiltrados.length === 1 ? 'lançamento' : 'lançamentos'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="text-gray-light" size={20} />
            <select
              value={filtroMes}
              onChange={(e) => setFiltroMes(e.target.value)}
              className="input-core w-full sm:w-auto min-w-[180px]"
            >
              <option value="">Todos os meses</option>
              {mesesDisponiveis.map((ym) => {
                const [y, m] = ym.split('-').map(Number);
                const label = format(new Date(y, m - 1, 1), 'MMMM/yyyy', { locale: ptBR });
                return (
                  <option key={ym} value={ym}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <ArrowDownToLine size={22} className="text-green-500" />
          Extrato de recebimentos
        </h2>

        {loading ? (
          <div className="py-12 text-center text-gray-light">Carregando histórico...</div>
        ) : itensFiltrados.length === 0 ? (
          <div className="py-12 text-center">
            <Receipt className="mx-auto text-gray-dark mb-3" size={48} />
            <p className="text-gray-light">
              {filtroMes ? 'Nenhum recebimento neste mês.' : 'Nenhum recebimento registrado ainda.'}
            </p>
            <p className="text-gray-light text-sm mt-1">
              Use &quot;Lançar pagamento&quot; no Financeiro ou em Alunos para criar lançamentos.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-dark">
            {itensFiltrados.map((item) => (
              <li
                key={item.id}
                className="py-4 px-2 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-dark-soft/50 rounded-lg transition-colors"
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <ArrowDownToLine className="text-green-500" size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-medium truncate">{item.descricao}</p>
                    <p className="text-gray-light text-sm">
                      Data do recebimento: {item.data_vencimento ? format(parseLocalDate(item.data_vencimento), "dd/MM/yyyy", { locale: ptBR }) : '-'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 sm:pl-4">
                  <span className="text-green-500 font-semibold">+{currencyFormatter.format(item.valor)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
};
