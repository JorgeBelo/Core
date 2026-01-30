import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Eye, Edit, Trash2, CheckCircle, Clock, DollarSign } from 'lucide-react';
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
import { format, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toDateOnlyString } from '../../utils/dateUtils';

export const Alunos = () => {
  const { user } = useAuth();
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [mensalidadesMes, setMensalidadesMes] = useState<MensalidadeRow[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAluno, setEditingAluno] = useState<Aluno | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmInativarAluno, setConfirmInativarAluno] = useState<Aluno | null>(null);
  const navigate = useNavigate();

  const hoje = new Date();
  const inicioMesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const anoAtual = hoje.getFullYear();
  const mesAtual = hoje.getMonth() + 1;

  useEffect(() => {
    if (user) {
      loadAlunos();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadMensalidadesDoMes();
    }
  }, [user, anoAtual, mesAtual]);

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

  /** Aluno ativo no mês atual: não inativado no mês OU reativado a partir de um mês que já passou (compara YYYY-MM-DD). */
  const activeForThisMonth = (aluno: Aluno): boolean => {
    const ultimoDiaMesStr = format(endOfMonth(inicioMesAtual), 'yyyy-MM-dd');
    const dataInativacao = aluno.data_inativacao;
    const dataReativacao = aluno.data_reativacao;
    const inativacaoStr = dataInativacao ? toDateOnlyString(dataInativacao) : '';
    const reativacaoStr = dataReativacao ? toDateOnlyString(dataReativacao) : '';
    const inativoNesteMes = inativacaoStr && inativacaoStr.length >= 10 && inativacaoStr <= ultimoDiaMesStr;
    const reativadoAteEsteMes = reativacaoStr && reativacaoStr.length >= 10 && reativacaoStr <= ultimoDiaMesStr;
    if (!inativoNesteMes) return true;
    return !!reativadoAteEsteMes;
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

  const alunosAtivosNoMes = alunos.filter((a) => activeForThisMonth(a));
  const matchesSearch = (nome: string) =>
    nome.toLowerCase().includes(searchTerm.toLowerCase().trim());
  const filteredAtivosNoMes = alunosAtivosNoMes.filter((a) =>
    matchesSearch(a.nome || a.name || '')
  );

  const currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  });

  const mensalidadesAtivosNoMes = mensalidadesMes.filter((m) =>
    alunosAtivosNoMes.some((a) => a.id === m.aluno_id)
  );

  const totalRecebido = mensalidadesAtivosNoMes
    .filter((m) => m.status === 'pago')
    .reduce((sum, m) => sum + (typeof m.amount === 'number' ? m.amount : parseFloat(String(m.amount)) || 0), 0);

  const totalPendentes = mensalidadesAtivosNoMes
    .filter((m) => m.status !== 'pago')
    .reduce((sum, m) => sum + (typeof m.amount === 'number' ? m.amount : parseFloat(String(m.amount)) || 0), 0);

  const totalMes = mensalidadesAtivosNoMes.reduce(
    (sum, m) => sum + (typeof m.amount === 'number' ? m.amount : parseFloat(String(m.amount)) || 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-sans font-semibold text-white mb-2">Alunos</h1>
          <p className="text-gray-light text-sm sm:text-base">
            Gerencie seus alunos e status de pagamento por mês. Quem for inativado some daqui e fica em <strong className="text-white">Alunos → Inativos</strong> com a data registrada.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={() => navigate('/alunos/inativos')} className="min-h-[44px]">
            Ver inativos
          </Button>
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
      </div>

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

      {/* Busca (vale para as duas seções) */}
      <Card>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-light" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-core w-full pl-10"
          />
        </div>
      </Card>

      {/* Seção 1: Alunos ativos no mês (lista principal com pagamentos) */}
      <Card>
        <h2 className="text-lg font-semibold text-white mb-4">
          Alunos ativos em {format(inicioMesAtual, 'MMMM/yyyy', { locale: ptBR })}
        </h2>
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
                <th className="text-left py-3 px-4 text-gray-light font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-light">Carregando...</td>
                </tr>
              ) : filteredAtivosNoMes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-light">
                    {searchTerm.trim() ? 'Nenhum aluno ativo encontrado' : 'Nenhum aluno ativo neste mês'}
                  </td>
                </tr>
              ) : (
                filteredAtivosNoMes.map((aluno) => {
                  const alunoNome = aluno.nome || aluno.name || 'Sem nome';
                  return (
                    <tr key={aluno.id} className="border-b border-gray-dark hover:bg-dark-soft transition-colors">
                      <td className="py-4 px-4 text-white">
                        <span
                          className={`inline-block w-2 h-2 rounded-full mr-2 ${
                            getStatusAluno(aluno.id) === 'pago' ? 'bg-green-500' : 'bg-primary'
                          }`}
                        />
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
                        {aluno.frequency_per_week ? `${aluno.frequency_per_week}x/semana` : '-'}
                      </td>
                      <td className="py-4 px-4 text-gray-light">
                        {aluno.payment_day ? `Todo dia ${aluno.payment_day}` : '-'}
                      </td>
                      <td className="py-4 px-4">
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
                            const next = ordem[(ordem.indexOf(current) + 1) % ordem.length];
                            try {
                              await updateMensalidadeStatus(mensAluno.id, next);
                              setMensalidadesMes((prev) =>
                                prev.map((m) =>
                                  m.id === mensAluno.id ? { ...m, status: next, paid_date: next === 'pago' ? new Date().toISOString().slice(0, 10) : null } : m
                                )
                              );
                              toast.success(`Status de ${alunoNome} atualizado para "${next}".`);
                            } catch (err: any) {
                              console.error('Erro ao atualizar status:', err);
                              toast.error('Não foi possível atualizar o status.');
                            }
                          }}
                          className="focus:outline-none min-h-[44px]"
                        >
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              getStatusAluno(aluno.id) === 'pago' ? 'bg-green-500/20 text-green-500' : 'bg-primary/20 text-primary'
                            }`}
                          >
                            {getStatusAluno(aluno.id) === 'pago' ? 'Pago' : getStatusAluno(aluno.id) === 'atrasado' ? 'Atrasado' : 'Pendente'}
                          </span>
                        </button>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setConfirmInativarAluno(aluno)}
                            className="text-gray-light hover:text-white text-xs font-medium min-h-[44px]"
                            title="Marcar como inativo a partir deste mês"
                          >
                            Inativar
                          </button>
                          <button onClick={() => navigate(`/alunos/${aluno.id}`)} className="text-primary hover:text-primary-light min-h-[44px] min-w-[44px] flex items-center justify-center" title="Ver"><Eye size={18} /></button>
                          <button onClick={() => handleEdit(aluno)} className="text-yellow-500 hover:text-yellow-400 min-h-[44px] min-w-[44px] flex items-center justify-center" title="Editar"><Edit size={18} /></button>
                          <button onClick={() => handleDelete(aluno.id, alunoNome)} className="text-primary hover:text-primary-light min-h-[44px] min-w-[44px] flex items-center justify-center" title="Excluir"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="lg:hidden space-y-4">
          {loading ? (
            <div className="text-center py-8 text-gray-light">Carregando...</div>
          ) : filteredAtivosNoMes.length === 0 ? (
            <div className="text-center py-8 text-gray-light">
              {searchTerm.trim() ? 'Nenhum aluno ativo encontrado' : 'Nenhum aluno ativo neste mês'}
            </div>
          ) : (
            filteredAtivosNoMes.map((aluno) => {
              const alunoNome = aluno.nome || aluno.name || 'Sem nome';
              return (
                <div key={aluno.id} className="bg-dark-soft border border-gray-dark rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className={`flex-shrink-0 w-3 h-3 rounded-full ${getStatusAluno(aluno.id) === 'pago' ? 'bg-green-500' : 'bg-primary'}`} />
                      <h3 className="text-white font-semibold truncate">{alunoNome}</h3>
                    </div>
                    <button type="button" onClick={() => setConfirmInativarAluno(aluno)} className="text-gray-light hover:text-white text-xs font-medium shrink-0">Inativar</button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-light text-xs mb-1">Mensalidade</p>
                      <p className="text-white font-semibold">{currencyFormatter.format(typeof aluno.monthly_fee === 'number' ? aluno.monthly_fee : parseFloat(String(aluno.monthly_fee)) || 0)}</p>
                    </div>
                    <div>
                      <p className="text-gray-light text-xs mb-1">Status</p>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!user) return;
                          const mensAluno = getMensalidadeAluno(aluno.id);
                          if (!mensAluno) return;
                          const next = getStatusAluno(aluno.id) === 'pago' ? 'pendente' : 'pago';
                          try {
                            await updateMensalidadeStatus(mensAluno.id, next);
                            setMensalidadesMes((prev) => prev.map((m) => m.id === mensAluno.id ? { ...m, status: next, paid_date: next === 'pago' ? new Date().toISOString().slice(0, 10) : null } : m));
                            toast.success(`Status de ${alunoNome}: ${next}.`);
                          } catch { toast.error('Erro ao atualizar.'); }
                        }}
                        className="w-full min-h-[44px]"
                      >
                        <span className={`px-3 py-2 rounded-full text-xs font-medium block text-center ${getStatusAluno(aluno.id) === 'pago' ? 'bg-green-500/20 text-green-500' : 'bg-primary/20 text-primary'}`}>
                          {getStatusAluno(aluno.id) === 'pago' ? 'Pago' : 'Pendente'}
                        </span>
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-gray-dark">
                    <button onClick={() => navigate(`/alunos/${aluno.id}`)} className="flex items-center gap-2 text-primary hover:text-primary-light text-sm min-h-[44px]"><Eye size={18} /> Ver</button>
                    <button onClick={() => handleEdit(aluno)} className="flex items-center gap-2 text-yellow-500 hover:text-yellow-400 text-sm min-h-[44px]"><Edit size={18} /> Editar</button>
                    <button onClick={() => handleDelete(aluno.id, alunoNome)} className="flex items-center gap-2 text-primary hover:text-primary-light text-sm min-h-[44px]"><Trash2 size={18} /> Excluir</button>
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
              A partir de <strong className="text-white">{format(inicioMesAtual, 'MMMM/yyyy', { locale: ptBR })}</strong> ele constará como inativo.
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
                  const y = hoje.getFullYear();
                  const m = hoje.getMonth() + 1;
                  const primeiroDiaMes = `${y}-${String(m).padStart(2, '0')}-01`;
                  try {
                    const { error } = await supabase
                      .from('alunos')
                      .update({ active: false, data_inativacao: primeiroDiaMes, data_reativacao: null })
                      .eq('id', aluno.id);
                    if (error) throw error;
                    setAlunos((prev) =>
                      prev.map((a) =>
                        a.id === aluno.id ? { ...a, active: false, data_inativacao: primeiroDiaMes } : a
                      )
                    );
                    toast.success(`${aluno.nome || aluno.name || 'Aluno'} marcado como inativo a partir de ${format(inicioMesAtual, 'MMMM/yyyy', { locale: ptBR })}.`);
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
