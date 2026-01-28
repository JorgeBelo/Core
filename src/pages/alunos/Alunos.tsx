import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Eye, Filter, Edit, Trash2, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import type { Aluno } from '../../types';
import { CadastroAlunoModal } from './CadastroAlunoModal';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { maskWhatsApp } from '../../utils/masks';
import toast from 'react-hot-toast';

export const Alunos = () => {
  const { user } = useAuth();
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativo' | 'inativo'>('todos');
  const [showModal, setShowModal] = useState(false);
  const [editingAluno, setEditingAluno] = useState<Aluno | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmInativarAluno, setConfirmInativarAluno] = useState<Aluno | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadAlunos();
    }
  }, [user]);

  const loadAlunos = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('alunos')
        .select('*')
        .eq('personal_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const lista = (data || []) as Aluno[];
      setAlunos(lista);

      // Notificações de vencimento e aniversário (somente ao carregar)
      const hoje = new Date();
      const diaHoje = hoje.getDate();
      const mesHoje = hoje.getMonth();

      lista.forEach((aluno) => {
        const nome = aluno.nome || aluno.name || 'Aluno';

        // Vencimento hoje e ainda não pago
        if (aluno.payment_day === diaHoje && aluno.payment_status !== 'pago') {
          toast(`Hoje vence a mensalidade de ${nome}.`, {
            icon: '💰',
          });
        }

        // Aniversário hoje
        if (aluno.birth_date) {
          const dt = new Date(aluno.birth_date);
          if (dt.getDate() === diaHoje && dt.getMonth() === mesHoje) {
            toast(`Hoje é aniversário de ${nome}! 🎉`, {
              icon: '🎂',
            });
          }
        }
      });
    } catch (error: any) {
      console.error('Erro ao carregar alunos:', error);
      toast.error('Erro ao carregar alunos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja excluir o aluno "${nome}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('alunos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Aluno excluído com sucesso!');
      loadAlunos();
    } catch (error: any) {
      console.error('Erro ao excluir aluno:', error);
      toast.error(error.message || 'Erro ao excluir aluno');
    }
  };

  const handleEdit = (aluno: Aluno) => {
    setEditingAluno(aluno);
    setShowModal(true);
  };

  const filteredAlunos = alunos.filter((aluno) => {
    // Usa 'nome' (coluna do banco) se existir, senão usa 'name' (compatibilidade)
    const alunoNome = aluno.nome || aluno.name || '';
    const matchesSearch = alunoNome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = 
      statusFilter === 'todos' || 
      (statusFilter === 'ativo' && aluno.active) ||
      (statusFilter === 'inativo' && !aluno.active);
    return matchesSearch && matchesStatus;
  });

  const currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  });

  const alunosAtivos = alunos.filter((a) => a.active);

  const totalRecebido = alunosAtivos
    .filter((a) => a.payment_status === 'pago')
    .reduce((sum, a) => {
      const v = typeof a.monthly_fee === 'number' ? a.monthly_fee : parseFloat(String(a.monthly_fee)) || 0;
      return sum + v;
    }, 0);

  const totalPendentes = alunosAtivos
    .filter((a) => a.payment_status !== 'pago')
    .reduce((sum, a) => {
      const v = typeof a.monthly_fee === 'number' ? a.monthly_fee : parseFloat(String(a.monthly_fee)) || 0;
      return sum + v;
    }, 0);

  const totalMes = alunosAtivos.reduce((sum, a) => {
    const v = typeof a.monthly_fee === 'number' ? a.monthly_fee : parseFloat(String(a.monthly_fee)) || 0;
    return sum + v;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-sans font-semibold text-white mb-2">Alunos</h1>
          <p className="text-gray-light">Gerencie seus alunos e seus dados</p>
        </div>
        <Button 
          onClick={() => {
            setEditingAluno(null);
            setShowModal(true);
          }}
          className="flex items-center"
        >
          <Plus size={20} className="mr-2" />
          Cadastrar Novo Aluno
        </Button>
      </div>

      {/* Cards de Resumo - estilo Financeiro */}
      {alunos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-light text-sm mb-1">Total Recebido (Mensalidades)</p>
                <p className="text-2xl font-bold text-green-500">
                  {currencyFormatter.format(totalRecebido)}
                </p>
              </div>
              <CheckCircle className="text-green-500" size={32} />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-light text-sm mb-1">Pendentes (Mensalidades)</p>
                <p className="text-2xl font-bold text-primary">
                  {currencyFormatter.format(totalPendentes)}
                </p>
              </div>
              <Clock className="text-primary" size={32} />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-light text-sm mb-1">Total do Mês (Mensalidades)</p>
                <p className="text-2xl font-bold text-white">
                  {currencyFormatter.format(totalMes)}
                </p>
              </div>
              <DollarSign className="text-white" size={32} />
            </div>
          </Card>
        </div>
      )}

      {/* Filtros e Busca */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-light" size={20} />
            <input
              type="text"
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-core w-full pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-light" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'todos' | 'ativo' | 'inativo')}
              className="input-core"
            >
              <option value="todos">Todos</option>
              <option value="ativo">Ativos</option>
              <option value="inativo">Inativos</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Tabela de Alunos */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-dark">
                <th className="text-left py-3 px-4 text-gray-light font-medium">Aluno</th>
                <th className="text-left py-3 px-4 text-gray-light font-medium">WhatsApp</th>
                <th className="text-left py-3 px-4 text-gray-light font-medium">Mensalidade</th>
                <th className="text-left py-3 px-4 text-gray-light font-medium">Freq. semana</th>
                <th className="text-left py-3 px-4 text-gray-light font-medium">Vencimento</th>
                <th className="text-left py-3 px-4 text-gray-light font-medium">Status Pagamento</th>
                <th className="text-left py-3 px-4 text-gray-light font-medium">Status</th>
                <th className="text-left py-3 px-4 text-gray-light font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-light">
                    Carregando...
                  </td>
                </tr>
              ) : filteredAlunos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-light">
                    Nenhum aluno encontrado
                  </td>
                </tr>
              ) : (
                filteredAlunos.map((aluno) => {
                  // Usa 'nome' (coluna do banco) se existir, senão usa 'name' (compatibilidade)
                  const alunoNome = aluno.nome || aluno.name || 'Sem nome';
                  return (
                    <tr key={aluno.id} className="border-b border-gray-dark hover:bg-dark-soft transition-colors">
                    <td className="py-4 px-4 text-white">
                      {aluno.active && (
                        <span
                          className={`inline-block w-2 h-2 rounded-full mr-2 ${
                            aluno.payment_status === 'pago' ? 'bg-green-500' : 'bg-primary'
                          }`}
                        ></span>
                      )}
                      {alunoNome}
                    </td>
                    <td className="py-4 px-4 text-gray-light">
                      {aluno.whatsapp ? maskWhatsApp(aluno.whatsapp) : '-'}
                    </td>
                    <td className="py-4 px-4 text-white font-semibold">
                      {currencyFormatter.format(
                        typeof aluno.monthly_fee === 'number'
                          ? aluno.monthly_fee
                          : parseFloat(String(aluno.monthly_fee)) || 0
                      )}
                    </td>
                    <td className="py-4 px-4 text-gray-light">
                      {aluno.frequency_per_week
                        ? `${aluno.frequency_per_week}x/semana`
                        : '-'}
                    </td>
                    <td className="py-4 px-4 text-gray-light">
                      {aluno.payment_day
                        ? `Todo dia ${aluno.payment_day}`
                        : '-'}
                    </td>
                    <td className="py-4 px-4">
                      {aluno.active ? (
                        <button
                          type="button"
                          onClick={async () => {
                            if (!user) return;
                            const current = aluno.payment_status || 'pendente';
                            const ordem: Array<Aluno['payment_status']> = ['pendente', 'pago'];
                            const idx = ordem.indexOf(current);
                            const next = ordem[(idx + 1) % ordem.length];

                            try {
                              const { error } = await supabase
                                .from('alunos')
                                .update({ payment_status: next })
                                .eq('id', aluno.id);
                              if (error) throw error;

                              setAlunos((prev) =>
                                prev.map((a) =>
                                  a.id === aluno.id ? { ...a, payment_status: next } : a
                                )
                              );

                              toast.success(`Status de pagamento de ${alunoNome} atualizado para "${next}".`);
                            } catch (err: any) {
                              console.error('Erro ao atualizar status de pagamento:', err);
                              toast.error('Não foi possível atualizar o status de pagamento.');
                            }
                          }}
                          className="focus:outline-none"
                        >
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              aluno.payment_status === 'pago'
                                ? 'bg-green-500/20 text-green-500'
                                : 'bg-primary/20 text-primary'
                            }`}
                          >
                            {aluno.payment_status === 'pago'
                              ? 'Pago'
                              : aluno.payment_status === 'atrasado'
                              ? 'Atrasado'
                              : 'Pendente'}
                          </span>
                        </button>
                      ) : (
                        <span className="text-gray-light">-</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <button
                        type="button"
                        onClick={() => {
                          if (aluno.active) {
                            // Confirmar inativação
                            setConfirmInativarAluno(aluno);
                          } else {
                            // Reativar direto
                            (async () => {
                              try {
                                const { error } = await supabase
                                  .from('alunos')
                                  .update({ active: true })
                                  .eq('id', aluno.id);
                                if (error) throw error;
                                setAlunos((prev) =>
                                  prev.map((a) =>
                                    a.id === aluno.id ? { ...a, active: true } : a
                                  )
                                );
                                toast.success(`${alunoNome} reativado(a) com sucesso.`);
                              } catch (err: any) {
                                console.error('Erro ao reativar aluno:', err);
                                toast.error('Não foi possível reativar o aluno.');
                              }
                            })();
                          }
                        }}
                        className="focus:outline-none"
                      >
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            aluno.active
                              ? 'bg-green-500/20 text-green-500'
                              : 'bg-gray-light/20 text-gray-light'
                          }`}
                        >
                          {aluno.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </button>
                    </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => navigate(`/alunos/${aluno.id}`)}
                            className="text-primary hover:text-primary-light transition-colors flex items-center gap-1"
                            title="Ver Perfil"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleEdit(aluno)}
                            className="text-yellow-500 hover:text-yellow-400 transition-colors flex items-center gap-1"
                            title="Editar"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(aluno.id, alunoNome)}
                            className="text-primary hover:text-primary-light transition-colors flex items-center gap-1"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {showModal && (
        <CadastroAlunoModal
          aluno={editingAluno}
          onClose={() => {
            setShowModal(false);
            setEditingAluno(null);
            loadAlunos();
          }}
        />
      )}

      {confirmInativarAluno && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-soft border border-gray-dark rounded-lg w-full max-w-md p-6">
            <h2 className="text-xl font-sans font-semibold text-white mb-4">
              Confirmar inativação
            </h2>
            <p className="text-gray-light text-sm mb-4">
              Se o aluno ficar inativo por 12 meses, ele será removido automaticamente do sistema.
              Deseja continuar?
            </p>
            <div className="flex justify-end gap-3 mt-4">
              <Button
                variant="secondary"
                type="button"
                onClick={() => setConfirmInativarAluno(null)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={async () => {
                  const aluno = confirmInativarAluno;
                  if (!aluno || !user) {
                    setConfirmInativarAluno(null);
                    return;
                  }
                  try {
                    const { error } = await supabase
                      .from('alunos')
                      .update({ active: false })
                      .eq('id', aluno.id);
                    if (error) throw error;
                    setAlunos((prev) =>
                      prev.map((a) =>
                        a.id === aluno.id ? { ...a, active: false } : a
                      )
                    );
                    toast.success(`${aluno.nome || aluno.name || 'Aluno'} marcado como inativo.`);
                  } catch (err: any) {
                    console.error('Erro ao inativar aluno:', err);
                    toast.error('Não foi possível inativar o aluno.');
                  } finally {
                    setConfirmInativarAluno(null);
                  }
                }}
              >
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
