import { useState, useEffect } from 'react';
import { Plus, DollarSign, CheckCircle, Clock, Edit, Trash2, ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import type { ContaFinanceira } from '../../types';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { format, startOfMonth, endOfMonth, isWithinInterval, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { parseLocalDate } from '../../utils/dateUtils';
import { CadastroContaModal } from './CadastroContaModal';
import { RendaExtraModal } from './RendaExtraModal';
import { LancarPagamentoModal } from './LancarPagamentoModal';

export const Financeiro = () => {
  const { user } = useAuth();
  const [contas, setContas] = useState<ContaFinanceira[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showRendaExtraModal, setShowRendaExtraModal] = useState(false);
  const [showLancarPagamentoModal, setShowLancarPagamentoModal] = useState(false);
  const [editingConta, setEditingConta] = useState<ContaFinanceira | null>(null);
  const [loading, setLoading] = useState(true);

  const hoje = new Date();
  const [mesRef, setMesRef] = useState<Date>(() => new Date(hoje.getFullYear(), hoje.getMonth(), 1));

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

  const inicioMes = startOfMonth(mesRef);
  const fimMes = endOfMonth(mesRef);

  const contasDoMesFiltradas = contas.filter((conta) => {
    const dataVenc = parseLocalDate(conta.data_vencimento);
    return isWithinInterval(dataVenc, { start: inicioMes, end: fimMes });
  });

  // Apenas contas a pagar do mês
  const contasPagarDoMes = contasDoMesFiltradas.filter((c) => c.tipo === 'pagar');

  // Deduplica contas FIXA no mesmo mês
  const contasMes = (() => {
    const seen = new Set<string>();
    return contasPagarDoMes.filter((conta) => {
      if (!conta.conta_fixa) return true;
      const key = `${conta.descricao}|${conta.valor}|${conta.tipo}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  })();

  const totalPendente = contasMes.filter((c) => !c.pago).reduce((sum, c) => sum + c.valor, 0);
  const totalPago = contasMes.filter((c) => c.pago).reduce((sum, c) => sum + c.valor, 0);
  const totalMesPagar = totalPendente + totalPago;

  // Rendas extras do mês (tipo receber)
  const rendasExtrasMes = contasDoMesFiltradas.filter((c) => c.tipo === 'receber');
  const totalRendasExtras = rendasExtrasMes.reduce((sum, c) => sum + c.valor, 0);

  const handleDeleteConta = async (conta: ContaFinanceira) => {
    if (!confirm(`Deseja realmente excluir a conta "${conta.descricao}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('contas_financeiras')
        .delete()
        .eq('id', conta.id);

      if (error) throw error;

      toast.success('Conta excluída com sucesso!');
      loadContas();
    } catch (error: any) {
      console.error('Erro ao excluir conta:', error);
      toast.error(error.message || 'Erro ao excluir conta');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-sans font-semibold text-white mb-2">Financeiro</h1>
          <p className="text-gray-light text-sm sm:text-base">Contas a pagar por mês (única, parcelada ou fixa)</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => setShowLancarPagamentoModal(true)}
            className="min-h-[44px]"
          >
            Lançar pagamento
          </Button>
          <Button
            onClick={() => {
              setEditingConta(null);
              setShowModal(true);
            }}
            className="flex items-center w-full sm:w-auto justify-center min-h-[44px]"
          >
            <Plus size={20} className="mr-2" />
            Nova conta a pagar
          </Button>
        </div>
      </div>

      {/* Seletor de mês: contas do mês escolhido; conta única só aparece no mês do vencimento; parcelado mostra parcela do mês */}
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
          Voltar ao mês atual
        </button>
      </Card>

      {/* Cards: só contas a pagar */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-gray-light text-xs sm:text-sm mb-1 truncate">Pendentes</p>
              <p className="text-lg sm:text-2xl font-bold text-primary truncate">
                R$ {totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <Clock className="text-primary flex-shrink-0 hidden sm:block" size={32} />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-gray-light text-xs sm:text-sm mb-1 truncate">Já pago</p>
              <p className="text-lg sm:text-2xl font-bold text-green-500 truncate">
                R$ {totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <CheckCircle className="text-green-500 flex-shrink-0 hidden sm:block" size={32} />
          </div>
        </Card>
        <Card className="col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-gray-light text-xs sm:text-sm mb-1 truncate">Total do mês</p>
              <p className="text-lg sm:text-2xl font-bold text-white truncate">
                R$ {totalMesPagar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <DollarSign className="text-white flex-shrink-0 hidden sm:block" size={32} />
          </div>
        </Card>
      </div>

      {/* Contas a pagar do mês */}
      <Card title="Contas a pagar do mês">
        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-dark">
                <th className="text-left py-3 px-4 text-gray-light font-medium">Descrição</th>
                <th className="text-left py-3 px-4 text-gray-light font-medium">Parcelas</th>
                <th className="text-left py-3 px-4 text-gray-light font-medium">Vencimento</th>
                <th className="text-left py-3 px-4 text-gray-light font-medium">Valor</th>
                <th className="text-left py-3 px-4 text-gray-light font-medium">Status</th>
                <th className="text-left py-3 px-4 text-gray-light font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-light">
                    Carregando...
                  </td>
                </tr>
              ) : contasMes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-light">
                    Nenhuma conta a pagar neste mês
                  </td>
                </tr>
              ) : (
                contasMes.map((conta) => (
                  <tr
                    key={conta.id}
                    className={`border-b border-gray-dark hover:bg-dark-soft transition-colors ${
                      !conta.pago && parseLocalDate(conta.data_vencimento) < new Date()
                        ? 'bg-primary/5'
                        : ''
                    }`}
                  >
                    <td className="py-4 px-4 text-white">
                      <span
                        className={`inline-block w-2 h-2 rounded-full mr-2 ${
                          conta.pago ? 'bg-green-500' : 'bg-primary'
                        }`}
                      />
                      {String(conta.descricao).split(' - Parcela')[0]}
                    </td>
                    <td className="py-4 px-4 text-gray-light">
                      {conta.parcelada && conta.numero_parcelas
                        ? `${conta.parcela_atual || 1}/${conta.numero_parcelas}`
                        : conta.conta_fixa
                        ? 'Fixa'
                        : 'Única'}
                    </td>
                    <td className="py-4 px-4 text-gray-light">
                      {format(parseLocalDate(conta.data_vencimento), "d 'de' MMM 'de' yyyy", {
                        locale: ptBR,
                      })}
                    </td>
                    <td className="py-4 px-4 text-white font-semibold">
                      R${' '}
                      {conta.valor.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="py-4 px-4">
                      <button
                        type="button"
                        onClick={async () => {
                          if (!user) return;

                          const nextPago = !conta.pago;

                          try {
                            const { error } = await supabase
                              .from('contas_financeiras')
                              .update({ pago: nextPago })
                              .eq('id', conta.id);

                            if (error) throw error;

                            setContas((prev) =>
                              prev.map((c) =>
                                c.id === conta.id ? { ...c, pago: nextPago } : c
                              )
                            );

                            toast.success(
                              `Status atualizado para ${nextPago ? 'Pago' : 'Pendente'}.`
                            );
                          } catch (err: any) {
                            console.error('Erro ao atualizar status da conta:', err);
                            toast.error('Não foi possível atualizar o status da conta.');
                          }
                        }}
                        className="focus:outline-none min-h-[44px]"
                      >
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            conta.pago
                              ? 'bg-green-500/20 text-green-500'
                              : 'bg-primary/20 text-primary'
                          }`}
                        >
                          {conta.pago ? 'Pago' : 'Pendente'}
                        </span>
                      </button>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            setEditingConta(conta);
                            setShowModal(true);
                          }}
                          className="text-yellow-500 hover:text-yellow-400 transition-colors flex items-center gap-1 min-h-[44px] min-w-[44px] justify-center"
                          title="Editar"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteConta(conta)}
                          className="text-primary hover:text-primary-light transition-colors flex items-center gap-1 min-h-[44px] min-w-[44px] justify-center"
                          title="Excluir"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden space-y-4">
          {loading ? (
            <div className="text-center py-8 text-gray-light">Carregando...</div>
          ) : contasMes.length === 0 ? (
            <div className="text-center py-8 text-gray-light">Nenhuma conta a pagar neste mês</div>
          ) : (
            contasMes.map((conta) => (
              <div
                key={conta.id}
                className={`bg-dark-soft border border-gray-dark rounded-lg p-4 space-y-3 ${
                  !conta.pago && parseLocalDate(conta.data_vencimento) < new Date()
                    ? 'border-primary/50 bg-primary/5'
                    : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span
                      className={`flex-shrink-0 w-3 h-3 rounded-full ${
                        conta.pago ? 'bg-green-500' : 'bg-primary'
                      }`}
                    />
                    <h3 className="text-white font-semibold truncate">
                      {String(conta.descricao).split(' - Parcela')[0]}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!user) return;

                      const nextPago = !conta.pago;

                      try {
                        const { error } = await supabase
                          .from('contas_financeiras')
                          .update({ pago: nextPago })
                          .eq('id', conta.id);

                        if (error) throw error;

                        setContas((prev) =>
                          prev.map((c) =>
                            c.id === conta.id ? { ...c, pago: nextPago } : c
                          )
                        );

                        toast.success(`Status atualizado para ${nextPago ? 'Pago' : 'Pendente'}.`);
                      } catch (err: any) {
                        console.error('Erro ao atualizar status da conta:', err);
                        toast.error('Não foi possível atualizar o status da conta.');
                      }
                    }}
                    className="flex-shrink-0 min-h-[44px] px-3"
                  >
                    <span
                      className={`px-3 py-2 rounded-full text-xs font-medium ${
                        conta.pago
                          ? 'bg-green-500/20 text-green-500'
                          : 'bg-primary/20 text-primary'
                      }`}
                    >
                      {conta.pago ? 'Pago' : 'Pendente'}
                    </span>
                  </button>
                </div>

                {/* Informações */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-light text-xs mb-1">Valor</p>
                    <p className="text-white font-semibold">
                      R${' '}
                      {conta.valor.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-light text-xs mb-1">Parcelas</p>
                    <p className="text-white">
                      {conta.parcelada && conta.numero_parcelas
                        ? `${conta.parcela_atual || 1}/${conta.numero_parcelas}`
                        : conta.conta_fixa
                        ? 'Fixa'
                        : 'Única'}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-gray-light text-xs mb-1">Vencimento</p>
                  <p className="text-white text-sm">
                    {format(parseLocalDate(conta.data_vencimento), "d 'de' MMM 'de' yyyy", {
                      locale: ptBR,
                    })}
                  </p>
                </div>

                {/* Ações */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-dark">
                  <button
                    onClick={() => {
                      setEditingConta(conta);
                      setShowModal(true);
                    }}
                    className="flex items-center gap-2 text-yellow-500 hover:text-yellow-400 transition-colors min-h-[44px] px-4"
                  >
                    <Edit size={18} />
                    <span className="text-sm">Editar</span>
                  </button>
                  <button
                    onClick={() => handleDeleteConta(conta)}
                    className="flex items-center gap-2 text-primary hover:text-primary-light transition-colors min-h-[44px] px-4"
                  >
                    <Trash2 size={18} />
                    <span className="text-sm">Excluir</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Rendas extras: receitas do mês (ex: venda de suplemento, consultoria) */}
      <Card
        title="Rendas extras"
      >
        <p className="text-gray-light text-sm mb-4">
          Receitas extras do mês (ex: venda de suplemento, consultoria, aula extra). Cadastre e some aqui.
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <Button
            variant="secondary"
            onClick={() => setShowRendaExtraModal(true)}
            className="flex items-center justify-center gap-2 min-h-[44px] w-full sm:w-auto"
          >
            <TrendingUp size={20} />
            Adicionar renda extra
          </Button>
          <p className="text-white font-semibold text-lg">
            Total do mês: R$ {totalRendasExtras.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        {rendasExtrasMes.length === 0 ? (
          <p className="text-gray-light text-sm py-4">Nenhuma renda extra neste mês.</p>
        ) : (
          <ul className="space-y-2 border border-gray-dark rounded-lg divide-y divide-gray-dark">
            {rendasExtrasMes.map((conta) => (
              <li
                key={conta.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3 px-4 hover:bg-dark-soft"
              >
                <div>
                  <p className="text-white font-medium">{conta.descricao}</p>
                  <p className="text-gray-light text-sm">
                    {format(parseLocalDate(conta.data_vencimento), "d 'de' MMM", { locale: ptBR })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-green-500 font-semibold">
                    R$ {conta.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteConta(conta)}
                    className="text-primary hover:text-primary-light text-sm min-h-[44px] px-2"
                    title="Excluir"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {showModal && (
        <CadastroContaModal
          conta={editingConta}
          onClose={() => {
            setShowModal(false);
            setEditingConta(null);
            loadContas();
          }}
        />
      )}

      {showRendaExtraModal && (
        <RendaExtraModal
          mesRef={mesRef}
          onClose={() => {
            setShowRendaExtraModal(false);
            loadContas();
          }}
        />
      )}

      {showLancarPagamentoModal && (
        <LancarPagamentoModal
          onClose={() => setShowLancarPagamentoModal(false)}
          onSuccess={loadContas}
        />
      )}
    </div>
  );
};