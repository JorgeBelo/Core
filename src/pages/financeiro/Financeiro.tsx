import { useState, useEffect } from 'react';
import { Plus, TrendingDown, TrendingUp } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import type { ContaFinanceira } from '../../types';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { CadastroContaModal } from './CadastroContaModal';

export const Financeiro = () => {
  const { user } = useAuth();
  const [contas, setContas] = useState<ContaFinanceira[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tipoFilter, setTipoFilter] = useState<'todos' | 'pagar' | 'receber'>('todos');

  useEffect(() => {
    if (user) {
      loadContas();
    }
  }, [user]);

  const loadContas = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contas_financeiras')
        .select('*')
        .eq('personal_id', user.id)
        .order('data_vencimento', { ascending: true });

      if (error) throw error;

      setContas(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar contas:', error);
      toast.error('Erro ao carregar contas financeiras');
    } finally {
      setLoading(false);
    }
  };

  const filteredContas = contas.filter((conta) => {
    return tipoFilter === 'todos' || conta.tipo === tipoFilter;
  });

  // Calcular totais do mês atual
  const hoje = new Date();
  const inicioMes = startOfMonth(hoje);
  const fimMes = endOfMonth(hoje);

  const contasMes = contas.filter((conta) => {
    const dataVenc = new Date(conta.data_vencimento);
    return isWithinInterval(dataVenc, { start: inicioMes, end: fimMes });
  });

  const totalAPagar = contasMes
    .filter((c) => c.tipo === 'pagar' && !c.pago)
    .reduce((sum, c) => sum + c.valor, 0);

  const totalAReceber = contasMes
    .filter((c) => c.tipo === 'receber' && !c.pago)
    .reduce((sum, c) => sum + c.valor, 0);

  const saldo = totalAReceber - totalAPagar;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-sans font-semibold text-white mb-2">Financeiro</h1>
          <p className="text-gray-light">Controle de contas a pagar e receber</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus size={20} className="mr-2" />
          Nova Conta
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-light text-sm mb-1">Total a Pagar (Mês)</p>
              <p className="text-2xl font-bold text-primary">
                R$ {totalAPagar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <TrendingDown className="text-primary" size={32} />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-light text-sm mb-1">Faturamento Total</p>
              <p className="text-2xl font-bold text-green-500">
                R$ {totalAReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <TrendingUp className="text-green-500" size={32} />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-light text-sm mb-1">Saldo/Lucro</p>
              <p className={`text-2xl font-bold ${saldo >= 0 ? 'text-green-500' : 'text-primary'}`}>
                R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className={`${saldo >= 0 ? 'text-green-500' : 'text-primary'}`}>
              {saldo >= 0 ? <TrendingUp size={32} /> : <TrendingDown size={32} />}
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <div className="flex items-center gap-4">
          <label className="text-gray-light">Filtrar por:</label>
          <select
            value={tipoFilter}
            onChange={(e) => setTipoFilter(e.target.value as 'todos' | 'pagar' | 'receber')}
            className="input-core"
          >
            <option value="todos">Todas</option>
            <option value="pagar">Contas a Pagar</option>
            <option value="receber">Contas a Receber</option>
          </select>
        </div>
      </Card>

      {/* Histórico Financeiro */}
      <Card title="Histórico Financeiro">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-dark">
                <th className="text-left py-3 px-4 text-gray-light font-medium">Descrição</th>
                <th className="text-left py-3 px-4 text-gray-light font-medium">Categoria</th>
                <th className="text-left py-3 px-4 text-gray-light font-medium">Tipo</th>
                <th className="text-left py-3 px-4 text-gray-light font-medium">Vencimento</th>
                <th className="text-left py-3 px-4 text-gray-light font-medium">Valor</th>
                <th className="text-left py-3 px-4 text-gray-light font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-light">
                    Carregando...
                  </td>
                </tr>
              ) : filteredContas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-light">
                    Nenhuma conta encontrada
                  </td>
                </tr>
              ) : (
                filteredContas.map((conta) => (
                  <tr
                    key={conta.id}
                    className={`border-b border-gray-dark hover:bg-dark-soft transition-colors ${
                      !conta.pago && new Date(conta.data_vencimento) < new Date()
                        ? 'bg-primary/5'
                        : ''
                    }`}
                  >
                    <td className="py-4 px-4 text-white">
                      {conta.descricao}
                      {conta.parcelada && conta.numero_parcelas && (
                        <span className="text-xs text-gray-light ml-2">
                          ({conta.parcela_atual || 1}/{conta.numero_parcelas})
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-gray-light">{conta.categoria}</td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          conta.tipo === 'pagar'
                            ? 'bg-primary/20 text-primary'
                            : 'bg-green-500/20 text-green-500'
                        }`}
                      >
                        {conta.tipo === 'pagar' ? 'A Pagar' : 'A Receber'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-light">
                      {format(new Date(conta.data_vencimento), "d 'de' MMM 'de' yyyy", {
                        locale: ptBR,
                      })}
                    </td>
                    <td className="py-4 px-4 text-white font-semibold">
                      {conta.tipo === 'pagar' ? '-' : '+'}R${' '}
                      {conta.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          conta.pago
                            ? 'bg-green-500/20 text-green-500'
                            : new Date(conta.data_vencimento) < new Date()
                            ? 'bg-primary/20 text-primary'
                            : 'bg-yellow-500/20 text-yellow-500'
                        }`}
                      >
                        {conta.pago
                          ? 'Pago'
                          : new Date(conta.data_vencimento) < new Date()
                          ? 'Vencido'
                          : 'Pendente'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {showModal && (
        <CadastroContaModal
          onClose={() => {
            setShowModal(false);
            loadContas();
          }}
        />
      )}
    </div>
  );
};
