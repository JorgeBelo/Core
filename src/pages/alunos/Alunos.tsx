import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Eye, Edit, Trash2, FileText } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import type { Aluno } from '../../types';
import { CadastroAlunoModal } from './CadastroAlunoModal';
import { RelatorioAlunosModal } from './RelatorioAlunosModal';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useUserProfile } from '../../hooks/useUserProfile';
import { maskWhatsApp } from '../../utils/masks';
import toast from 'react-hot-toast';

type FiltroAtivo = 'todos' | 'ativos' | 'inativos';

export const Alunos = () => {
  const { user } = useAuth();
  const { userProfile } = useUserProfile();
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroAtivo, setFiltroAtivo] = useState<FiltroAtivo>('todos');
  const [showModal, setShowModal] = useState(false);
  const [showRelatorioModal, setShowRelatorioModal] = useState(false);
  const [editingAluno, setEditingAluno] = useState<Aluno | null>(null);
  const [loading, setLoading] = useState(true);
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

      setAlunos((data || []) as Aluno[]);
    } catch (error: any) {
      console.error('Erro ao carregar alunos:', error);
      toast.error('Erro ao carregar alunos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, nome: string) => {
    const msg =
      'Tem certeza que deseja excluir o aluno "' +
      nome +
      '"?\n\n' +
      'O aluno sairá da lista.';
    if (!confirm(msg)) {
      return;
    }

    try {
      const { error } = await supabase.from('alunos').delete().eq('id', id);

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

  const handleToggleAtivo = async (aluno: Aluno) => {
    if (!user) return;
    const nome = aluno.nome || aluno.name || 'Aluno';
    const novoActive = aluno.active === false;
    try {
      const { error } = await supabase
        .from('alunos')
        .update({ active: novoActive })
        .eq('id', aluno.id);
      if (error) throw error;
      toast.success(novoActive ? `${nome} reativado.` : `${nome} marcado como inativo.`);
      loadAlunos();
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error);
      toast.error(error.message || 'Erro ao atualizar');
    }
  };

  const matchesSearch = (nome: string) =>
    nome.toLowerCase().includes(searchTerm.toLowerCase().trim());

  const alunosFiltradosPorAtivo = alunos.filter((a) => {
    if (filtroAtivo === 'todos') return true;
    if (filtroAtivo === 'ativos') return a.active !== false;
    return a.active === false;
  });

  const filteredAlunos = alunosFiltradosPorAtivo
    .filter((a) => matchesSearch(a.nome || a.name || ''))
    .sort((a, b) =>
      (a.nome || a.name || '').localeCompare(b.nome || b.name || '', 'pt-BR')
    );

  const currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  });

  const diaVencimento = (dia: number | undefined) =>
    dia != null && dia >= 1 && dia <= 31 ? String(dia).padStart(2, '0') : '-';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-sans font-semibold text-white mb-2">Alunos</h1>
          <p className="text-gray-light text-sm sm:text-base">
            Cadastro de alunos. Ativo/Inativo é só um filtro visual.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            onClick={() => setShowRelatorioModal(true)}
            variant="secondary"
            className="flex items-center w-full sm:w-auto justify-center min-h-[44px]"
          >
            <FileText size={20} className="mr-2" />
            <span className="hidden sm:inline">Relatório de Alunos</span>
            <span className="sm:hidden">Relatório</span>
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

      {/* Filtro Ativo / Inativo */}
      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-gray-light text-sm mr-2">Ver:</span>
          {(['todos', 'ativos', 'inativos'] as const).map((op) => (
            <button
              key={op}
              type="button"
              onClick={() => setFiltroAtivo(op)}
              className={`min-h-[44px] px-4 rounded-lg text-sm font-medium transition-colors ${
                filtroAtivo === op
                  ? 'bg-primary text-white'
                  : 'bg-dark-soft text-gray-light hover:text-white border border-gray-dark'
              }`}
            >
              {op === 'todos' ? 'Todos' : op === 'ativos' ? 'Ativos' : 'Inativos'}
            </button>
          ))}
        </div>
      </Card>

      {/* Busca */}
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

      {/* Lista de alunos */}
      <Card>
        <h2 className="text-lg font-semibold text-white mb-4">Lista de alunos</h2>
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-dark">
                <th className="text-left py-3 px-4 text-gray-light font-medium">Aluno</th>
                <th className="text-left py-3 px-4 text-gray-light font-medium">WhatsApp</th>
                <th className="text-left py-3 px-4 text-gray-light font-medium">Mensalidade</th>
                <th className="text-left py-3 px-4 text-gray-light font-medium">Freq. semana</th>
                <th className="text-left py-3 px-4 text-gray-light font-medium">Dia venc.</th>
                <th className="text-left py-3 px-4 text-gray-light font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-light">Carregando...</td>
                </tr>
              ) : filteredAlunos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-light">
                    {searchTerm.trim() ? 'Nenhum aluno encontrado' : 'Nenhum aluno cadastrado'}
                  </td>
                </tr>
              ) : (
                filteredAlunos.map((aluno) => {
                  const alunoNome = aluno.nome || aluno.name || 'Sem nome';
                  const inativo = aluno.active === false;
                  return (
                    <tr key={aluno.id} className="border-b border-gray-dark hover:bg-dark-soft transition-colors">
                      <td className="py-4 px-4 text-white">
                        <span
                          className={`inline-block w-2 h-2 rounded-full mr-2 ${
                            inativo ? 'bg-red-500' : 'bg-green-500'
                          }`}
                        />
                        {alunoNome}
                      </td>
                      <td className="py-4 px-4 text-gray-light">
                        {aluno.whatsapp ? maskWhatsApp(aluno.whatsapp) : '-'}
                      </td>
                      <td className="py-4 px-4 text-white font-semibold">
                        {inativo ? '-' : currencyFormatter.format(
                          typeof aluno.monthly_fee === 'number'
                            ? aluno.monthly_fee
                            : parseFloat(String(aluno.monthly_fee)) || 0
                        )}
                      </td>
                      <td className="py-4 px-4 text-gray-light">
                        {inativo ? '-' : (aluno.frequency_per_week ? `${aluno.frequency_per_week}x/semana` : '-')}
                      </td>
                      <td className="py-4 px-4 text-gray-light tabular-nums">
                        {inativo ? '-' : diaVencimento(aluno.payment_day)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleToggleAtivo(aluno)}
                            className="text-gray-light hover:text-white text-xs font-medium min-h-[44px]"
                            title={inativo ? 'Reativar' : 'Marcar como inativo'}
                          >
                            {inativo ? 'Reativar' : 'Inativar'}
                          </button>
                          <button onClick={() => navigate(`/alunos/${aluno.id}`)} className="text-primary hover:text-primary-light min-h-[44px] min-w-[44px] flex items-center justify-center" title="Ver">
                            <Eye size={18} />
                          </button>
                          <button onClick={() => handleEdit(aluno)} className="text-yellow-500 hover:text-yellow-400 min-h-[44px] min-w-[44px] flex items-center justify-center" title="Editar">
                            <Edit size={18} />
                          </button>
                          <button onClick={() => handleDelete(aluno.id, alunoNome)} className="text-primary hover:text-primary-light min-h-[44px] min-w-[44px] flex items-center justify-center" title="Excluir">
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
        <div className="lg:hidden space-y-4">
          {loading ? (
            <div className="text-center py-8 text-gray-light">Carregando...</div>
          ) : filteredAlunos.length === 0 ? (
            <div className="text-center py-8 text-gray-light">
              {searchTerm.trim() ? 'Nenhum aluno encontrado' : 'Nenhum aluno cadastrado'}
            </div>
          ) : (
            filteredAlunos.map((aluno) => {
              const alunoNome = aluno.nome || aluno.name || 'Sem nome';
              const inativo = aluno.active === false;
              return (
                <div key={aluno.id} className="bg-dark-soft border border-gray-dark rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className={`flex-shrink-0 w-3 h-3 rounded-full ${inativo ? 'bg-red-500' : 'bg-green-500'}`} />
                      <h3 className="text-white font-semibold truncate">{alunoNome}</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleAtivo(aluno)}
                      className="text-gray-light hover:text-white text-xs font-medium shrink-0 min-h-[44px]"
                    >
                      {inativo ? 'Reativar' : 'Inativar'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-light text-xs mb-1">Mensalidade</p>
                      <p className="text-white font-semibold">
                        {inativo ? '-' : currencyFormatter.format(typeof aluno.monthly_fee === 'number' ? aluno.monthly_fee : parseFloat(String(aluno.monthly_fee)) || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-light text-xs mb-1">Freq.</p>
                      <p className="text-white">{inativo ? '-' : (aluno.frequency_per_week ? `${aluno.frequency_per_week}x/semana` : '-')}</p>
                    </div>
                    <div>
                      <p className="text-gray-light text-xs mb-1">Dia venc.</p>
                      <p className="text-white tabular-nums">{inativo ? '-' : diaVencimento(aluno.payment_day)}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-dark">
                    <button onClick={() => navigate(`/alunos/${aluno.id}`)} className="flex items-center gap-2 text-primary hover:text-primary-light text-sm min-h-[44px]">
                      <Eye size={18} /> Ver
                    </button>
                    <button onClick={() => handleEdit(aluno)} className="flex items-center gap-2 text-yellow-500 hover:text-yellow-400 text-sm min-h-[44px]">
                      <Edit size={18} /> Editar
                    </button>
                    <button onClick={() => handleDelete(aluno.id, alunoNome)} className="flex items-center gap-2 text-primary hover:text-primary-light text-sm min-h-[44px]">
                      <Trash2 size={18} /> Excluir
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

      <RelatorioAlunosModal
        open={showRelatorioModal}
        onClose={() => setShowRelatorioModal(false)}
        userProfile={userProfile ?? null}
        alunos={filteredAlunos}
      />
    </div>
  );
};
