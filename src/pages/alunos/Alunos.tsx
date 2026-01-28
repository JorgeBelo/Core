import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Eye, Filter, Edit, Trash2 } from 'lucide-react';
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

      setAlunos(data || []);
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
        >
          <Plus size={20} className="mr-2" />
          Cadastrar Novo Aluno
        </Button>
      </div>

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
                <th className="text-left py-3 px-4 text-gray-light font-medium">Nome</th>
                <th className="text-left py-3 px-4 text-gray-light font-medium">WhatsApp</th>
                <th className="text-left py-3 px-4 text-gray-light font-medium">Mensalidade</th>
                <th className="text-left py-3 px-4 text-gray-light font-medium">Dia Pagamento</th>
                <th className="text-left py-3 px-4 text-gray-light font-medium">Status Pagamento</th>
                <th className="text-left py-3 px-4 text-gray-light font-medium">Status</th>
                <th className="text-left py-3 px-4 text-gray-light font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-light">
                    Carregando...
                  </td>
                </tr>
              ) : filteredAlunos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-light">
                    Nenhum aluno encontrado
                  </td>
                </tr>
              ) : (
                filteredAlunos.map((aluno) => {
                  // Usa 'nome' (coluna do banco) se existir, senão usa 'name' (compatibilidade)
                  const alunoNome = aluno.nome || aluno.name || 'Sem nome';
                  return (
                    <tr key={aluno.id} className="border-b border-gray-dark hover:bg-dark-soft transition-colors">
                    <td className="py-4 px-4 text-white">{alunoNome}</td>
                    <td className="py-4 px-4 text-gray-light">
                      {aluno.whatsapp ? maskWhatsApp(aluno.whatsapp) : '-'}
                    </td>
                    <td className="py-4 px-4 text-white font-semibold">
                      R$ {aluno.monthly_fee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-4 text-gray-light">
                      Dia {aluno.payment_day || '-'}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          aluno.payment_status === 'pago'
                            ? 'bg-green-500/20 text-green-500'
                            : aluno.payment_status === 'atrasado'
                            ? 'bg-primary/20 text-primary'
                            : 'bg-yellow-500/20 text-yellow-500'
                        }`}
                      >
                        {aluno.payment_status === 'pago'
                          ? 'Pago'
                          : aluno.payment_status === 'atrasado'
                          ? 'Atrasado'
                          : 'Pendente'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          aluno.active
                            ? 'bg-green-500/20 text-green-500'
                            : 'bg-gray-light/20 text-gray-light'
                        }`}
                      >
                        {aluno.active ? 'Ativo' : 'Inativo'}
                      </span>
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
    </div>
  );
};
