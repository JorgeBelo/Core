import { useState, useEffect } from 'react';
import { Plus, DollarSign, CheckCircle, Clock, Edit, Trash2 } from 'lucide-react';
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
  const [editingConta, setEditingConta] = useState<ContaFinanceira | null>(null);
  const [loading, setLoading] = useState(true);

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

  // Totais do mês atual
  const hoje = new Date();
  const inicioMes = startOfMonth(hoje);
  const fimMes = endOfMonth(hoje);

  const contasMes = contas.filter((conta) => {
    const dataVenc = new Date(conta.data_vencimento);
    return isWithinInterval(dataVenc, { start: inicioMes, end: fimMes });
  });

  const totalRecebido = contasMes
    .filter((c) => c.tipo === 'receber' && c.pago)
    .reduce((sum, c) => sum + c.valor, 0);

  const totalPendente = contasMes
    .filter((c) => !c.pago)
    .reduce((sum, c) => sum + c.valor, 0);

  const totalMes = totalRecebido + totalPendente;

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
          <p className="text-gray-light text-sm sm:text-base">Controle de contas a pagar e receber</p>
        </div>
        <Button
          onClick={() => {
            setEditingConta(null);
            setShowModal(true);
          }}
          className="flex items-center w-full sm:w-auto justify-center min-h-[44px]"
        >
          <Plus size={20} className="mr-2" />
          Nova Conta
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-gray-light text-xs sm:text-sm mb-1 truncate">Total Recebido</p>
              <p className="text-lg sm:text-2xl font-bold text-green-500 truncate">
                R$ {totalRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <CheckCircle className="text-green-500 flex-shrink-0 hidden sm:block" size={32} />
          </div>
        </Card>

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

        <Card className="col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-gray-light text-xs sm:text-sm mb-1 truncate">Total do Mês</p>
              <p className="text-lg sm:text-2xl font-bold text-white truncate">
                R$ {totalMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <DollarSign className="text-white flex-shrink-0 hidden sm:block" size={32} />
          </div>
        </Card>
      </div>

      {/* Histórico Financeiro */}
      <Card title="Histórico Financeiro">
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
                    Nenhuma conta encontrada
                  </td>
                </tr>
              ) : (
                contasMes.map((conta) => (
                  <tr
                    key={conta.id}
                    className={`border-b border-gray-dark hover:bg-dark-soft transition-colors ${
                      !conta.pago && new Date(conta.data_vencimento) < new Date()
                        ? 'bg-primary/5'
                        : ''
                    }`}
                  >
                    <td className="py-4 px-4 text-white">
                      {conta.tipo === 'pagar' && (
                        <span
                          className={`inline-block w-2 h-2 rounded-full mr-2 ${
                            conta.pago ? 'bg-green-500' : 'bg-primary'
                          }`}
                        ></span>
                      )}
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
                      {format(new Date(conta.data_vencimento), "d 'de' MMM 'de' yyyy", {
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

                            const label =
                              conta.tipo === 'receber'
                                ? nextPago
                                  ? 'Recebido'
                                  : 'Pendente'
                                : nextPago
                                ? 'Pago'
                                : 'Pendente';

                            toast.success(
                              `Status da conta "${conta.descricao}" atualizado para "${label}".`
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
                          {conta.tipo === 'receber'
                            ? conta.pago
                              ? 'Recebido'
                              : 'Pendente'
                            : conta.pago
                            ? 'Pago'
                            : 'Pendente'}
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
            <div className="text-center py-8 text-gray-light">Nenhuma conta encontrada</div>
          ) : (
            contasMes.map((conta) => (
              <div
                key={conta.id}
                className={`bg-dark-soft border border-gray-dark rounded-lg p-4 space-y-3 ${
                  !conta.pago && new Date(conta.data_vencimento) < new Date()
                    ? 'border-primary/50 bg-primary/5'
                    : ''
                }`}
              >
                {/* Header: Descrição e Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {conta.tipo === 'pagar' && (
                      <span
                        className={`flex-shrink-0 w-3 h-3 rounded-full ${
                          conta.pago ? 'bg-green-500' : 'bg-primary'
                        }`}
                      ></span>
                    )}
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

                          const label =
                            conta.tipo === 'receber'
                              ? nextPago
                                ? 'Recebido'
                                : 'Pendente'
                              : nextPago
                              ? 'Pago'
                              : 'Pendente';

                        toast.success(
                            `Status da conta "${conta.descricao}" atualizado para "${label}".`
                        );
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
                      {conta.tipo === 'receber'
                        ? conta.pago
                          ? 'Recebido'
                          : 'Pendente'
                        : conta.pago
                        ? 'Pago'
                        : 'Pendente'}
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
                    {format(new Date(conta.data_vencimento), "d 'de' MMM 'de' yyyy", {
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
    </div>
  );
};