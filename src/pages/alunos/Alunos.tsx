import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Eye, Filter, Edit, Trash2, CheckCircle, Clock, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import type { Aluno } from '../../types';
import { CadastroAlunoModal } from './CadastroAlunoModal';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { maskWhatsApp } from '../../utils/masks';
import toast from 'react-hot-toast';
import {
  ensureMensalidadesForMonth,
  getMensalidadesForMonth,
  updateMensalidadeStatus,
  type MensalidadeRow,
} from '../../services/mensalidadesService';
import {
  getPeriodosInativos,
  periodoCobreMes,
  criarPeriodoInativo,
  encerrarPeriodoInativo,
  type PeriodoInativo,
} from '../../services/alunoInativoPeriodosService';
import { format, subMonths, addMonths, endOfMonth, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Alunos = () => {
  const { user } = useAuth();
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [mensalidadesMes, setMensalidadesMes] = useState<MensalidadeRow[]>([]);
  const [periodosInativos, setPeriodosInativos] = useState<PeriodoInativo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativo' | 'inativo'>('todos');
  const [showModal, setShowModal] = useState(false);
  const [editingAluno, setEditingAluno] = useState<Aluno | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmInativarAluno, setConfirmInativarAluno] = useState<Aluno | null>(null);
  const navigate = useNavigate();

  const hoje = new Date();
  const [mesRef, setMesRef] = useState<Date>(() => new Date(hoje.getFullYear(), hoje.getMonth(), 1));
  const anoAtual = mesRef.getFullYear();
  const mesAtual = mesRef.getMonth() + 1;

  useEffect(() => {
    if (user) {
      loadAlunos();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadMensalidadesDoMes();
    }
  }, [user, mesRef]);

  const loadMensalidadesDoMes = async () => {
    if (!user) return;
    try {
      await ensureMensalidadesForMonth(user.id, anoAtual, mesAtual);
      const mens = await getMensalidadesForMonth(user.id, anoAtual, mesAtual);
      setMensalidadesMes(mens);
    } catch (error: any) {
      console.error('Erro ao carregar mensalidades do mês:', error);
    }
  };

  const loadPeriodosInativos = async () => {
    if (!user) return;
    try {
      const periodos = await getPeriodosInativos(user.id);
      setPeriodosInativos(periodos);
    } catch (e) {
      console.error('Erro ao carregar períodos de inatividade:', e);
    }
  };

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

      const periodos = await getPeriodosInativos(user.id);
      setPeriodosInativos(periodos);

      await ensureMensalidadesForMonth(user.id, anoAtual, mesAtual);
      const mens = await getMensalidadesForMonth(user.id, anoAtual, mesAtual);
      setMensalidadesMes(mens);

      const diaHoje = hoje.getDate();
      const mesHoje = hoje.getMonth();

      lista.forEach((aluno) => {
        const nome = aluno.nome || aluno.name || 'Aluno';
        const mensAluno = mens.find((m: MensalidadeRow) => m.aluno_id === aluno.id);

        if (aluno.payment_day === diaHoje && mensAluno?.status !== 'pago') {
          toast(`Hoje vence a mensalidade de ${nome}.`, { icon: '💰' });
        }
        if (aluno.birth_date) {
          const dt = new Date(aluno.birth_date);
          if (dt.getDate() === diaHoje && dt.getMonth() === mesHoje) {
            toast(`Hoje é aniversário de ${nome}! 🎉`, { icon: '🎂' });
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

  const getStatusAluno = (alunoId: string): 'pago' | 'pendente' | 'atrasado' => {
    const m = mensalidadesMes.find((x) => x.aluno_id === alunoId);
    return m?.status || 'pendente';
  };

  const getMensalidadeAluno = (alunoId: string): MensalidadeRow | undefined =>
    mensalidadesMes.find((x) => x.aluno_id === alunoId);

  /** Aluno considerado ativo no mês selecionado: nenhum período de inatividade cobre o mês */
  const activeForThisMonth = (aluno: Aluno): boolean => {
    const firstDay = format(startOfMonth(mesRef), 'yyyy-MM-dd');
    const lastDay = format(endOfMonth(mesRef), 'yyyy-MM-dd');
    const periodosDoAluno = periodosInativos.filter((p) => p.aluno_id === aluno.id);
    const algumCobre = periodosDoAluno.some((p) => periodoCobreMes(p, firstDay, lastDay));
    return !algumCobre;
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
    const alunoNome = aluno.nome || aluno.name || '';
    const matchesSearch = alunoNome.toLowerCase().includes(searchTerm.toLowerCase());
    const ativoNoMes = activeForThisMonth(aluno);
    const matchesStatus =
      statusFilter === 'todos' ||
      (statusFilter === 'ativo' && ativoNoMes) ||
      (statusFilter === 'inativo' && !ativoNoMes);
    return matchesSearch && matchesStatus;
  });

  const currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  });

  const alunosAtivos = alunos.filter((a) => a.active);

  const totalRecebido = mensalidadesMes
    .filter((m) => m.status === 'pago')
    .reduce((sum, m) => sum + (typeof m.amount === 'number' ? m.amount : parseFloat(String(m.amount)) || 0), 0);

  const totalPendentes = mensalidadesMes
    .filter((m) => m.status !== 'pago')
    .reduce((sum, m) => sum + (typeof m.amount === 'number' ? m.amount : parseFloat(String(m.amount)) || 0), 0);

  const totalMes = mensalidadesMes.reduce(
    (sum, m) => sum + (typeof m.amount === 'number' ? m.amount : parseFloat(String(m.amount)) || 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-sans font-semibold text-white mb-2">Alunos</h1>
          <p className="text-gray-light text-sm sm:text-base">
            Gerencie seus alunos e status de pagamento por mês
          </p>
        </div>
        <Button 
          onClick={() => {
            setEditingAluno(null);
            setShowModal(true);
          }}
          className="flex items-center w-full sm:w-auto justify-center min-h-[44px]"
        >
          <Plus size={20} className="mr-2" />
          <span className="hidden sm:inline">Cadastrar Novo Aluno</span>
          <span className="sm:hidden">Novo Aluno</span>
        </Button>
      </div>

      {/* Seletor de mês/ano */}
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

      {/* Cards de Resumo - estilo Financeiro */}
      {alunos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-gray-light text-xs sm:text-sm mb-1 truncate">Total Recebido</p>
                <p className="text-lg sm:text-2xl font-bold text-green-500 truncate">
                  {currencyFormatter.format(totalRecebido)}
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
                  {currencyFormatter.format(totalPendentes)}
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
                  {currencyFormatter.format(totalMes)}
                </p>
              </div>
              <DollarSign className="text-white flex-shrink-0 hidden sm:block" size={32} />
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

      {/* Tabela de Alunos - Desktop */}
      <Card>
        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
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
                  const alunoNome = aluno.nome || aluno.name || 'Sem nome';
                  return (
                    <tr key={aluno.id} className="border-b border-gray-dark hover:bg-dark-soft transition-colors">
                      <td className="py-4 px-4 text-white">
                        {activeForThisMonth(aluno) && (
                          <span
                            className={`inline-block w-2 h-2 rounded-full mr-2 ${
                              getStatusAluno(aluno.id) === 'pago' ? 'bg-green-500' : 'bg-primary'
                            }`}
                          />
                        )}
                        {alunoNome}
                      </td>
                      <td className="py-4 px-4 text-gray-light">
                        {aluno.whatsapp ? maskWhatsApp(aluno.whatsapp) : '-'}
                      </td>
                      <td className="py-4 px-4 text-white font-semibold">
                        {activeForThisMonth(aluno) ? (
                          currencyFormatter.format(
                            typeof aluno.monthly_fee === 'number'
                              ? aluno.monthly_fee
                              : parseFloat(String(aluno.monthly_fee)) || 0
                          )
                        ) : (
                          <span className="text-gray-light">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-gray-light">
                        {activeForThisMonth(aluno)
                          ? (aluno.frequency_per_week
                              ? `${aluno.frequency_per_week}x/semana`
                              : '-')
                          : '-'}
                      </td>
                      <td className="py-4 px-4 text-gray-light">
                        {activeForThisMonth(aluno)
                          ? (aluno.payment_day
                              ? `Todo dia ${aluno.payment_day}`
                              : '-')
                          : '-'}
                      </td>
                      <td className="py-4 px-4">
                        {activeForThisMonth(aluno) ? (
                          <button
                            type="button"
                            onClick={async () => {
                              if (!user) return;
                              const mensAluno = getMensalidadeAluno(aluno.id);
                              if (!mensAluno) {
                                toast.error('Mensalidade do mês não encontrada. Recarregue a página.');
                                return;
                              }
                              const current = mensAluno.status || 'pendente';
                              const ordem: Array<'pendente' | 'pago'> = ['pendente', 'pago'];
                              const idx = ordem.indexOf(current);
                              const next = ordem[(idx + 1) % ordem.length];

                              try {
                                await updateMensalidadeStatus(mensAluno.id, next);
                                setMensalidadesMes((prev) =>
                                  prev.map((m) =>
                                    m.id === mensAluno.id ? { ...m, status: next, paid_date: next === 'pago' ? new Date().toISOString().slice(0, 10) : null } : m
                                  )
                                );
                                toast.success(`Status de pagamento de ${alunoNome} atualizado para "${next}".`);
                              } catch (err: any) {
                                console.error('Erro ao atualizar status de pagamento:', err);
                                toast.error('Não foi possível atualizar o status de pagamento.');
                              }
                            }}
                            className="focus:outline-none min-h-[44px]"
                          >
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                getStatusAluno(aluno.id) === 'pago'
                                  ? 'bg-green-500/20 text-green-500'
                                  : 'bg-primary/20 text-primary'
                              }`}
                            >
                              {getStatusAluno(aluno.id) === 'pago'
                                ? 'Pago'
                                : getStatusAluno(aluno.id) === 'atrasado'
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
                        if (activeForThisMonth(aluno)) {
                          setConfirmInativarAluno(aluno);
                        } else {
                          (async () => {
                            try {
                                  const ultimoDiaMesAnterior = format(endOfMonth(subMonths(mesRef, 1)), 'yyyy-MM-dd');
                                  await encerrarPeriodoInativo(aluno.id, ultimoDiaMesAnterior);
                                  const { error } = await supabase
                                    .from('alunos')
                                    .update({ active: true, data_inativacao: null })
                                    .eq('id', aluno.id);
                                  if (error) throw error;
                                  setAlunos((prev) =>
                                    prev.map((a) =>
                                      a.id === aluno.id ? { ...a, active: true, data_inativacao: null } : a
                                    )
                                  );
                                  await loadPeriodosInativos();
                                  toast.success(`${alunoNome} reativado(a) com sucesso.`);
                                  loadMensalidadesDoMes();
                                } catch (err: any) {
                                  console.error('Erro ao reativar aluno:', err);
                                  toast.error('Não foi possível reativar o aluno.');
                                }
                              })();
                            }
                          }}
                          className="focus:outline-none min-h-[44px]"
                        >
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              activeForThisMonth(aluno)
                                ? 'bg-green-500/20 text-green-500'
                                : 'bg-gray-light/20 text-gray-light'
                            }`}
                          >
                            {activeForThisMonth(aluno) ? 'Ativo' : 'Inativo'}
                          </span>
                        </button>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => navigate(`/alunos/${aluno.id}`)}
                            className="text-primary hover:text-primary-light transition-colors flex items-center gap-1 min-h-[44px] min-w-[44px] justify-center"
                            title="Ver Perfil"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => handleEdit(aluno)}
                            className="text-yellow-500 hover:text-yellow-400 transition-colors flex items-center gap-1 min-h-[44px] min-w-[44px] justify-center"
                            title="Editar"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(aluno.id, alunoNome)}
                            className="text-primary hover:text-primary-light transition-colors flex items-center gap-1 min-h-[44px] min-w-[44px] justify-center"
                            title="Excluir"
                          >
                            <Trash2 size={18} />
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

        {/* Mobile Cards */}
        <div className="lg:hidden space-y-4">
          {loading ? (
            <div className="text-center py-8 text-gray-light">Carregando...</div>
          ) : filteredAlunos.length === 0 ? (
            <div className="text-center py-8 text-gray-light">Nenhum aluno encontrado</div>
          ) : (
            filteredAlunos.map((aluno) => {
              const alunoNome = aluno.nome || aluno.name || 'Sem nome';
              return (
                <div
                  key={aluno.id}
                  className="bg-dark-soft border border-gray-dark rounded-lg p-4 space-y-3"
                >
                  {/* Header: Nome e Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {activeForThisMonth(aluno) && (
                        <span
                          className={`flex-shrink-0 w-3 h-3 rounded-full ${
                            getStatusAluno(aluno.id) === 'pago' ? 'bg-green-500' : 'bg-primary'
                          }`}
                        />
                      )}
                      <h3 className="text-white font-semibold truncate">{alunoNome}</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (activeForThisMonth(aluno)) {
                          setConfirmInativarAluno(aluno);
                        } else {
                          (async () => {
                            try {
                              const ultimoDiaMesAnterior = format(endOfMonth(subMonths(mesRef, 1)), 'yyyy-MM-dd');
                              await encerrarPeriodoInativo(aluno.id, ultimoDiaMesAnterior);
                              const { error } = await supabase
                                .from('alunos')
                                .update({ active: true, data_inativacao: null })
                                .eq('id', aluno.id);
                              if (error) throw error;
                              setAlunos((prev) =>
                                prev.map((a) =>
                                  a.id === aluno.id ? { ...a, active: true, data_inativacao: null } : a
                                )
                              );
                              await loadPeriodosInativos();
                              toast.success(`${alunoNome} reativado(a) com sucesso.`);
                              loadMensalidadesDoMes();
                            } catch (err: any) {
                              console.error('Erro ao reativar aluno:', err);
                              toast.error('Não foi possível reativar o aluno.');
                            }
                          })();
                        }
                      }}
                      className="flex-shrink-0 min-h-[44px] px-3"
                    >
                      <span
                        className={`px-3 py-2 rounded-full text-xs font-medium ${
                          activeForThisMonth(aluno)
                            ? 'bg-green-500/20 text-green-500'
                            : 'bg-gray-light/20 text-gray-light'
                        }`}
                      >
                        {activeForThisMonth(aluno) ? 'Ativo' : 'Inativo'}
                      </span>
                    </button>
                  </div>

                  {/* Informações Principais */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-light text-xs mb-1">Mensalidade</p>
                      <p className="text-white font-semibold">
                        {activeForThisMonth(aluno) ? (
                          currencyFormatter.format(
                            typeof aluno.monthly_fee === 'number'
                              ? aluno.monthly_fee
                              : parseFloat(String(aluno.monthly_fee)) || 0
                          )
                        ) : (
                          <span className="text-gray-light">-</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-light text-xs mb-1">Status Pagamento</p>
                      {activeForThisMonth(aluno) ? (
                        <button
                          type="button"
                          onClick={async () => {
                            if (!user) return;
                            const mensAluno = getMensalidadeAluno(aluno.id);
                            if (!mensAluno) {
                              toast.error('Mensalidade do mês não encontrada. Recarregue a página.');
                              return;
                            }
                            const current = mensAluno.status || 'pendente';
                            const ordem: Array<'pendente' | 'pago'> = ['pendente', 'pago'];
                            const idx = ordem.indexOf(current);
                            const next = ordem[(idx + 1) % ordem.length];
                            try {
                              await updateMensalidadeStatus(mensAluno.id, next);
                              setMensalidadesMes((prev) =>
                                prev.map((m) =>
                                  m.id === mensAluno.id ? { ...m, status: next, paid_date: next === 'pago' ? new Date().toISOString().slice(0, 10) : null } : m
                                )
                              );
                              toast.success(`Status de pagamento de ${alunoNome} atualizado para "${next}".`);
                            } catch (err: any) {
                              console.error('Erro ao atualizar status de pagamento:', err);
                              toast.error('Não foi possível atualizar o status de pagamento.');
                            }
                          }}
                          className="min-h-[44px] w-full"
                        >
                          <span
                            className={`px-3 py-2 rounded-full text-xs font-medium block text-center ${
                              getStatusAluno(aluno.id) === 'pago'
                                ? 'bg-green-500/20 text-green-500'
                                : 'bg-primary/20 text-primary'
                            }`}
                          >
                            {getStatusAluno(aluno.id) === 'pago'
                              ? 'Pago'
                              : getStatusAluno(aluno.id) === 'atrasado'
                              ? 'Atrasado'
                              : 'Pendente'}
                          </span>
                        </button>
                      ) : (
                        <span className="text-gray-light">-</span>
                      )}
                    </div>
                  </div>

                  {/* Informações Secundárias (Ocultas por padrão, podem ser expandidas) */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-light text-xs mb-1">Vencimento</p>
                      <p className="text-white">
                        {activeForThisMonth(aluno)
                          ? (aluno.payment_day
                              ? `Dia ${aluno.payment_day}`
                              : '-')
                          : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-light text-xs mb-1">Frequência</p>
                      <p className="text-white">
                        {activeForThisMonth(aluno)
                          ? (aluno.frequency_per_week
                              ? `${aluno.frequency_per_week}x/semana`
                              : '-')
                          : '-'}
                      </p>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-dark">
                    <button
                      onClick={() => navigate(`/alunos/${aluno.id}`)}
                      className="flex items-center gap-2 text-primary hover:text-primary-light transition-colors min-h-[44px] px-4"
                    >
                      <Eye size={18} />
                      <span className="text-sm">Ver</span>
                    </button>
                    <button
                      onClick={() => handleEdit(aluno)}
                      className="flex items-center gap-2 text-yellow-500 hover:text-yellow-400 transition-colors min-h-[44px] px-4"
                    >
                      <Edit size={18} />
                      <span className="text-sm">Editar</span>
                    </button>
                    <button
                      onClick={() => handleDelete(aluno.id, alunoNome)}
                      className="flex items-center gap-2 text-primary hover:text-primary-light transition-colors min-h-[44px] px-4"
                    >
                      <Trash2 size={18} />
                      <span className="text-sm">Excluir</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
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
              Você tem certeza que deseja inativar{' '}
              <strong className="text-white">{confirmInativarAluno.nome || confirmInativarAluno.name || 'este aluno'}</strong>?
              A partir de <strong className="text-white">{format(mesRef, 'MMMM/yyyy', { locale: ptBR })}</strong> ele constará como inativo.
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
                  const primeiroDiaMes = format(mesRef, 'yyyy-MM-dd');
                  try {
                    await criarPeriodoInativo(aluno.id, user.id, primeiroDiaMes);
                    const { error } = await supabase
                      .from('alunos')
                      .update({ active: false, data_inativacao: primeiroDiaMes })
                      .eq('id', aluno.id);
                    if (error) throw error;
                    setAlunos((prev) =>
                      prev.map((a) =>
                        a.id === aluno.id ? { ...a, active: false, data_inativacao: primeiroDiaMes } : a
                      )
                    );
                    await loadPeriodosInativos();
                    toast.success(`${aluno.nome || aluno.name || 'Aluno'} marcado como inativo a partir de ${format(mesRef, 'MMMM/yyyy', { locale: ptBR })}.`);
                    loadMensalidadesDoMes();
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
