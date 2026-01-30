import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, Edit, Trash2, Users } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import type { Aluno } from '../../types';
import { CadastroAlunoModal } from './CadastroAlunoModal';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { maskWhatsApp } from '../../utils/masks';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/** Lista todos os alunos inativos (data_inativacao preenchida), com data em que foram inativados. */
export const AlunosInativos = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingAluno, setEditingAluno] = useState<Aluno | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (user) loadInativos();
  }, [user]);

  const loadInativos = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('alunos')
        .select('*')
        .eq('personal_id', user.id)
        .not('data_inativacao', 'is', null)
        .order('data_inativacao', { ascending: false });

      if (error) throw error;
      setAlunos((data || []) as Aluno[]);
    } catch (err: any) {
      console.error('Erro ao carregar inativos:', err);
      toast.error('Erro ao carregar alunos inativos');
    } finally {
      setLoading(false);
    }
  };

  const formatInativoDesde = (dataInativacao: string | null | undefined): string => {
    if (!dataInativacao || String(dataInativacao).length < 10) return '-';
    const [y, m] = String(dataInativacao).slice(0, 10).split('-').map(Number);
    return format(new Date(y, m - 1, 1), 'MMMM/yyyy', { locale: ptBR });
  };

  const filtered = alunos.filter((a) =>
    (a.nome || a.name || '').toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  const handleDelete = async (id: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja excluir o aluno "${nome}"?`)) return;
    try {
      const { error } = await supabase.from('alunos').delete().eq('id', id);
      if (error) throw error;
      toast.success('Aluno excluído.');
      loadInativos();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao excluir');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-sans font-semibold text-white mb-2">Alunos inativos</h1>
          <p className="text-gray-light text-sm sm:text-base">
            Todos que foram inativados, com a data a partir da qual ficaram inativos. Reative ou edite quando quiser.
          </p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/alunos')} className="min-h-[44px]">
          <Users size={20} className="mr-2" />
          Voltar para Alunos
        </Button>
      </div>

      <Card>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-light" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-core w-full pl-10"
          />
        </div>

        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-dark">
                <th className="text-left py-3 px-4 text-gray-light font-medium">Aluno</th>
                <th className="text-left py-3 px-4 text-gray-light font-medium">WhatsApp</th>
                <th className="text-left py-3 px-4 text-gray-light font-medium">Inativo desde</th>
                <th className="text-left py-3 px-4 text-gray-light font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="text-center py-8 text-gray-light">Carregando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-gray-light">
                  {searchTerm.trim() ? 'Nenhum aluno inativo encontrado' : 'Nenhum aluno inativo'}
                </td></tr>
              ) : (
                filtered.map((aluno) => {
                  const nome = aluno.nome || aluno.name || 'Sem nome';
                  return (
                    <tr key={aluno.id} className="border-b border-gray-dark hover:bg-dark-soft transition-colors">
                      <td className="py-4 px-4 text-white">{nome}</td>
                      <td className="py-4 px-4 text-gray-light">{aluno.whatsapp ? maskWhatsApp(aluno.whatsapp) : '-'}</td>
                      <td className="py-4 px-4 text-gray-light">{formatInativoDesde(aluno.data_inativacao)}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const { error } = await supabase.from('alunos').update({ active: true, data_inativacao: null }).eq('id', aluno.id);
                                if (error) throw error;
                                setAlunos((prev) => prev.filter((a) => a.id !== aluno.id));
                                toast.success(`${nome} reativado(a).`);
                              } catch (err: any) {
                                toast.error('Não foi possível reativar.');
                              }
                            }}
                            className="text-green-500 hover:text-green-400 text-sm font-medium min-h-[44px]"
                          >
                            Reativar
                          </button>
                          <button onClick={() => navigate(`/alunos/${aluno.id}`)} className="text-primary hover:text-primary-light min-h-[44px] min-w-[44px] flex items-center justify-center" title="Ver"><Eye size={18} /></button>
                          <button onClick={() => { setEditingAluno(aluno); setShowModal(true); }} className="text-yellow-500 hover:text-yellow-400 min-h-[44px] min-w-[44px] flex items-center justify-center" title="Editar"><Edit size={18} /></button>
                          <button onClick={() => handleDelete(aluno.id, nome)} className="text-primary hover:text-primary-light min-h-[44px] min-w-[44px] flex items-center justify-center" title="Excluir"><Trash2 size={18} /></button>
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
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-gray-light">
              {searchTerm.trim() ? 'Nenhum aluno inativo encontrado' : 'Nenhum aluno inativo'}
            </div>
          ) : (
            filtered.map((aluno) => {
              const nome = aluno.nome || aluno.name || 'Sem nome';
              return (
                <div key={aluno.id} className="bg-dark-soft border border-gray-dark rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-white font-semibold truncate">{nome}</h3>
                    <span className="text-gray-light text-xs shrink-0">Desde {formatInativoDesde(aluno.data_inativacao)}</span>
                  </div>
                  {aluno.whatsapp && <p className="text-gray-light text-sm">{maskWhatsApp(aluno.whatsapp)}</p>}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-dark">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const { error } = await supabase.from('alunos').update({ active: true, data_inativacao: null }).eq('id', aluno.id);
                          if (error) throw error;
                          setAlunos((prev) => prev.filter((a) => a.id !== aluno.id));
                          toast.success(`${nome} reativado(a).`);
                        } catch { toast.error('Não foi possível reativar.'); }
                      }}
                      className="text-green-500 hover:text-green-400 text-sm font-medium min-h-[44px] px-4"
                    >
                      Reativar
                    </button>
                    <button onClick={() => navigate(`/alunos/${aluno.id}`)} className="text-primary hover:text-primary-light text-sm min-h-[44px] px-4">Ver</button>
                    <button onClick={() => { setEditingAluno(aluno); setShowModal(true); }} className="text-yellow-500 hover:text-yellow-400 text-sm min-h-[44px] px-4">Editar</button>
                    <button onClick={() => handleDelete(aluno.id, nome)} className="text-primary hover:text-primary-light text-sm min-h-[44px] px-4">Excluir</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {showModal && editingAluno && (
        <CadastroAlunoModal
          aluno={editingAluno}
          onClose={() => {
            setShowModal(false);
            setEditingAluno(null);
            loadInativos();
          }}
        />
      )}
    </div>
  );
};
